import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { z } from "zod";
import { env } from "./env.js";
import { adminSupabase, createUserSupabase } from "./supabase.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS."));
    },
  }),
);

const roles = ["admin", "manager", "supervisor", "operator", "viewer"];
const appAreas = ["dashboard", "production", "inventory", "quality", "hr", "maintenance", "finance", "notifications", "settings"];
const uuid = z.string().uuid();
const optionalText = z.string().trim().min(1).optional();
const showSeedData = process.env.SHOW_SEED_DATA === "true";
const decodeSeed = (value) => Buffer.from(value, "base64").toString("utf8");
const seededMachineCodes = new Set(["Q05DLTAx", "QVNNLTA0", "Q1VULTA5", "UEtHLTA3", "UFJTLTAy"].map(decodeSeed));
const seededOrderNumbers = new Set(["UE8tMjYwNjEzLTAwMQ==", "UE8tMjYwNjEzLTAwMg==", "UE8tMjYwNjEzLTAwMw=="].map(decodeSeed));
const seededSkus = new Set(["Uk0tU1RMLThNTQ==", "U1AtQlJHLTYyMDU=", "UEtHLUNSVC1N", "RkctVkxWLTE4"].map(decodeSeed));

const stripSeedRows = (area, rows) => {
  if (showSeedData || !Array.isArray(rows)) return rows;
  if (area === "machines") return rows.filter((row) => !seededMachineCodes.has(row.machine_code));
  if (area === "orders") return rows.filter((row) => !seededOrderNumbers.has(row.order_number));
  if (area === "inventory") return rows.filter((row) => !seededSkus.has(row.sku));
  if (area === "quality") return rows.filter((row) => !seededOrderNumbers.has(row.order?.order_number));
  if (area === "maintenance") return rows.filter((row) => !seededMachineCodes.has(row.machine?.machine_code));
  if (area === "finance") return [];
  return rows;
};

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const parseBearerToken = (header) => {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
};

const requireAuth = asyncRoute(async (req, res, next) => {
  const token = parseBearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const { data, error } = await adminSupabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired bearer token." });
    return;
  }

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  req.accessToken = token;
  req.user = data.user;
  req.profile = profile;
  req.supabase = createUserSupabase(token);
  next();
});

const requireRoles = (allowedRoles) => (req, res, next) => {
  const role = req.profile?.role || "viewer";
  if (!allowedRoles.includes(role)) {
    res.status(403).json({
      error: `Requires one of: ${allowedRoles.join(", ")}.`,
      currentRole: role,
      requiredRoles: allowedRoles,
    });
    return;
  }
  next();
};

const sendSupabaseResult = (res, { data, error }, status = 200) => {
  if (error) throw error;
  res.status(status).json({ data });
};

const sendFilteredSupabaseResult = (res, area, result, status = 200) => {
  if (result.error) throw result.error;
  res.status(status).json({ data: stripSeedRows(area, result.data) });
};

const body = (schema, req) => schema.parse(req.body ?? {});

const accountSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  fullName: z.string().trim().min(2),
  department: z.string().trim().min(2),
  employeeId: z.string().trim().min(2),
});

const accessRowSchema = z.object({
  area: z.enum(appAreas),
  canRead: z.boolean(),
  canWrite: z.boolean(),
  canApprove: z.boolean(),
  canAdmin: z.boolean(),
});

const createUserSchema = accountSchema.extend({
  role: z.enum(roles),
  access: z.array(accessRowSchema).optional(),
});

const updateUserProfileSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  role: z.enum(roles).optional(),
  department: z.string().trim().min(2).optional(),
  employeeId: z.string().trim().min(2).optional(),
  avatarUrl: z.string().trim().url().optional().nullable(),
});

const userAccessSchema = z.object({
  access: z.array(accessRowSchema).min(1),
  reason: optionalText,
});

const dbRowToAccess = (row) => ({
  role: row.role,
  area: row.area,
  canRead: row.can_read,
  canWrite: row.can_write,
  canApprove: row.can_approve,
  canAdmin: row.can_admin,
});

const loadRoleAccessMatrix = async () => {
  const { data, error } = await adminSupabase
    .from("role_access_matrix")
    .select("role,area,can_read,can_write,can_approve,can_admin")
    .order("role")
    .order("area");

  if (error) throw error;
  return { source: "database", matrix: (data || []).map(dbRowToAccess) };
};

