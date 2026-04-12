export const ALLOWED_ENVIRONMENTS = ['dev', 'staging', 'prod'] as const;

export type SynkryptEnvironment = typeof ALLOWED_ENVIRONMENTS[number];

export function isValidEnvironment(value: unknown): value is SynkryptEnvironment {
  return typeof value === 'string' && ALLOWED_ENVIRONMENTS.includes(value as SynkryptEnvironment);
}
