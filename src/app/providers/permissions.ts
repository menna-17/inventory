import type { Role } from "./auth-context";

export const rolePermissions = {
  owner: [
    "/dashboard",
    "/products",
    "/categories",
    "/inventory",
    "/sales",
  ],

  manager: [
    "/dashboard",
    "/products",
    "/categories",
    "/inventory",
    "/sales",
  ],

  staff: [
    "/dashboard",
    "/inventory",
    "/sales",
  ],
} satisfies Record<Role, string[]>;

export function canAccessRoute(
  role: Role | null,
  path: string,
): boolean {
  if (!role) {
    return false;
  }

  return rolePermissions[role].includes(path);
}