const getEffectiveUserAccess = async (userId) => {
  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id,role")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const [{ matrix }, overridesResult] = await Promise.all([
    loadRoleAccessMatrix(),
    adminSupabase
      .from("user_access_overrides")
      .select("area,can_read,can_write,can_approve,can_admin")
      .eq("profile_id", userId),
  ]);

  if (overridesResult.error) throw overridesResult.error;

  const overrides = new Map((overridesResult.data || []).map((row) => [row.area, dbRowToAccess({ ...row, role: profile.role })]));
  const roleRows = matrix.filter((row) => row.role === profile.role);

  return {
    userId,
    role: profile.role,
    access: appAreas.map((area) => {
      const baseline = roleRows.find((row) => row.area === area) || {
        canRead: false,
        canWrite: false,
        canApprove: false,
        canAdmin: false,
      };
      const override = overrides.get(area) || null;
      const effective = override || baseline;

      return {
        area,
        role: profile.role,
        baseline: {
          canRead: baseline.canRead,
          canWrite: baseline.canWrite,
          canApprove: baseline.canApprove,
          canAdmin: baseline.canAdmin,
        },
        override: override
          ? {
              canRead: override.canRead,
              canWrite: override.canWrite,
              canApprove: override.canApprove,
              canAdmin: override.canAdmin,
            }
          : null,
        effective: {
          canRead: effective.canRead,
          canWrite: effective.canWrite,
          canApprove: effective.canApprove,
          canAdmin: effective.canAdmin,
        },
      };
    }),
  };
};

const saveUserAccessOverrides = async ({ userId, access, grantedBy, reason }) => {
  const rows = access.map((row) => ({
    profile_id: userId,
    area: row.area,
    can_read: row.canRead,
    can_write: row.canWrite,
    can_approve: row.canApprove,
    can_admin: row.canAdmin,
    granted_by: grantedBy,
    reason: reason || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await adminSupabase
    .from("user_access_overrides")
    .upsert(rows, { onConflict: "profile_id,area" });

  if (error) throw error;
  return getEffectiveUserAccess(userId);
};

const getAdminCount = async () => {
  const { count, error } = await adminSupabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) throw error;
  return count ?? 0;
};

const createFactoryAccount = async (input) => {
  const { data: created, error: createError } = await adminSupabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
    },
    app_metadata: {
      role: input.role,
      department: input.department,
      employee_id: input.employeeId,
    },
  });

  if (createError) throw createError;
  if (!created.user) throw new Error("Supabase did not return a created user.");

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .upsert(
      {
        id: created.user.id,
        full_name: input.fullName,
        role: input.role,
        department: input.department,
        employee_id: input.employeeId,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(created.user.id);
    throw profileError;
  }

  return {
    user: {
      id: created.user.id,
      email: created.user.email,
    },
    profile,
  };
};

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "factoryos-api",
    time: new Date().toISOString(),
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get(
  "/api/setup/status",
  asyncRoute(async (_req, res) => {
    const adminCount = await getAdminCount();
    res.json({
      data: {
        needsSuperAdmin: adminCount === 0,
        adminCount,
      },
    });
  }),
);

app.post(
  "/api/setup/super-admin",
  asyncRoute(async (req, res) => {
    const input = body(accountSchema, req);
    const adminCount = await getAdminCount();

    if (adminCount > 0) {
      res.status(409).json({ error: "Super admin setup is already complete. Sign in with an admin account." });
      return;
    }

    const result = await createFactoryAccount({
      ...input,
      role: "admin",
    });

    res.status(201).json({
      data: {
        ...result,
        setupComplete: true,
      },
    });
  }),
);

app.use("/api", requireAuth);

app.get("/api/me", (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
    },
    profile: req.profile,
  });
});

app.get(
  "/api/role-access",
  asyncRoute(async (req, res) => {
    const role = req.profile?.role || "viewer";
    const { source, matrix } = await loadRoleAccessMatrix();

    res.json({
      data: {
        role,
        source,
        matrix,
        currentRoleAccess: matrix.filter((row) => row.role === role),
      },
    });
  }),
);

