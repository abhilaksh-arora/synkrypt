console.log("🚀 Starting Test App...");

const dbPassword = process.env.DB_PASSWORD;

if (dbPassword) {
  console.log("✅ Successfully loaded DB_PASSWORD from environment.");
  console.log(`🔐 Secret value (masked for safety): ${dbPassword.substring(0, 3)}***`);
} else {
  console.warn("❌ DB_PASSWORD not found in environment. Run this app with 'synkrypt run -- bun run index.ts'");
}

console.log("👋 Done.");
