const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const chalk = require("chalk");

const app = express();
const port = process.env.PORT || 3000;
const bootTime = Date.now();
const bootTimeHr = process.hrtime.bigint();

console.log("\n" + chalk.cyan.bold(" 🛡️  SYNKRYPT PRODUCTION-TEST BACKEND "));
console.log(chalk.gray("─────────────────────────────────────────"));

// 1. Secret Injection Verification
const DB_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-if-missing";

if (!DB_URL) {
  console.log(chalk.red.bold("✗ CRITICAL: DATABASE_URL is missing!"));
} else {
  console.log(
    chalk.green("✓ Restricted Secret Detected:") +
      chalk.white(" DATABASE_URL is available in process.env"),
  );
}

// 2. PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: DB_URL,
  connectionTimeoutMillis: 2000,
});

// Startup Validation Query
if (DB_URL) {
  pool.query("SELECT current_database(), now()", (err, res) => {
    if (err) {
      console.log(chalk.red("✗ DB Connection Failed:"), err.message);
    } else {
      console.log(
        chalk.green("✓ DB Connection Established:"),
        chalk.white(`Connected to "${res.rows[0].current_database}"`),
      );
    }
  });
}

// 3. Middlewares
app.use(express.json());

// Timing Middleware
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6;
    const logTag =
      duration > 100 ? chalk.red.bold("[ PERF ]") : chalk.gray("[ REQ  ]");
    const logColor = duration > 100 ? chalk.red : chalk.gray;

    console.log(
      `${logTag} ${chalk.white(req.method)} ${chalk.blue(req.url)} - ` +
        logColor(`${res.statusCode} (${duration.toFixed(2)}ms)`),
    );
  });
  next();
});

// 4. Endpoints
app.get("/", (req, res) => {
  res.json({
    name: "Synkrypt Validation API",
    status: "Operational",
    environment: process.env.SYNKRYPT_ENV || "unknown",
  });
});

// Database Health Check (Exercising the Restricted Secret)
app.get("/health", async (req, res) => {
  try {
    const start = Date.now();
    const result = await pool.query("SELECT now()");
    const duration = Date.now() - start;

    res.json({
      connected: true,
      latency: `${duration}ms`,
      server_time: result.rows[0].now,
      method: "Secure injection via Synkrypt",
    });
  } catch (err) {
    res.status(500).json({
      connected: false,
      error: err.message,
      note: "Connectivity failed. Check if DATABASE_URL is a valid Postgres connection string.",
    });
  }
});

// JWT Signing (Exercising Synkrypt Secret)
app.post("/login", (req, res) => {
  const user = { id: 1, name: "Synkrypt Admin", role: "security_officer" };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });

  res.json({
    token,
    signed_with:
      JWT_SECRET === "fallback-secret-if-missing"
        ? "UNSAFE FALLBACK"
        : "SECURE SYNKRYPT KEY",
  });
});

// Verification Endpoint (Proving that Restricted secrets are visible to code but filtered elsewhere)
app.get("/security-drill", (req, res) => {
  const envKeys = Object.keys(process.env);
  const foundInCode = !!process.env.DATABASE_URL;

  res.json({
    drill: "Visibility Isolation Test",
    can_code_access_database_url: foundInCode,
    database_url_preview: foundInCode
      ? `${process.env.DATABASE_URL.substring(0, 15)}...`
      : "NOT_AVAILABLE",
    note: "If this key is marked as 'Restricted', it will NOT appear in 'synkrypt pull' but successfully connect above.",
  });
});

// 5. Performance Profiler
app.get("/profile", async (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  const dbStart = process.hrtime.bigint();
  let dbStatus = "UNKNOWN";
  let dbLatency = 0;

  try {
    await pool.query("SELECT 1");
    dbStatus = "READY";
    dbLatency = Number(process.hrtime.bigint() - dbStart) / 1e6;
  } catch (err) {
    dbStatus = "ERROR: " + err.message;
  }

  res.json({
    synkrypt_metrics: {
      injection_overhead: startTime
        ? `${(Number(process.hrtime.bigint() - BigInt(startTime)) / 1e6).toFixed(2)}ms`
        : "unknown",
      environment_ready: !!process.env.DATABASE_URL,
      restricted_keys_found: Object.keys(process.env).filter(
        (k) => k.includes("DB") || k.includes("SECRET"),
      ).length,
    },
    process_metrics: {
      uptime_seconds: uptime.toFixed(2),
      memory_heap_mb: (memory.heapUsed / 1024 / 1024).toFixed(2),
      boot_timestamp: new Date(bootTime).toISOString(),
    },
    database_metrics: {
      status: dbStatus,
      latency_ms: dbLatency.toFixed(2),
    },
  });
});

app.listen(port, () => {
  console.log(chalk.yellow("\n[ RUNTIME STATUS ]"));
  console.log(`${chalk.white("Server Port:")} ${chalk.green(port)}`);
  console.log(
    `${chalk.white("JWT Security:")} ${JWT_SECRET !== "fallback-secret-if-missing" ? chalk.green("ENCRYPTED") : chalk.red("VULNERABLE")}`,
  );
  const startTime = process.env.SYNKRYPT_START_TIME;
  let overhead = "unknown";
  if (startTime) {
    const delta = Number(process.hrtime.bigint() - BigInt(startTime)) / 1e6;
    overhead = `${delta.toFixed(2)}ms`;
  }

  console.log(
    `${chalk.white("DB Capability:")} ${DB_URL ? chalk.green("READY") : chalk.red("DISABLED")}`,
  );
  console.log(`${chalk.white("Nexus Latency:")} ${chalk.magenta(overhead)}`);
  console.log(chalk.gray("\n─────────────────────────────────────────"));
  console.log(chalk.bold.magenta(`Active at: http://localhost:${port}`));
});
