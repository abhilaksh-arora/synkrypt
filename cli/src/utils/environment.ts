export const ALLOWED_ENVIRONMENTS = ["dev", "staging", "prod"] as const;

export type SynkryptEnvironment = (typeof ALLOWED_ENVIRONMENTS)[number];

export function assertEnvironment(value: string): asserts value is SynkryptEnvironment {
  if (!ALLOWED_ENVIRONMENTS.includes(value as SynkryptEnvironment)) {
    console.error(" Invalid environment. Use one of: dev, staging, prod");
    process.exit(1);
  }
}
