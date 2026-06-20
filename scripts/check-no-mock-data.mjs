import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const walk = (dir, extensions) => {
  const absoluteDir = path.join(repoRoot, dir);
  return readdirSync(absoluteDir).flatMap((entry) => {
    const absolutePath = path.join(absoluteDir, entry);
    const relativePath = path.relative(repoRoot, absolutePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) return walk(relativePath, extensions);
    if (extensions.some((extension) => entry.endsWith(extension))) return [relativePath];
    return [];
  });
};

const screenFiles = walk("src/screens", [".tsx"]);
const scannedFiles = [
  ...screenFiles,
  ...walk("src/services", [".ts"]),
  ...walk("src/hooks", [".ts"]),
  ...walk("src/components/access", [".tsx"]),
  "src/utils/permissions.ts",
  ...walk("server/src", [".js"]),
];

const checks = [
  { pattern: /\b(mock|dummy|fake|fixture|lorem|hardcoded)\b/i, reason: "mock-data wording" },
  { pattern: /example\.supabase\.co|placeholder-anon-key|api-fallback/i, reason: "placeholder API or Supabase fallback" },
  { pattern: /Optimize now|Optimizing systems|Balancing workloads|Databases clear/i, reason: "local fake dashboard action" },
  { pattern: /Order released|Material staged|Line running|Quality sample pulled/i, reason: "hardcoded production timeline event" },
  { pattern: /const\s+defectTypes\s*=\s*\[\s*{/i, reason: "hardcoded quality defect type list" },
  { pattern: /roleAreaAccess|roleWriteAccess|roleApprovalAccess|roleAdminAccess|roleMatrixRows/i, reason: "client-side access matrix fallback" },
  { pattern: /placeholder="(?:owner@company\.com|name@company\.com|Aisha Khan|FOS-\d+|Administration|Production)"/i, reason: "visible example placeholder in a page" },
];

const failures = [];

for (const file of scannedFiles) {
  const source = readFileSync(path.join(repoRoot, file), "utf8");
  for (const check of checks) {
    if (check.pattern.test(source)) failures.push({ file, reason: check.reason });
  }
}

for (const file of screenFiles) {
  const fileFailures = failures.filter((failure) => failure.file === file);
  if (fileFailures.length) {
    for (const failure of fileFailures) {
      console.error(`screen failed: ${file} (${failure.reason})`);
    }
  } else {
    console.log(`screen ok: ${file}`);
  }
}

const nonScreenFailures = failures.filter((failure) => !screenFiles.includes(failure.file));
for (const failure of nonScreenFailures) {
  console.error(`source failed: ${failure.file} (${failure.reason})`);
}

if (failures.length) {
  console.error(`No-mock-data check failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`No-mock-data check passed for ${screenFiles.length} screens and ${scannedFiles.length - screenFiles.length} source files.`);