app.post(
  "/api/admin/users",
  requireRoles(["admin"]),
  asyncRoute(async (req, res) => {
    const input = body(createUserSchema, req);
    const result = await createFactoryAccount(input);
    const access = input.access?.length
      ? await saveUserAccessOverrides({
          userId: result.profile.id,
          access: input.access,
          grantedBy: req.user.id,
          reason: "Initial account provisioning",
        })
      : null;

    res.status(201).json({
      data: {
        ...result,
        access,
      },
    });
  }),
);

app.patch(
  "/api/admin/users/:userId/profile",
  requireRoles(["admin"]),
  asyncRoute(async (req, res) => {
    const params = z.object({ userId: uuid }).parse(req.params);
    const input = body(updateUserProfileSchema, req);
    const profilePatch = {
      ...(input.fullName ? { full_name: input.fullName } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.department ? { department: input.department } : {}),
      ...(input.employeeId ? { employee_id: input.employeeId } : {}),
      ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error } = await adminSupabase
      .from("profiles")
      .update(profilePatch)
      .eq("id", params.userId)
      .select("*")
      .single();

    if (error) throw error;

    const appMetadata = {
      ...(input.role ? { role: input.role } : {}),
      ...(input.department ? { department: input.department } : {}),
      ...(input.employeeId ? { employee_id: input.employeeId } : {}),
    };

    if (Object.keys(appMetadata).length > 0) {
      const { error: authError } = await adminSupabase.auth.admin.updateUserById(params.userId, {
        app_metadata: appMetadata,
      });
      if (authError) throw authError;
    }

    res.json({ data: profile });
  }),
);

app.get(
  "/api/admin/users/:userId/access",
  requireRoles(["admin"]),
  asyncRoute(async (req, res) => {
    const params = z.object({ userId: uuid }).parse(req.params);
    res.json({ data: await getEffectiveUserAccess(params.userId) });
  }),
);

app.put(
  "/api/admin/users/:userId/access",
  requireRoles(["admin"]),
  asyncRoute(async (req, res) => {
    const params = z.object({ userId: uuid }).parse(req.params);
    const input = body(userAccessSchema, req);
    res.json({
      data: await saveUserAccessOverrides({
        userId: params.userId,
        access: input.access,
        grantedBy: req.user.id,
        reason: input.reason,
      }),
    });
  }),
);

app.get(
  "/api/bootstrap",
  asyncRoute(async (req, res) => {
    const [machines, orders, inventory, notifications] = await Promise.all([
      req.supabase.from("machines").select("*").order("machine_code"),
      req.supabase.from("production_orders").select("*, machine:machines(*), operator:profiles(*)").order("created_at", { ascending: false }).limit(20),
      req.supabase.from("inventory_items").select("*, supplier:suppliers(*)").order("name").limit(50),
      req.supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    for (const result of [machines, orders, inventory, notifications]) {
      if (result.error) throw result.error;
    }

    res.json({
      data: {
        machines: stripSeedRows("machines", machines.data),
        productionOrders: stripSeedRows("orders", orders.data),
        inventoryItems: stripSeedRows("inventory", inventory.data),
        notifications: notifications.data,
      },
    });
  }),
);

app.get(
  "/api/production/orders",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    let query = req.supabase
      .from("production_orders")
      .select("*, machine:machines(*), operator:profiles(*)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);
    sendFilteredSupabaseResult(res, "orders", await query);
  }),
);

app.get(
  "/api/production/orders/:orderId/logs",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    const params = z.object({ orderId: uuid }).parse(req.params);
    sendSupabaseResult(
      res,
      await req.supabase
        .from("production_logs")
        .select("*, entered_by:profiles(*)")
        .eq("order_id", params.orderId)
        .order("created_at", { ascending: false }),
    );
  }),
);

app.get(
  "/api/production/machines",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendFilteredSupabaseResult(res, "machines", await req.supabase.from("machines").select("*").order("machine_code"));
  }),
);

app.get(
  "/api/inventory/items",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendFilteredSupabaseResult(res, "inventory", await req.supabase.from("inventory_items").select("*, supplier:suppliers(*)").order("name"));
  }),
);

app.get(
  "/api/inventory/transactions",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    const itemId = typeof req.query.itemId === "string" ? req.query.itemId : undefined;
    let query = req.supabase.from("inventory_transactions").select("*").order("created_at", { ascending: false });

    if (itemId) query = query.eq("item_id", itemId);
    sendSupabaseResult(res, await query);
  }),
);

