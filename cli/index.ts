#!/usr/bin/env bun
import fs from "fs";
import { spawn } from "child_process";
import { Command } from "commander";
import {
  saveSession,
  setProjectConfig,
  requireProjectConfig,
  ensureDirs,
  deleteSession,
  GLOBAL_CONFIG_DIR,
} from "./src/utils/config";
import { assertEnvironment } from "./src/utils/environment";
import { api } from "./src/utils/api";

const program = new Command();
program
  .name("synkrypt")
  .description("Synkrypt CLI — Developer tools")
  .version("0.1.0");

program
  .command("login")
  .description("Authenticate your CLI with Synkrypt")
  .option("-e, --email <email>", "User email")
  .option("-p, --password <password>", "User password")
  .action(async (options) => {
    let email = options.email;
    let password = options.password;
    if (!email || !password) {
      email = prompt("📧 Email:");
      password = prompt("🔐 Password:");
    }

    if (!email || !password) {
      console.error(" Email and password are required.");
      process.exit(1);
    }

    try {
      // Login ignores normal session fetching, so we intercept the Set-Cookie token
      const BASE_URL =
        process.env.SYNKRYPT_SERVER_URL ||
        "https://synkrypt.abhilaksharora.com/api";
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.text();
        let err = body || `HTTP ${res.status}`;
        try {
          const data = JSON.parse(body);
          if (data.error) err = data.error;
        } catch {}
        throw new Error(err);
      }

      const cookie = res.headers.get("set-cookie");
      const match = cookie?.match(/synkrypt_session=([^;]+)/);
      if (!match || !match[1]) throw new Error("No session token returned.");

      saveSession(match[1]);
      console.log(` Logged in successfully.`);
    } catch (err: any) {
      console.error(` Login failed: ${err.message}`);
    }
  });

program
  .command("use <projectKey>")
  .description("Link current directory to a project")
  .action(async (projectKey) => {
    try {
      const data = (await api.getProjectByKey(projectKey)) as any;
      ensureDirs();
      setProjectConfig({ projectKey });

      console.log(` Project linked: ${data.project.name}`);
      console.log(`📂 Configuration saved to ./.synkrypt/config.json`);
    } catch (err: any) {
      console.error(` Failed to link project: ${err.message}`);
    }
  });

program
  .command("pull")
  .description("Pull viewable secrets into a local .env file")
  .requiredOption("-e, --env <env>", "Environment (dev, staging, prod)")
  .action(async (options) => {
    assertEnvironment(options.env);
    const config = requireProjectConfig();

    try {
      const data = (await api.getProjectByKey(config.projectKey)) as any;
      const secretsData = (await api.pullSecrets(
        data.project.id,
        options.env,
      )) as any;

      let lines: string[] = [];
      for (const [key, val] of Object.entries(secretsData.secrets)) {
        lines.push(`${key}=${val}`);
      }

      fs.writeFileSync(".env", lines.join("\n") + "\n");
      console.log(` Wrote ${lines.length} viewable secrets to .env`);
      console.log(
        `⚠️  Note: Restricted secrets (can_view=false) are omitted. Use 'run' to inject them.`,
      );
    } catch (err: any) {
      console.error(` Failed to pull secrets: ${err.message}`);
    }
  });

program
  .command("push [file]")
  .description("Push local variables into a Synkrypt project environment")
  .requiredOption("-e, --env <env>", "Environment (dev, staging, prod)")
  .option("-p, --personal", "Push as personal secrets (only visible to you)")
  .action(async (file, options) => {
    assertEnvironment(options.env);
    const config = requireProjectConfig();
    const filePath = file || ".env";

    if (!fs.existsSync(filePath)) {
      console.error(` Error: File ${filePath} not found.`);
      process.exit(1);
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/);
      const secrets: { key: string; value: string; type: string }[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (!match || !match[1]) continue;

        const key = match[1].trim();
        let value = (match[2] || "").trim();

        // Strip quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        secrets.push({ key, value, type: "env" });
      }

      if (secrets.length === 0) {
        console.log(" No valid environment variables found to push.");
        return;
      }

      const data = (await api.getProjectByKey(config.projectKey)) as any;
      await api.bulkUpsertSecrets(data.project.id, {
        environment: options.env,
        secrets,
        isPersonal: !!options.personal,
      });

      console.log(
        ` Successfully pushed ${secrets.length} secrets to '${options.env}' environment.`,
      );
    } catch (err: any) {
      console.error(` Failed to push secrets: ${err.message}`);
    }
  });

