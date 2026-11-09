#!/usr/bin/env node
"use strict";
const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const REPO_URL = process.env.BANKING_REPO_URL || "YOUR_BANKING_REPOSITORY_URL";
const BRANCH = process.env.BANKING_BRANCH || "main";

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: root, encoding: "utf8", ...opts });
}

function main() {
  console.log("🔍 Checking Banking Management System updates...");

  try {
    run(`git fetch "${REPO_URL}" "${BRANCH}"`, { stdio: "pipe" });
  } catch (e) {
    console.warn("⚠️ Fetch failed. Skip pull.");
    process.exit(0);
  }

  let behind = 0;

  try {
    const out = run("git rev-list HEAD..FETCH_HEAD --count", { stdio: "pipe" });
    behind = parseInt(out.trim(), 10) || 0;
  } catch {
    behind = 0;
  }

  if (behind === 0) {
    console.log("✅ Already up to date.");
    return;
  }

  console.log("📥", behind, "new commit(s) found. Pulling...");

  try {
    run(`git pull "${REPO_URL}" "${BRANCH}"`);
    console.log("✅ Pulled successfully.");
  } catch (e) {
    console.error("❌ Pull failed.");
    console.error("Run manually: git pull", REPO_URL, BRANCH);
    process.exit(1);
  }
}

main();