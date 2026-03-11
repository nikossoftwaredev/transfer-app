import { prisma } from "@/lib/db";
import { firebaseAdmin } from "./firebase";

interface PushOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to all of a user's registered devices.
 * Automatically cleans up invalid tokens on FCM error.
 */
export async function sendPush({ userId, title, body, data }: PushOptions) {
  if (!firebaseAdmin.apps.length) {
    console.warn("Firebase not initialized — skipping push notification");
    return;
  }

  const tokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { id: true, token: true },
  });

  if (tokens.length === 0) return;

  const message = {
    notification: { title, body },
    data: data ?? {},
  };

  const invalidTokenIds: string[] = [];

  await Promise.allSettled(
    tokens.map(async ({ id, token }) => {
      try {
        await firebaseAdmin.messaging().send({ ...message, token });
      } catch (error: unknown) {
        const code = (error as { code?: string }).code;
        // Clean up invalid tokens
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalidTokenIds.push(id);
        }
        console.error(`Push failed for token ${id}:`, error);
      }
    })
  );

  // Remove invalid tokens
  if (invalidTokenIds.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { id: { in: invalidTokenIds } },
    });
  }
}

/**
 * Send push notification to multiple users.
 */
export async function sendPushToMany(
  userIds: string[],
  notification: { title: string; body: string; data?: Record<string, string> }
) {
  await Promise.allSettled(
    userIds.map((userId) => sendPush({ userId, ...notification }))
  );
}
