import crypto from "crypto";
import fs from "fs";
import { apiFetch } from "../utils/api";
import { getUsablePrivateKey, requireProjectConfig } from "../utils/config";
import { encryptSymmetric, decryptSymmetric, decryptAsymmetric, encryptAsymmetric } from "../utils/crypto";
import { ALLOWED_ENVIRONMENTS, assertEnvironment } from "../utils/environment";

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
  secretPermissions?: Record<string, Array<{
    userId: string;
    canRead: boolean;
    canWrite: boolean;
    publicKey: string;
  }>>;
};

type ProjectMembersResponse = {
  organizationId: string;
  members: Array<{
    userId: string;
    role: string;
    ruleTemplateId: string | null;
    publicKey: string;
  }>;
};

function parseCsv(value?: string) {
  if (!value) {
    return null;
  }
  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

type OrganizationMembersResponse = {
  members: Array<{
    userId: string;
    role: string;
  }>;
};

export function buildSecretKeyGrants(
  members: ProjectMembersResponse["members"],
  secretKey: string,
  readUsers?: Set<string> | null,
  writeUsers?: Set<string> | null
) {
  return members
    .filter((member) => {
      const isAdmin = ["project_admin", "project_maintainer"].includes(member.role);
      if (isAdmin) {
        return true;
      }
      if (!readUsers && !writeUsers) {
        return true;
      }
      return Boolean(readUsers?.has(member.userId) || writeUsers?.has(member.userId));
    })
    .map((member) => {
      const isAdmin = ["project_admin", "project_maintainer"].includes(member.role);
      const canRead = isAdmin || !readUsers || readUsers.has(member.userId) || Boolean(writeUsers?.has(member.userId));
      const canWrite = isAdmin || !writeUsers ? canRead : writeUsers.has(member.userId);

      return {
        userId: member.userId,
        encryptedSecretKey: encryptAsymmetric(member.publicKey, secretKey),
        canRead,
        canWrite,
      };
    });
}

export async function setSecretCommand(
  keyValuePair: string,
  options: { env: string; readUsers?: string; writeUsers?: string }
) {
  const { projectId } = requireProjectConfig();
  const privateKey = getUsablePrivateKey();
  const [key, value] = keyValuePair.split("=");
  const environment = options.env || "dev";
  assertEnvironment(environment);

  if (!key || !value) {
    console.error(" Invalid format. Use KEY=VALUE");
    process.exit(1);
  }

  try {
    const members = await apiFetch<ProjectMembersResponse>(`/projects/${projectId}/members`);
    const readUsers = parseCsv(options.readUsers);
    const writeUsers = parseCsv(options.writeUsers);
    const secretKey = crypto.randomBytes(32).toString("hex");
    const encryptedValue = encryptSymmetric(value, secretKey);
    const grants = buildSecretKeyGrants(members.members, secretKey, readUsers, writeUsers);

    await apiFetch("/secrets", {
      method: "POST",
      body: JSON.stringify({ projectId, key, encryptedValue, environment, secretKeyGrants: grants }),
    });

    console.log(` Secret '${key}' stored in '${environment}'`);
  } catch (err: any) {
    console.error(` Failed to store secret: ${err.message}`);
  }
}

export async function setOrganizationSecretCommand(
  keyValuePair: string,
  options: { org: string; env: string; readUsers?: string; writeUsers?: string }
) {
  const [key, value] = keyValuePair.split("=");
  const environment = options.env || "dev";
  assertEnvironment(environment);

  if (!options.org) {
    console.error(" Missing organization. Use --org <organizationId>");
    process.exit(1);
  }

  if (!key || !value) {
    console.error(" Invalid format. Use KEY=VALUE");
    process.exit(1);
  }

  try {
    const members = await apiFetch<OrganizationMembersResponse>(`/organizations/${options.org}/members`);

    const readUsers = parseCsv(options.readUsers);
    const writeUsers = parseCsv(options.writeUsers);
    const secretKey = crypto.randomBytes(32).toString("hex");
    const encryptedValue = encryptSymmetric(value, secretKey);

    const publicKeys = new Map<string, string>();
    for (const orgMember of members.members) {
      const user = await apiFetch<{ id: string; publicKey: string }>(`/users/${orgMember.userId}`);
      publicKeys.set(user.id, user.publicKey);
    }

    const grants = members.members
      .filter((member) => {
        if (!readUsers && !writeUsers) return true;
        return Boolean(readUsers?.has(member.userId) || writeUsers?.has(member.userId));
      })
      .map((member) => ({
        userId: member.userId,
        encryptedSecretKey: encryptAsymmetric(publicKeys.get(member.userId)!, secretKey),
        canRead: !readUsers || readUsers.has(member.userId) || Boolean(writeUsers?.has(member.userId)),
        canWrite: !writeUsers ? true : writeUsers.has(member.userId),
      }));

    await apiFetch("/secrets", {
      method: "POST",
      body: JSON.stringify({
        organizationId: options.org,
        scope: "organization",
        key,
        encryptedValue,
        environment,
        secretKeyGrants: grants,
      }),
    });
    console.log(` Organization secret '${key}' stored in '${environment}' for ${options.org}`);
  } catch (err: any) {
    console.error(` Failed to store organization secret: ${err.message}`);
  }
}

export async function updateSecretPermissionsCommand(
  key: string,
  options: { env: string; readUsers?: string; writeUsers?: string }
) {
  const { projectId } = requireProjectConfig();
  const privateKey = getUsablePrivateKey();
  const environment = options.env || "dev";
  assertEnvironment(environment);

  try {
    const [members, data] = await Promise.all([
      apiFetch<ProjectMembersResponse>(`/projects/${projectId}/members`),
      apiFetch<SecretsResponse>(`/secrets?projectId=${projectId}&environment=${environment}&includePermissions=true`),
    ]);

    const secret = data.secrets[key];
    if (!secret) {
      throw new Error(`Secret '${key}' not found in '${environment}'`);
    }

    const projectKey = data.encryptedProjectKey
      ? decryptAsymmetric(privateKey, data.encryptedProjectKey)
      : null;
    const currentSecretKey = secret.encryptedSecretKey
      ? decryptAsymmetric(privateKey, secret.encryptedSecretKey)
      : projectKey;
    if (!currentSecretKey) {
      throw new Error(`Missing decryptable key material for secret '${key}'`);
    }
    const plaintext = decryptSymmetric(secret.encryptedValue, currentSecretKey);

    const readUsers = parseCsv(options.readUsers);
    const writeUsers = parseCsv(options.writeUsers);
    const newSecretKey = crypto.randomBytes(32).toString("hex");
    const encryptedValue = encryptSymmetric(plaintext, newSecretKey);
    const secretKeyGrants = buildSecretKeyGrants(members.members, newSecretKey, readUsers, writeUsers);

    await apiFetch("/secrets", {
      method: "POST",
      body: JSON.stringify({
        projectId,
        key,
        environment,
        encryptedValue,
        secretKeyGrants,
      }),
    });

    console.log(` Updated permissions for secret '${key}' in '${environment}'`);
  } catch (err: any) {
    console.error(` Failed to update secret permissions: ${err.message}`);
  }
}

export async function pullSecretsCommand(options: { env: string }) {
  const { projectId } = requireProjectConfig();
  const privateKey = getUsablePrivateKey();
  const environment = options.env || "dev";
  assertEnvironment(environment);

  try {
    const data = await apiFetch<SecretsResponse>(`/secrets?projectId=${projectId}&environment=${environment}`);
    const projectKey = data.encryptedProjectKey ? decryptAsymmetric(privateKey, data.encryptedProjectKey) : null;
    
    let envContent = "";
    for (const [key, secret] of Object.entries(data.secrets)) {
      const decryptedKey = secret.encryptedSecretKey
        ? decryptAsymmetric(privateKey, secret.encryptedSecretKey)
        : projectKey;
      if (!decryptedKey) {
        throw new Error(`Missing decryptable key material for secret '${key}'`);
      }
      const value = decryptSymmetric(secret.encryptedValue, decryptedKey);
      envContent += `${key}=${value}\n`;
    }

    fs.writeFileSync(".env", envContent);
    console.log(` .env file created for '${environment}'`);
  } catch (err: any) {
    console.error(` Failed to pull secrets: ${err.message}`);
  }
}

export async function migrateLegacySecretsCommand(options: { env?: string; all?: boolean }) {
  const { projectId } = requireProjectConfig();
  const privateKey = getUsablePrivateKey();

  const environments = options.all
    ? [...ALLOWED_ENVIRONMENTS]
    : [options.env || "dev"];

  if (!options.all) {
    assertEnvironment(environments[0]!);
  }

  try {
    const members = await apiFetch<ProjectMembersResponse>(`/projects/${projectId}/members`);
    let migratedCount = 0;

    for (const environment of environments) {
      const data = await apiFetch<SecretsResponse>(
        `/secrets?projectId=${projectId}&environment=${environment}&includePermissions=true`
      );
      const projectKey = data.encryptedProjectKey
        ? decryptAsymmetric(privateKey, data.encryptedProjectKey)
        : null;

      for (const [key, secret] of Object.entries(data.secrets)) {
        if (secret.hasSecretGrants) {
          continue;
        }

        if (!projectKey) {
          throw new Error(`Missing project key for legacy secret '${key}'`);
        }

        const plaintext = decryptSymmetric(secret.encryptedValue, projectKey);
        const secretKey = crypto.randomBytes(32).toString("hex");
        const encryptedValue = encryptSymmetric(plaintext, secretKey);
        const secretKeyGrants = buildSecretKeyGrants(members.members, secretKey, null, null);

        await apiFetch("/secrets", {
          method: "POST",
          body: JSON.stringify({
            projectId,
            key,
            environment,
            encryptedValue,
            secretKeyGrants,
          }),
        });

        migratedCount += 1;
      }
    }

    console.log(` Migrated ${migratedCount} legacy secret(s) to per-secret grant mode.`);
  } catch (err: any) {
    console.error(` Failed to migrate legacy secrets: ${err.message}`);
  }
}