const inventoryTransactionSchema = z.object({
  itemId: uuid,
  type: z.enum(["In", "Out", "Transfer", "Adjustment", "in", "out", "transfer", "adjustment"]),
  quantity: z.coerce.number(),
  reference: optionalText,
  notes: optionalText,
  toLocation: optionalText,
});

app.post(
  "/api/inventory/transactions",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    const input = body(inventoryTransactionSchema, req);
    sendSupabaseResult(
      res,
      await req.supabase.rpc("record_inventory_transaction", {
        p_item_id: input.itemId,
        p_type: input.type.toLowerCase(),
        p_quantity: input.quantity,
        p_reference: input.reference || null,
        p_notes: input.notes || null,
        p_to_location: input.toLocation || null,
      }),
      201,
    );
  }),
);

const productionProgressSchema = z.object({
  quantityDelta: z.coerce.number().positive(),
  notes: optionalText,
});

app.post(
  "/api/production/orders/:orderId/progress",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    const input = body(productionProgressSchema, req);
    const params = z.object({ orderId: uuid }).parse(req.params);
    sendSupabaseResult(
      res,
      await req.supabase.rpc("update_production_progress", {
        p_order_id: params.orderId,
        p_quantity_delta: input.quantityDelta,
        p_notes: input.notes || null,
      }),
    );
  }),
);

const productionStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "on_hold", "cancelled"]),
  notes: optionalText,
});

app.patch(
  "/api/production/orders/:orderId/status",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    const input = body(productionStatusSchema, req);
    const params = z.object({ orderId: uuid }).parse(req.params);
    const payload = {
      status: input.status,
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.status === "completed" ? { end_date: new Date().toISOString() } : {}),
    };

    sendSupabaseResult(
      res,
      await req.supabase.from("production_orders").update(payload).eq("id", params.orderId).select("*, machine:machines(*), operator:profiles(*)").single(),
    );
  }),
);

const machineTelemetrySchema = z.object({
  status: z.enum(["running", "idle", "maintenance", "breakdown"]),
  efficiencyPercent: z.coerce.number().min(0).max(100),
  outputRate: z.coerce.number().optional(),
  temperatureC: z.coerce.number().optional(),
  vibrationMmS: z.coerce.number().optional(),
});

app.post(
  "/api/production/machines/:machineId/telemetry",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    const input = body(machineTelemetrySchema, req);
    const params = z.object({ machineId: uuid }).parse(req.params);
    sendSupabaseResult(
      res,
      await req.supabase.rpc("record_machine_telemetry", {
        p_machine_id: params.machineId,
        p_status: input.status,
        p_efficiency_percent: input.efficiencyPercent,
        p_output_rate: input.outputRate || null,
        p_temperature_c: input.temperatureC || null,
        p_vibration_mm_s: input.vibrationMmS || null,
      }),
      201,
    );
  }),
);

app.get(
  "/api/quality/defect-types",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendSupabaseResult(res, await req.supabase.from("defect_types").select("*").order("severity").order("name"));
  }),
);

app.get(
  "/api/quality/checks",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendFilteredSupabaseResult(
      res,
      "quality",
      await req.supabase
        .from("quality_checks")
        .select("*, inspector:profiles(*), order:production_orders(*)")
        .order("created_at", { ascending: false }),
    );
  }),
);

const qualityCheckSchema = z.object({
  orderId: uuid,
  batchNumber: z.string().trim().min(1),
  totalInspected: z.coerce.number().int().positive(),
  passed: z.coerce.number().int().min(0),
  failed: z.coerce.number().int().min(0),
  defectTypes: z.array(z.string().trim().min(1)).default([]),
  notes: optionalText,
  images: z.array(z.string().trim().min(1)).default([]),
});

app.post(
  "/api/quality/checks",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    const input = body(qualityCheckSchema, req);
    sendSupabaseResult(
      res,
      await req.supabase.rpc("submit_quality_check", {
        p_order_id: input.orderId,
        p_batch_number: input.batchNumber,
        p_total_inspected: input.totalInspected,
        p_passed: input.passed,
        p_failed: input.failed,
        p_defect_type: input.defectTypes,
        p_notes: input.notes || null,
        p_images: input.images,
      }),
      201,
    );
  }),
);

app.get(
  "/api/hr/employees",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendSupabaseResult(res, await req.supabase.from("profiles").select("*").order("full_name"));
  }),
);

