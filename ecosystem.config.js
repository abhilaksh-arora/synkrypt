module.exports = {
  apps: [
    {
      name: "synkrypt-server",
      cwd: "./server",
      script: "index.ts",
      interpreter: "bun",
      env: {
        NODE_ENV: "production",
        PORT: 2809,
      },
      // Better for production logging
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      // Auto-restart if the app crashes
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};
