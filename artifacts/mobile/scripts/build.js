/**
 * Production build script for Expo web PWA.
 * Runs `expo export --platform web` which outputs to dist/.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");

function findWorkspaceRoot(startDir) {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not find workspace root");
}

const workspaceRoot = findWorkspaceRoot(projectRoot);

function getDeploymentDomain() {
  const raw =
    process.env.REPLIT_INTERNAL_APP_DOMAIN ||
    process.env.REPLIT_DEV_DOMAIN ||
    process.env.EXPO_PUBLIC_DOMAIN ||
    "";
  if (!raw) return "";
  const urlString = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(urlString).host;
  } catch {
    return raw;
  }
}

const domain = getDeploymentDomain();
console.log(`Building Expo web PWA for domain: ${domain || "(unknown)"}`);

const env = {
  ...process.env,
  EXPO_PUBLIC_DOMAIN: domain,
  NODE_ENV: "production",
};

try {
  execSync(
    "pnpm exec expo export --platform web --output-dir dist --clear",
    {
      cwd: projectRoot,
      env,
      stdio: "inherit",
    }
  );
  console.log("Expo web export complete → dist/");
} catch (err) {
  console.error("Build failed:", err.message);
  process.exit(1);
}