app.get(
  "/api/hr/attendance",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendSupabaseResult(res, await req.supabase.from("attendance").select("*, employee:profiles(*)").order("date", { ascending: false }));
  }),
);

app.get(
  "/api/hr/leave-requests",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendSupabaseResult(res, await req.supabase.from("leave_requests").select("*, employee:profiles(*)").order("created_at", { ascending: false }));
  }),
);

app.post(
  "/api/hr/clock-in",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    const input = body(z.object({ shiftId: uuid.optional().nullable() }), req);
    sendSupabaseResult(res, await req.supabase.rpc("clock_in", { p_shift_id: input.shiftId || null }), 201);
  }),
);

app.post(
  "/api/hr/clock-out",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    sendSupabaseResult(res, await req.supabase.rpc("clock_out"));
  }),
);

const leaveRequestSchema = z.object({
  type: z.enum(["annual", "sick", "emergency", "unpaid"]),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  reason: z.string().trim().min(1),
});

app.post(
  "/api/hr/leave-requests",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    const input = body(leaveRequestSchema, req);
    sendSupabaseResult(
      res,
      await req.supabase.rpc("request_leave", {
        p_type: input.type,
        p_start_date: input.startDate,
        p_end_date: input.endDate,
        p_reason: input.reason,
      }),
      201,
    );
  }),
);

app.post(
  "/api/hr/leave-requests/:requestId/review",
  requireRoles(["admin", "manager", "supervisor"]),
  asyncRoute(async (req, res) => {
    const params = z.object({ requestId: uuid }).parse(req.params);
    const input = body(z.object({ status: z.enum(["approved", "rejected"]) }), req);
    sendSupabaseResult(
      res,
      await req.supabase.rpc("review_leave_request", {
        p_request_id: params.requestId,
        p_status: input.status,
      }),
    );
  }),
);

const shiftAssignmentSchema = z.object({
  shiftId: uuid,
  employeeId: uuid,
  machineId: uuid.optional().nullable(),
  productionOrderId: uuid.optional().nullable(),
  startsAt: z.string().trim().min(1),
  endsAt: z.string().trim().min(1),
  role: z.string().trim().min(1).default("operator"),
});

app.post(
  "/api/hr/shift-assignments",
  requireRoles(["admin", "manager", "supervisor"]),
  asyncRoute(async (req, res) => {
    const input = body(shiftAssignmentSchema, req);
    sendSupabaseResult(
      res,
      await req.supabase.rpc("assign_shift", {
        p_shift_id: input.shiftId,
        p_employee_id: input.employeeId,
        p_machine_id: input.machineId || null,
        p_production_order_id: input.productionOrderId || null,
        p_starts_at: input.startsAt,
        p_ends_at: input.endsAt,
        p_assignment_role: input.role,
      }),
      201,
    );
  }),
);

app.get(
  "/api/maintenance/tasks",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendFilteredSupabaseResult(
      res,
      "maintenance",
      await req.supabase
        .from("maintenance_tasks")
        .select("*, machine:machines(*), assigned_to:profiles(*)")
        .order("scheduled_date", { ascending: true }),
    );
  }),
);

const maintenanceTaskSchema = z.object({
  machineId: uuid,
  type: z.enum(["preventive", "corrective", "emergency", "inspection"]),
  title: z.string().trim().min(1),
  description: optionalText,
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedTo: uuid.optional().nullable(),
  scheduledDate: z.string().trim().min(1),
  estimatedHours: z.coerce.number().positive(),
  partsUsed: z.array(z.unknown()).default([]),
});

app.post(
  "/api/maintenance/tasks",
  requireRoles(["admin", "manager", "supervisor"]),
  asyncRoute(async (req, res) => {
    const input = body(maintenanceTaskSchema, req);
    sendSupabaseResult(
      res,
      await req.supabase
        .from("maintenance_tasks")
        .insert({
          machine_id: input.machineId,
          type: input.type,
          title: input.title,
          description: input.description || null,
          priority: input.priority,
          status: "open",
          assigned_to: input.assignedTo || null,
          scheduled_date: input.scheduledDate,
          estimated_hours: input.estimatedHours,
          parts_used: input.partsUsed,
        })
        .select("*, machine:machines(*), assigned_to:profiles(*)")
        .single(),
      201,
    );
  }),
);