program
  .command("logout")
  .description("Clear the local session and logout from the server")
  .action(async () => {
    deleteSession();
    console.log(" Logged out successfully. Local session cleared.");
  });

program
  .command("whoami")
  .description("Display the current logged-in user identity")
  .action(async () => {
    try {
      const data = (await api.getMe()) as any;
      console.log(`\n👤 ${data.user.name.toUpperCase()} (${data.user.email})`);
      console.log(`🔑 Role: ${data.user.role}`);
      console.log("───────────────────────────────────\n");
    } catch (err: any) {
      console.error(` Identification failed: ${err.message}`);
    }
  });

program
  .command("run")
  .description(
    "Inject ALL secrets into the process environment and run a command",
  )
  .requiredOption("-e, --env <env>", "Environment (dev, staging, prod)")
  .argument("<cmd...>", "Command to run")
  .action(async (cmdArgs, options) => {
    assertEnvironment(options.env);
    const config = requireProjectConfig();

    try {
      const data = (await api.getProjectByKey(config.projectKey)) as any;
      const secretsData = (await api.runSecrets(
        data.project.id,
        options.env,
      )) as any;

      const injectedEnv = {
        ...process.env,
        ...secretsData.secrets,
        SYNKRYPT_START_TIME: process.hrtime.bigint().toString(),
      };

      console.log(
        `🚀 Injecting ${Object.keys(secretsData.secrets).length} secrets and starting process...`,
      );

      const [command, ...args] = cmdArgs;
      const child = spawn(command, args, {
        stdio: ["inherit", "pipe", "pipe"],
        env: injectedEnv,
        shell: true,
      });

      const restrictedValues = (secretsData.restrictedValues || []) as string[];

      const mask = (data: Buffer) => {
        let str = data.toString();
        for (const val of restrictedValues) {
          if (!val || val.length < 3) continue;
          const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const re = new RegExp(escaped, "g");
          str = str.replace(re, "[SYNKRYPT_RESTRICTED]");
        }
        return str;
      };

      child.stdout?.on("data", (data) => {
        process.stdout.write(mask(data));
      });

      child.stderr?.on("data", (data) => {
        process.stderr.write(mask(data));
      });

      child.on("exit", (code) => {
        process.exit(code ?? 0);
      });
    } catch (err: any) {
      console.error(` Failed to run command: ${err.message}`);
    }
  });

program
  .command("update")
  .description("Update the Synkrypt CLI to the latest version")
  .action(() => {
    console.log("Checking for updates and running installer...");
    const cmd =
      "curl -fsSL https://synkrypt.abhilaksharora.com/install.sh | bash";

    const child = spawn(cmd, {
      shell: true,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        console.error(
          "\nUpdate failed. You may need to run this command with higher privileges or check your internet connection.",
        );
      }
      process.exit(code ?? 0);
    });
  });

program
  .command("uninstall")
  .description("Remove the Synkrypt CLI from your system")
  .option(
    "--purge",
    "Also remove all local configuration and session data (~/.synkrypt)",
  )
  .action((options) => {
    const binaryPath = "/usr/local/bin/synkrypt";

    console.log("Preparing to uninstall Synkrypt...");

    if (options.purge) {
      console.log(`Purging local configuration at ${GLOBAL_CONFIG_DIR}...`);
      try {
        if (fs.existsSync(GLOBAL_CONFIG_DIR)) {
          fs.rmSync(GLOBAL_CONFIG_DIR, { recursive: true, force: true });
          console.log("Local configuration cleared.");
        }
      } catch (err: any) {
        console.error(`Failed to clear local configuration: ${err.message}`);
      }
    }

    console.log(`Removing global binary at ${binaryPath}...`);
    try {
      if (fs.existsSync(binaryPath)) {
        // We can't easily self-delete while running on some systems,
        // but on Unix we can unlink the file.
        fs.unlinkSync(binaryPath);
        console.log("Synkrypt CLI has been uninstalled.");
      } else {
        console.log(
          "Global binary not found at /usr/local/bin/synkrypt. You may have installed it via another method (e.g., bun link).",
        );
      }
    } catch (err: any) {
      console.error(`\nFailed to remove binary: ${err.message}`);
      console.error("💡 Try running: sudo synkrypt uninstall");
    }
  });

program.parse();
