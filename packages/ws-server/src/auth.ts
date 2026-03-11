import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret";

interface TokenPayload {
  id: string;
  role: string;
  orgId?: string;
  driverId?: string;
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
  return {
    id: decoded.id as string || decoded.sub as string,
    role: decoded.role as string,
    orgId: decoded.orgId as string | undefined,
    driverId: decoded.driverId as string | undefined,
  };
}