app.post(
  "/api/maintenance/tasks/:taskId/complete",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    const params = z.object({ taskId: uuid }).parse(req.params);
    const input = body(
      z.object({
        actualHours: z.coerce.number().positive(),
        notes: optionalText,
        partsUsed: z.array(z.unknown()).default([]),
      }),
      req,
    );

    sendSupabaseResult(
      res,
      await req.supabase.rpc("complete_maintenance_task", {
        p_task_id: params.taskId,
        p_actual_hours: input.actualHours,
        p_notes: input.notes || null,
        p_parts_used: input.partsUsed,
      }),
    );
  }),
);

app.get(
  "/api/finance/expenses",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendFilteredSupabaseResult(res, "finance", await req.supabase.from("expenses").select("*").order("date", { ascending: false }));
  }),
);

app.get(
  "/api/finance/budgets",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendFilteredSupabaseResult(res, "finance", await req.supabase.from("budgets").select("*").order("department"));
  }),
);

const expenseSchema = z.object({
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().min(1).default("PKR"),
  date: z.string().trim().min(1),
  department: z.string().trim().min(1),
  receiptUrl: optionalText,
});

app.post(
  "/api/finance/expenses",
  requireRoles(["admin", "manager", "supervisor", "operator"]),
  asyncRoute(async (req, res) => {
    const input = body(expenseSchema, req);
    sendSupabaseResult(
      res,
      await req.supabase
        .from("expenses")
        .insert({
          category: input.category,
          description: input.description,
          amount: input.amount,
          currency: input.currency,
          date: input.date,
          department: input.department,
          status: "pending",
          receipt_url: input.receiptUrl || null,
        })
        .select("*")
        .single(),
      201,
    );
  }),
);

app.post(
  "/api/finance/expenses/:expenseId/review",
  requireRoles(["admin", "manager", "supervisor"]),
  asyncRoute(async (req, res) => {
    const params = z.object({ expenseId: uuid }).parse(req.params);
    const input = body(z.object({ status: z.enum(["approved", "rejected", "paid"]) }), req);
    sendSupabaseResult(
      res,
      await req.supabase.rpc("review_expense", {
        p_expense_id: params.expenseId,
        p_status: input.status,
      }),
    );
  }),
);

app.get(
  "/api/notifications",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendSupabaseResult(res, await req.supabase.from("notifications").select("*").order("created_at", { ascending: false }));
  }),
);

app.patch(
  "/api/notifications/read-all",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    sendSupabaseResult(
      res,
      await req.supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", req.user.id)
        .select("*"),
    );
  }),
);

app.patch(
  "/api/notifications/:notificationId/read",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    const params = z.object({ notificationId: uuid }).parse(req.params);
    sendSupabaseResult(
      res,
      await req.supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", params.notificationId)
        .select("*")
        .single(),
    );
  }),
);

app.delete(
  "/api/notifications/:notificationId",
  requireRoles(["admin", "manager", "supervisor", "operator", "viewer"]),
  asyncRoute(async (req, res) => {
    const params = z.object({ notificationId: uuid }).parse(req.params);
    sendSupabaseResult(res, await req.supabase.from("notifications").delete().eq("id", params.notificationId).select("*").single());
  }),
);

const notificationSchema = z.object({
  userId: uuid,
  module: z.string().trim().min(1),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  actionUrl: optionalText,
});

app.post(
  "/api/notifications",
  requireRoles(["admin", "manager", "supervisor"]),
  asyncRoute(async (req, res) => {
    const input = body(notificationSchema, req);
    sendSupabaseResult(
      res,
      await adminSupabase.rpc("create_notification", {
        p_user_id: input.userId,
        p_module: input.module,
        p_title: input.title,
        p_body: input.body,
        p_action_url: input.actionUrl || null,
      }),
      201,
    );
  }),
);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((error, _req, res, _next) => {
  const status = error.status || error.statusCode || (error.name === "ZodError" ? 422 : 500);
  const payload = {
    error: status >= 500 ? "Internal server error." : error.message,
  };

  if (error.name === "ZodError") {
    payload.details = error.errors.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }

  if (env.nodeEnv !== "production" && status >= 500) {
    payload.details = error.message;
  }

  res.status(status).json(payload);
});

app.listen(env.port, "0.0.0.0", () => {
  console.log(`FactoryOS API listening on ${env.port}`);
});
