import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Get the current session on the server side.
 * Returns null if not authenticated.
 */
export const getSession = () => getServerSession(authOptions);

/**
 * Get the current session or throw if not authenticated.
 * Use in server components/actions that require auth.
 */
export const requireSession = async () => {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
};

/**
 * Require a specific role. Throws if user doesn't have the role.
 */
export const requireRole = async (roles: string | string[]) => {
  const session = await requireSession();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.user.role)) throw new Error("Forbidden");
  return session;
};
