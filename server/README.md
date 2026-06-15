# FactoryOS API

Render-ready Node/Express API for FactoryOS protected workflows.

The mobile app can keep using Supabase directly for normal RLS-protected reads. This API is for server-side workflows where secrets must stay off the device.

## Local Setup

```bash
cd server
cp .env.example .env
npm install
npm run check
npm start
```

## Required Render Environment Variables

Set these in Render, not in GitHub:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`

Use `CORS_ORIGIN=*` while testing Expo/mobile clients. For a web client, set the exact allowed origin.

## Render Settings

If deploying manually:

- Service type: Web Service
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

The root `render.yaml` can also be used as a Render Blueprint.

## Auth

All `/api/*` routes require:

```http
Authorization: Bearer <supabase-access-token>
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to Expo or any frontend.

## Account Provisioning

Fresh FactoryOS projects start with no admin. The mobile app checks:

```http
GET /api/setup/status
```

If `needsSuperAdmin` is `true`, the login screen can create the first owner account through:

```http
POST /api/setup/super-admin
```

Body:

```json
{
  "email": "owner@company.com",
  "password": "temporary-password",
  "fullName": "Owner Name",
  "department": "Administration",
  "employeeId": "FOS-0001"
}
```

This endpoint only works while there are zero `admin` profiles.

After setup, admins can create role-based FactoryOS accounts through:

```http
POST /api/admin/users
```

Body:

```json
{
  "email": "operator@company.com",
  "password": "temporary-password",
  "fullName": "Operator Name",
  "role": "operator",
  "department": "Production",
  "employeeId": "FOS-1204"
}
```

Allowed roles: `admin`, `manager`, `supervisor`, `operator`, `viewer`.
