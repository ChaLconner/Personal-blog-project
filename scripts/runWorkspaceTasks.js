const { spawnSync } = require("node:child_process");
const path = require("node:path");

const taskGroups = {
  "build:client": [["client", "build"]],
  "build:server": [["server", "build"]],
  build: [
    ["client", "build"],
    ["server", "build"],
  ],
  lint: [["client", "lint"]],
  "test:client": [["client", "test"]],
  "test:server": [["server", "test"]],
  test: [
    ["client", "test"],
    ["server", "test"],
  ],
  check: [
    ["client", "lint"],
    ["client", "test"],
    ["server", "test"],
    ["client", "build"],
    ["server", "build"],
  ],
};

const group = process.argv[2];
const tasks = taskGroups[group];
const npmCli = process.env.npm_execpath;

if (!tasks || !npmCli) {
  console.error(
    !tasks
      ? `Unknown workspace task group: ${group ?? "(missing)"}`
      : "npm_execpath is unavailable; run this script through npm.",
  );
  process.exit(1);
}

const rootDir = path.resolve(__dirname, "..");

for (const [workspace, script] of tasks) {
  const result = spawnSync(process.execPath, [npmCli, "run", script], {
    cwd: path.join(rootDir, workspace),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
