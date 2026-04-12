import crypto from "crypto";
import { apiFetch } from "../utils/api";
import { getIdentity, getUsablePrivateKey, setProjectConfig, requireProjectConfig } from "../utils/config";
import { decryptSymmetric, encryptAsymmetric, decryptAsymmetric, encryptSymmetric } from "../utils/crypto";
import { ALLOWED_ENVIRONMENTS } from "../utils/environment";

type UserResponse = {
  id: string;
  publicKey: string;
};

type SecretsResponse = {
  secrets: Record<string, EncryptedSecretValue>;
  encryptedProjectKey: string;
};

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

type SecretPermissions = Record<string, Array<{
  userId: string;
  canRead: boolean;
  canWrite: boolean;
  publicKey: string;
}>>;

type SecretsWithPermissionsResponse = {
  secrets: Record<string, SecretEntry>;
  encryptedProjectKey: string;
  secretPermissions: SecretPermissions;
};

type ProjectMember = {
  userId: string;
  role: string;
  ruleTemplateId: string | null;
  publicKey: string;
};

type ProjectMembersResponse = {
  organizationId: string;
  members: ProjectMember[];
};

export async function createProjectCommand(projectId: string, options: { org: string }) {
  const identity = getIdentity();
  const projectKey = crypto.randomBytes(32).toString("hex");
  const encryptedProjectKey = encryptAsymmetric(identity.publicKey, projectKey);

  if (!options.org) {
    console.error("❌ Missing organization. Use --org <organizationId>");
    process.exit(1);
  }

  try {
    await apiFetch("/projects", {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
        name: projectId,
        organizationId: options.org,
        encryptedProjectKey,
      }),
    });
    setProjectConfig({ projectId, organizationId: options.org });
    console.log(`✅ Project '${projectId}' created and linked.`);
  } catch (err: any) {
    console.error(`❌ Failed to create project: ${err.message}`);
  }
}

export function linkProjectCommand(projectId: string, options: { org?: string }) {
  const config: Record<string, string> = { projectId };
  if (options.org) {
    config.organizationId = options.org;
  }

  setProjectConfig(config);
  console.log(`✅ Linked to project '${projectId}'`);
}

export async function addMemberCommand(targetUserId: string, options: { role?: string; template?: string }) {
  const { projectId } = requireProjectConfig();
  const identity = getIdentity();
  const privateKey = getUsablePrivateKey();

  try {
    // 1. Get target's public key
    const targetUser = await apiFetch<UserResponse>(`/users/${targetUserId}`);

    // 2. Get our encrypted project key to decrypt it
    const data = await apiFetch<SecretsResponse>(`/secrets?projectId=${projectId}`);
    const projectKey = decryptAsymmetric(privateKey, data.encryptedProjectKey);

    // 3. Encrypt project key for target
    const encryptedProjectKeyForTarget = encryptAsymmetric(targetUser.publicKey, projectKey);

    // 4. Add member
    await apiFetch(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({
        userId: targetUserId,
        role: options.role || "project_developer",
        ruleTemplateId: options.template || null,
        encryptedProjectKey: encryptedProjectKeyForTarget,
      }),
    });

    console.log(`✅ Added ${targetUserId} to project ${projectId}`);
  } catch (err: any) {
    console.error(`❌ Failed to add member: ${err.message}`);
  }
}

export async function revokeMemberCommand(targetUserId: string) {
  const { projectId } = requireProjectConfig();
  const privateKey = getUsablePrivateKey();

  try {
    await rotateProjectAndRevokeMember(projectId, targetUserId, privateKey);
    console.log(`✅ Revoked ${targetUserId} from project ${projectId} with key rotation.`);
  } catch (err: any) {
    console.error(`❌ Failed to revoke project member: ${err.message}`);
  }
}

export async function rotateProjectAndRevokeMember(
  projectId: string,
  targetUserId: string,
  privateKey: string
) {
  const memberData = await apiFetch<ProjectMembersResponse>(`/projects/${projectId}/members`);
  const targetExists = memberData.members.some((member) => member.userId === targetUserId);
  if (!targetExists) {
    throw new Error(`User ${targetUserId} is not a member of project ${projectId}`);
  }

  const remainingMembers = memberData.members.filter((member) => member.userId !== targetUserId);
  if (remainingMembers.length === 0) {
    throw new Error("Cannot revoke the last remaining project member");
  }

  const seedSecrets = await apiFetch<SecretsResponse>(`/secrets?projectId=${projectId}&environment=dev`);
  const oldProjectKey = decryptAsymmetric(privateKey, seedSecrets.encryptedProjectKey);
  const newProjectKey = crypto.randomBytes(32).toString("hex");

  for (const environment of ALLOWED_ENVIRONMENTS) {
    const data = await apiFetch<SecretsWithPermissionsResponse>(
      `/secrets?projectId=${projectId}&environment=${environment}&includePermissions=true`
    );

    for (const [key, secret] of Object.entries(data.secrets)) {
      if (secret.hasSecretGrants) {
        const currentSecretKey = secret.encryptedSecretKey
          ? decryptAsymmetric(privateKey, secret.encryptedSecretKey)
          : null;
        if (!currentSecretKey) {
          throw new Error(`Cannot rotate secret ${key} without access to its secret key`);
        }

        const plaintext = decryptSymmetric(secret.encryptedValue, currentSecretKey);
        const newSecretKey = crypto.randomBytes(32).toString("hex");
        const reEncryptedValue = encryptSymmetric(plaintext, newSecretKey);
        const existingPermissions = data.secretPermissions[key] || [];
        const nextPermissions = existingPermissions
          .filter((grant) => grant.userId !== targetUserId)
          .map((grant) => ({
            userId: grant.userId,
            canRead: grant.canRead,
            canWrite: grant.canWrite,
            encryptedSecretKey: encryptAsymmetric(grant.publicKey, newSecretKey),
          }));

        await apiFetch("/secrets", {
          method: "POST",
          body: JSON.stringify({
            projectId,
            key,
            encryptedValue: reEncryptedValue,
            environment,
            secretKeyGrants: nextPermissions,
          }),
        });
      } else {
        const plaintext = decryptSymmetric(secret.encryptedValue, oldProjectKey);
        const reEncryptedValue = encryptSymmetric(plaintext, newProjectKey);

        await apiFetch("/secrets", {
          method: "POST",
          body: JSON.stringify({ projectId, key, encryptedValue: reEncryptedValue, environment }),
        });
      }
    }
  }

  for (const member of remainingMembers) {
    const encryptedProjectKey = encryptAsymmetric(member.publicKey, newProjectKey);
    await apiFetch(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({
        userId: member.userId,
        role: member.role,
        ruleTemplateId: member.ruleTemplateId,
        encryptedProjectKey,
      }),
    });
  }

  await apiFetch(`/projects/${projectId}/members/${targetUserId}`, {
    method: "DELETE",
  });
}

export async function linkGithubRepoCommand(options: { repo: string }) {
  const { projectId } = requireProjectConfig();
  const repo = options.repo?.trim();
  if (!repo || !repo.includes("/")) {
    console.error("❌ Invalid repo format. Use --repo owner/name");
    process.exit(1);
  }

  const [repoOwner, repoName] = repo.split("/", 2);

  try {
    await apiFetch(`/projects/${projectId}/github-link`, {
      method: "POST",
      body: JSON.stringify({ repoOwner, repoName }),
    });
    console.log(`✅ Linked GitHub repo ${repoOwner}/${repoName} to project ${projectId}`);
  } catch (err: any) {
    console.error(`❌ Failed to link GitHub repo: ${err.message}`);
  }
}
