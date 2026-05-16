/**
 * Role Configuration — Single source of truth for all test personas
 *
 * Add new roles here. Each role gets its own auth state file.
 * Tests reference roles by key: ROLES.rm, ROLES.do, ROLES.pl, etc.
 */

export interface RoleConfig {
  key: string;
  name: string;
  authFile: string;
  emailEnv: string;
  passEnv: string;
  description: string;
}

export const ROLES: Record<string, RoleConfig> = {
  rm: {
    key: 'rm',
    name: 'Resource Manager',
    authFile: './tests/.auth/rm.json',
    emailEnv: 'TRMERIC_RM_EMAIL',
    passEnv: 'TRMERIC_RM_PASSWORD',
    description: 'Can access Resource Requests, allocate resources, matchmaking',
  },
  do: {
    key: 'do',
    name: 'Demand Owner',
    authFile: './tests/.auth/do.json',
    emailEnv: 'TRMERIC_DO_EMAIL',
    passEnv: 'TRMERIC_DO_PASSWORD',
    description: 'Can create demands, request resources, cannot allocate',
  },
  pl: {
    key: 'pl',
    name: 'Portfolio Leader',
    authFile: './tests/.auth/pl.json',
    emailEnv: 'TRMERIC_PL_EMAIL',
    passEnv: 'TRMERIC_PL_PASSWORD',
    description: 'Portfolio management, treated as RM for mapped portfolios',
  },
  sm: {
    key: 'sm',
    name: 'Solution Manager',
    authFile: './tests/.auth/sm.json',
    emailEnv: 'TRMERIC_SM_EMAIL',
    passEnv: 'TRMERIC_SM_PASSWORD',
    description: 'Manages solutioning phase, team composition',
  },
  dr: {
    key: 'dr',
    name: 'Demand Requestor',
    authFile: './tests/.auth/dr.json',
    emailEnv: 'TRMERIC_DR_EMAIL',
    passEnv: 'TRMERIC_DR_PASSWORD',
    description: 'Can submit demand requests, limited access',
  },
};

// All roles as array (for iteration in setup)
export const ALL_ROLES = Object.values(ROLES);

// Helper: check if a role has credentials configured
export function isRoleConfigured(role: RoleConfig): boolean {
  return !!(process.env[role.emailEnv] && process.env[role.passEnv]);
}

// Helper: get the fallback auth file (uses legacy env vars or first configured role)
export function getFallbackAuthFile(): string {
  return './tests/.auth/user.json';
}
