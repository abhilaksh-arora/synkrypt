const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const chalk = require("chalk");

const app = express();
const port = process.env.PORT || 3000;

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
      chalk.white(" DATABASE_URL is available in process.env")
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
        chalk.white(`Connected to "${res.rows[0].current_database}"`)
      );
    }
  });
}

// 3. Middlewares
app.use(express.json());

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

app.listen(port, () => {
  console.log(chalk.yellow("\n[ RUNTIME STATUS ]"));
  console.log(`${chalk.white("Server Port:")} ${chalk.green(port)}`);
  console.log(
    `${chalk.white("JWT Security:")} ${JWT_SECRET !== "fallback-secret-if-missing" ? chalk.green("ENCRYPTED") : chalk.red("VULNERABLE")}`,
  );
  console.log(
    `${chalk.white("DB Capability:")} ${DB_URL ? chalk.green("READY") : chalk.red("DISABLED")}`,
  );
  console.log(chalk.gray("\n─────────────────────────────────────────"));
  console.log(chalk.bold.magenta(`Active at: http://localhost:${port}`));
});
