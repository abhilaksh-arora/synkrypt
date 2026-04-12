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
      console.error("❌ Email and password are required.");
      process.exit(1);
    }

    try {
      // Login ignores normal session fetching, so we intercept the Set-Cookie token
      const BASE_URL = process.env.SYNKRYPT_SERVER_URL || "http://localhost:2809";
      const res = await fetch(
        `${BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      if (!res.ok) throw new Error(await res.text());

      const cookie = res.headers.get("set-cookie");
      const match = cookie?.match(/synkrypt_session=([^;]+)/);
      if (!match || !match[1]) throw new Error("No session token returned.");

      saveSession(match[1]);
      console.log(`✅ Logged in successfully.`);
    } catch (err: any) {
      console.error(`❌ Login failed: ${err.message}`);
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

      // Add to .gitignore if it exists
      if (fs.existsSync(".gitignore")) {
        const gitignore = fs.readFileSync(".gitignore", "utf8");
        if (!gitignore.includes(".synkrypt")) {
          fs.appendFileSync(".gitignore", "\n.synkrypt\n");
          console.log("🔒 Added .synkrypt to .gitignore");
        }
      }

      console.log(`✅ Project linked: ${data.project.name}`);
      console.log(`📂 Configuration saved to ./.synkrypt/config.json`);
    } catch (err: any) {
      console.error(`❌ Failed to link project: ${err.message}`);
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
      console.log(`✅ Wrote ${lines.length} viewable secrets to .env`);
      console.log(
        `⚠️  Note: Restricted secrets (can_view=false) are omitted. Use 'run' to inject them.`,
      );
    } catch (err: any) {
      console.error(`❌ Failed to pull secrets: ${err.message}`);
    }
  });

program
  .command("logout")
  .description("Clear the local session and logout from the server")
  .action(async () => {
    deleteSession();
    console.log("✅ Logged out successfully. Local session cleared.");
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
      console.error(`❌ Identification failed: ${err.message}`);
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
          const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(escaped, 'g');
          str = str.replace(re, '[SYNKRYPT_RESTRICTED]');
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
      console.error(`❌ Failed to run command: ${err.message}`);
    }
  });

program.parse();
