
import type { Role } from "./auth-context";

export const rolePermissions = {
  owner: [
    "/dashboard",
    "/products",
    "/categories",
    "/inventory",
    "/sales",
    "/audit-history",
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

  const normalizedPath =
    path.length > 1 ? path.replace(/\/+$/, "") : path;

  return rolePermissions[role].some((allowedPath) => {
    return (
      normalizedPath === allowedPath ||
      normalizedPath.startsWith(`${allowedPath}/`)
    );
  });
}
