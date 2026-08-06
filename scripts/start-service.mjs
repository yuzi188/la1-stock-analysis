import { spawn } from "node:child_process";

const role = process.env.LA1_SERVICE_ROLE ?? "web";
const commands = {
  web: ["pnpm", ["run", "start:web"]],
  "cron-morning": ["pnpm", ["run", "cron:morning"]],
  "cron-review": ["pnpm", ["run", "cron:review"]],
};

const selected = commands[role];

if (!selected) {
  console.error(`Unknown LA1_SERVICE_ROLE: ${role}`);
  process.exit(1);
}

const [command, args] = selected;
const child = spawn(command, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Service role ${role} stopped by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});
