#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");
const { spawnSafe, execShell } = require("../scripts/run-safe.js");

const scriptDir = path.resolve(__dirname);
const root = path.join(scriptDir, "..");

const schemaPath = path.join(scriptDir, "sql", "001_schema.sql");
const seedPath = path.join(scriptDir, "sql", "003_seed.sql");
const resetPath = path.join(scriptDir, "sql", "sql_reset.sql");
const composePath = path.join(scriptDir, "compose.yaml");

const dbService = "banking-db";
const containerName = "banking-db";
const dbName = "banking_db";
const dbUser = "postgres";
const dbPassword = "postgres";
const dbPort = "5432";

const shouldReset = process.argv.includes("--reset");

function runCompose(args, opts = {}) {
  const r = spawnSafe("docker", ["compose", "-f", composePath, ...args], {
    cwd: opts.cwd || root,
    stdio: "inherit",
    ...opts
  });

  return r.status === 0;
}

function runComposeQuiet(args, opts = {}) {
  const r = spawnSafe("docker", ["compose", "-f", composePath, ...args], {
    cwd: opts.cwd || root,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...opts
  });

  return r.status === 0 ? (r.stdout && r.stdout.toString()) : null;
}

function dockerExecSql(name, sqlContent) {
  const r = spawnSafe(
    "docker",
    ["exec", "-i", name, "psql", "-v", "ON_ERROR_STOP=1", "-U", dbUser, "-d", dbName],
    {
      input: sqlContent,
      cwd: root,
      stdio: ["pipe", "inherit", "inherit"]
    }
  );

  return r.status === 0;
}

function dockerExecCmd(name, psqlArgs) {
  const r = spawnSafe(
    "docker",
    ["exec", name, "psql", "-U", dbUser, "-d", dbName, ...psqlArgs],
    {
      cwd: root,
      stdio: "inherit"
    }
  );

  return r.status === 0;
}

function dockerQuery(name, sql) {
  const r = spawnSafe(
    "docker",
    ["exec", "-i", name, "psql", "-U", dbUser, "-d", dbName, "-t", "-A", "-F", "|", "-c", sql],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    }
  );

  return r.status === 0 ? (r.stdout && r.stdout.toString()) : null;
}

function composeExecSql(sqlContent) {
  const r = spawnSafe(
    "docker",
    ["compose", "-f", composePath, "exec", "-T", dbService, "psql", "-v", "ON_ERROR_STOP=1", "-U", dbUser, "-d", dbName],
    {
      input: sqlContent,
      cwd: root,
      stdio: ["pipe", "inherit", "inherit"]
    }
  );

  return r.status === 0;
}

function composeQuery(sql) {
  return runComposeQuiet([
    "exec",
    "-T",
    dbService,
    "psql",
    "-U",
    dbUser,
    "-d",
    dbName,
    "-t",
    "-A",
    "-F",
    "|",
    "-c",
    sql
  ]);
}

function psqlExecSql(baseArgs, sqlFilePath, env) {
  const r = spawnSafe(
    "psql",
    [...baseArgs, "-v", "ON_ERROR_STOP=1", "-f", sqlFilePath],
    {
      cwd: scriptDir,
      stdio: "inherit",
      env
    }
  );

  return r.status === 0;
}

function psqlExecCmd(baseArgs, env, psqlArgs) {
  const r = spawnSafe("psql", [...baseArgs, ...psqlArgs], {
    cwd: scriptDir,
    stdio: "inherit",
    env
  });

  return r.status === 0;
}

function psqlQuery(baseArgs, env, sql) {
  const r = spawnSafe(
    "psql",
    [...baseArgs, "-t", "-A", "-F", "|", "-c", sql],
    {
      cwd: scriptDir,
      env,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    }
  );

  return r.status === 0 ? (r.stdout && r.stdout.toString()) : null;
}

function getTableCounts(queryFn) {
  const out = queryFn([
    "select",
    "  (select count(*) from customer),",
    "  (select count(*) from account),",
    "  (select count(*) from charge_item),",
    "  (select count(*) from account_charge),",
    "  (select count(*) from loan_type),",
    "  (select count(*) from loan),",
    "  (select count(*) from loan_disbursement_line_item),",
    "  (select count(*) from loan_schedule),",
    "  (select count(*) from loan_payment),",
    "  (select count(*) from loan_payment_line_item),",
    "  (select count(*) from entry_type),",
    "  (select count(*) from transaction_type),",
    "  (select count(*) from transaction_status),",
    "  (select count(*) from transfer_batch),",
    "  (select count(*) from transaction),",
    "  (select count(*) from transfer_line_item);"
  ].join(" "));

  if (!out) return null;

  const counts = String(out)
    .trim()
    .split("|")
    .map((value) => Number(String(value).trim()));

  if (counts.length !== 16 || counts.some((value) => Number.isNaN(value))) return null;

  return {
    customer: counts[0],
    account: counts[1],
    chargeItem: counts[2],
    accountCharge: counts[3],
    loanType: counts[4],
    loan: counts[5],
    loanDisbursementLineItem: counts[6],
    loanSchedule: counts[7],
    loanPayment: counts[8],
    loanPaymentLineItem: counts[9],
    entryType: counts[10],
    transactionType: counts[11],
    transactionStatus: counts[12],
    transferBatch: counts[13],
    transaction: counts[14],
    transferLineItem: counts[15]
  };
}

