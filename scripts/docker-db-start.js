#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");
const { spawnSafe, execShell, isWin } = require("./run-safe.js");

const root = path.resolve(__dirname, "..");
const composeDb = path.join(root, "database", "compose.yaml");

const dbSvc = "banking-db";
const adminerSvc = "adminer";

function runCompose(args, opts = {}) {
  const r = spawnSafe("docker", ["compose", "-f", composeDb, ...args], {
    cwd: root,
    stdio: "inherit",
    ...opts
  });

  return r.status === 0;
}

function runComposeQuiet(args, opts = {}) {
  const r = spawnSafe("docker", ["compose", "-f", composeDb, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...opts
  });

  return r.status === 0;
}

function portInUse(port) {
  const net = require("net");

  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(true);
      server.close();
    });

    server.once("listening", () => {
      resolve(false);
      server.close();
    });

    server.listen(port, "127.0.0.1");
  });
}

async function main() {
  console.log("🚀 Starting Banking Database...");

  try {
    execShell("docker info", { cwd: root, stdio: "pipe" });
  } catch {
    console.error("❌ Docker is not running. Please start Docker Desktop first.");
    process.exit(1);
  }

  if (!fs.existsSync(composeDb)) {
    console.error("❌ database/compose.yaml not found.");
    process.exit(1);
  }

  const inUse = await portInUse(5432);

  if (inUse) {
    let name = "";

    try {
      const out = execShell('docker ps --filter publish=5432 --format "{{.Names}}"', {
        cwd: root,
        encoding: "utf8"
      });

      name = (out && out.toString ? out.toString() : out).trim().split("\n")[0] || "";
    } catch {}

    if (name) {
      console.log("⚠️ Port 5432 in use by " + name + ". Stopping it...");
      execShell("docker stop " + name, { cwd: root });

      if (isWin) {
        execShell("timeout /t 2 /nobreak > nul", { cwd: root });
      } else {
        execShell("sleep 2", { cwd: root });
      }
    } else {
      console.error("❌ Port 5432 is in use. Free it or change the port in database/compose.yaml.");
      process.exit(1);
    }
  }

  console.log("📦 Starting PostgreSQL and Adminer...");
  runCompose(["up", "-d", dbSvc, adminerSvc]);

  console.log("⏳ Waiting for database...");

  if (isWin) {
    execShell("timeout /t 5 /nobreak > nul", { cwd: root });
  } else {
    execShell("sleep 5", { cwd: root });
  }

  for (let i = 0; i < 30; i++) {
    if (runComposeQuiet(["exec", "-T", dbSvc, "pg_isready", "-U", "postgres"])) {
      console.log("✅ Database is ready!");
      break;
    }

    if (i === 29) {
      console.log("⚠️ Database is slow to start.");
    } else if (isWin) {
      execShell("timeout /t 1 /nobreak > nul", { cwd: root });
    } else {
      execShell("sleep 1", { cwd: root });
    }
  }

  console.log("\n🔧 Ensuring schema and seed are ready...");

  const setupPath = path.join(root, "database", "setup_db.js");

  if (fs.existsSync(setupPath)) {
    const r = spawnSafe("node", [setupPath], {
      cwd: root,
      stdio: "inherit"
    });

    if (r.status !== 0) {
      console.log("⚠️ Setup had errors.");
    }
  } else {
    console.log("⚠️ database/setup_db.js not found. Docker init SQL will be used if available.");
  }

  console.log("\n✅ Database started.");
  console.log("Host: localhost:5432");
  console.log("Database: banking_db");
  console.log("User: postgres");
  console.log("Password: postgres");
  console.log("Adminer: http://localhost:8080");
  console.log("");
  console.log("Adminer login:");
  console.log("System: PostgreSQL");
  console.log("Server: banking-db");
  console.log("Username: postgres");
  console.log("Password: postgres");
  console.log("Database: banking_db");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});