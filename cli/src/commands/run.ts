import { spawn } from "child_process";
import { apiFetch } from "../utils/api";
import { getUsablePrivateKey, requireProjectConfig } from "../utils/config";
import { decryptSymmetric, decryptAsymmetric } from "../utils/crypto";
import { assertEnvironment } from "../utils/environment";

type EncryptedSecretValue = {
  iv: string;
  content: string;
  tag: string;
};

type SecretEntry = {
  encryptedValue: EncryptedSecretValue;
  encryptedSecretKey: string | null;
  canWrite: boolean | null;
  hasSecretGrants: boolean;
};

type SecretsResponse = {
  secrets: Record<string, SecretEntry>;
  encryptedProjectKey: string | null;
};

export async function runCommand(commandArgs: string[], options: { env: string }) {
  const { projectId } = requireProjectConfig();
  const privateKey = getUsablePrivateKey();
  const environment = options.env || "dev";
  assertEnvironment(environment);

  if (commandArgs.length === 0) {
    console.error("❌ No command provided");
    process.exit(1);
  }

  try {
    const data = await apiFetch<SecretsResponse>(`/secrets?projectId=${projectId}&environment=${environment}`);
    const projectKey = data.encryptedProjectKey ? decryptAsymmetric(privateKey, data.encryptedProjectKey) : null;
    
    const env = { ...process.env };
    for (const [key, secret] of Object.entries(data.secrets)) {
      const decryptedKey = secret.encryptedSecretKey
        ? decryptAsymmetric(privateKey, secret.encryptedSecretKey)
        : projectKey;
      if (!decryptedKey) {
        throw new Error(`Missing decryptable key material for secret '${key}'`);
      }
      env[key] = decryptSymmetric(secret.encryptedValue, decryptedKey);
    }

    console.log(`🚀 Running in '${environment}': ${commandArgs.join(" ")}`);
    const command = commandArgs[0];
    if (!command) {
      console.error("❌ No command provided");
      process.exit(1);
    }

    const child = spawn(command, commandArgs.slice(1), { stdio: "inherit", env });
    child.once("exit", (code: number | null) => process.exit(code || 0));
  } catch (err: any) {
    console.error(`❌ Failed to run command: ${err.message}`);
  }
}