function getSeedDecision(counts) {
  const allEmpty = Object.values(counts).every((value) => value === 0);

  if (allEmpty) {
    return {
      run: true,
      reason: "🌱 Database is empty. Running seed data..."
    };
  }

  const hasReferenceData =
    counts.customer > 0 ||
    counts.account > 0 ||
    counts.chargeItem > 0 ||
    counts.loanType > 0 ||
    counts.entryType > 0 ||
    counts.transactionType > 0 ||
    counts.transactionStatus > 0;

  const missingBusinessData =
    counts.loan === 0 &&
    counts.transaction === 0 &&
    counts.transferLineItem === 0;

  if (hasReferenceData && missingBusinessData) {
    return {
      run: true,
      reason: "🩹 Reference data exists but business data is missing. Repairing seed data..."
    };
  }

  return {
    run: false,
    reason: "✅ Existing data found. Skipping seed."
  };
}

function logCounts(counts) {
  console.log(
    "📊 Current rows: customer=" + counts.customer +
    ", account=" + counts.account +
    ", charge_item=" + counts.chargeItem +
    ", account_charge=" + counts.accountCharge +
    ", loan_type=" + counts.loanType +
    ", loan=" + counts.loan +
    ", loan_disbursement_line_item=" + counts.loanDisbursementLineItem +
    ", loan_schedule=" + counts.loanSchedule +
    ", loan_payment=" + counts.loanPayment +
    ", loan_payment_line_item=" + counts.loanPaymentLineItem +
    ", entry_type=" + counts.entryType +
    ", transaction_type=" + counts.transactionType +
    ", transaction_status=" + counts.transactionStatus +
    ", transfer_batch=" + counts.transferBatch +
    ", transaction=" + counts.transaction +
    ", transfer_line_item=" + counts.transferLineItem
  );
}

function verifyDocker(name) {
  dockerExecCmd(name, ["-c", "\\dt"]);
}

function verifyCompose() {
  runCompose(["exec", "-T", dbService, "psql", "-U", dbUser, "-d", dbName, "-c", "\\dt"]);
}

function verifyPsql(baseArgs, env) {
  psqlExecCmd(baseArgs, env, ["-c", "\\dt"]);
}

function runSetupWithDocker(name, setupSqlContent, seedSqlContent) {
  console.log("✅ Docker container (" + name + ") is running");
  console.log(shouldReset ? "♻️  Applying reset SQL..." : "🧱 Applying schema...");

  if (!dockerExecSql(name, setupSqlContent)) return false;

  if (shouldReset) {
    console.log("✅ Database reset successfully!");
    console.log("🔍 Verifying created tables:");
    verifyDocker(name);
    return true;
  }

  const counts = getTableCounts((sql) => dockerQuery(name, sql));
  if (!counts) return false;

  logCounts(counts);

  const seedDecision = getSeedDecision(counts);
  console.log(seedDecision.reason);

  if (!seedDecision.run) {
    console.log("🔍 Verifying created tables:");
    verifyDocker(name);
    return true;
  }

  if (!dockerExecSql(name, seedSqlContent)) return false;

  console.log("✅ Schema applied and seed data loaded!");
  console.log("🔍 Verifying created tables:");
  verifyDocker(name);
  return true;
}

function runSetupWithCompose(setupSqlContent, seedSqlContent) {
  console.log("✅ Docker Compose service (" + dbService + ") is running");
  console.log(shouldReset ? "♻️  Applying reset SQL..." : "🧱 Applying schema...");

  if (!composeExecSql(setupSqlContent)) return false;

  if (shouldReset) {
    console.log("✅ Database reset successfully!");
    console.log("🔍 Verifying created tables:");
    verifyCompose();
    return true;
  }

  const counts = getTableCounts((sql) => composeQuery(sql));
  if (!counts) return false;

  logCounts(counts);

  const seedDecision = getSeedDecision(counts);
  console.log(seedDecision.reason);

  if (!seedDecision.run) {
    console.log("🔍 Verifying created tables:");
    verifyCompose();
    return true;
  }

  if (!composeExecSql(seedSqlContent)) return false;

  console.log("✅ Schema applied and seed data loaded!");
  console.log("🔍 Verifying created tables:");
  verifyCompose();
  return true;
}

function runSetupWithPsql(label, baseArgs, env, setupSqlFile, seedSqlFile) {
  console.log("🔌 Trying " + label + "...");
  console.log(shouldReset ? "♻️  Applying reset SQL..." : "🧱 Applying schema...");

  if (!psqlExecSql(baseArgs, setupSqlFile, env)) return false;

  if (shouldReset) {
    console.log("✅ Database reset successfully!");
    console.log("🔍 Verifying created tables:");
    verifyPsql(baseArgs, env);
    return true;
  }

  const counts = getTableCounts((sql) => psqlQuery(baseArgs, env, sql));
  if (!counts) return false;

  logCounts(counts);

  const seedDecision = getSeedDecision(counts);
  console.log(seedDecision.reason);

  if (!seedDecision.run) {
    console.log("🔍 Verifying created tables:");
    verifyPsql(baseArgs, env);
    return true;
  }

  if (!psqlExecSql(baseArgs, seedSqlFile, env)) return false;

  console.log("✅ Schema applied and seed data loaded!");
  console.log("🔍 Verifying created tables:");
  verifyPsql(baseArgs, env);
  return true;
}

function help() {
  console.log("\n❌ Unable to connect to database\n");
  console.log("Please check:");
  console.log("1. Is Docker Desktop running?");
  console.log("2. Run this command first: npm run docker:db:start");
  console.log("3. To apply schema manually:");
  console.log("   PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d banking_db -f database/sql/001_schema.sql");
  console.log("4. To seed an empty database manually:");
  console.log("   PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d banking_db -f database/sql/003_seed.sql");
  console.log("5. To reset everything from scratch:");
  console.log("   npm run db:reset");
  console.log("\n6. Or use PgAdmin:");
  console.log("   - URL: http://localhost:5050");
  console.log("   - Email: admin@banking.com");
  console.log("   - Password: admin");
  console.log("   - Host: banking-db");
  console.log("   - Port: 5432");
  console.log("   - Username: postgres");
  console.log("   - Password: postgres");
  console.log("   - Database: banking_db");
  process.exit(1);
}

const requiredFiles = shouldReset ? [resetPath] : [schemaPath, seedPath];

for (const filePath of requiredFiles) {
  if (!fs.existsSync(filePath)) {
    console.error("❌ SQL file not found: " + path.relative(scriptDir, filePath));
    process.exit(1);
  }
}

const setupSqlPath = shouldReset ? resetPath : schemaPath;
const setupSqlContent = fs.readFileSync(setupSqlPath, "utf8");
const seedSqlContent = shouldReset ? "" : fs.readFileSync(seedPath, "utf8");

console.log(shouldReset ? "♻️  Resetting database..." : "🔧 Setting up database...");
console.log("📁 Working directory: " + scriptDir);

let names = [];

try {
  const out = execShell('docker ps --format "{{.Names}}"', {
    cwd: root,
    encoding: "utf8"
  });

  names = (out && out.toString ? out.toString() : out)
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
} catch {}

if (names.includes(containerName)) {
  if (runSetupWithDocker(containerName, setupSqlContent, seedSqlContent)) process.exit(0);
  console.log("⚠️  Docker exec failed, trying alternative method...");
}

const psOut = runComposeQuiet(["ps", "-q", dbService], {
  stdio: ["pipe", "pipe", "pipe"]
});

if (psOut !== null && psOut.trim() !== "") {
  const statusOut = runComposeQuiet(["ps", dbService]);

  if (statusOut && statusOut.includes("Up")) {
    if (runSetupWithCompose(setupSqlContent, seedSqlContent)) process.exit(0);
    console.log("⚠️  Docker Compose exec failed, trying alternative method...");
  }
}

const dockerEnv = {
  ...process.env,
  PGPASSWORD: dbPassword
};

if (
  runSetupWithPsql(
    "psql (localhost:" + dbPort + ")",
    ["-h", "localhost", "-p", dbPort, "-U", dbUser, "-d", dbName],
    dockerEnv,
    setupSqlPath,
    seedPath
  )
) {
  process.exit(0);
}

console.log("⚠️  Connection via localhost:" + dbPort + " failed, trying alternative method...");

if (
  runSetupWithPsql(
    "local PostgreSQL",
    ["-U", dbUser, "-d", dbName],
    dockerEnv,
    setupSqlPath,
    seedPath
  )
) {
  process.exit(0);
}

help();