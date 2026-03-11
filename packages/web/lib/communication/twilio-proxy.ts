"use server";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PROXY_SERVICE_SID = process.env.TWILIO_PROXY_SERVICE_SID;

function getAuthHeader() {
  return `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`;
}

/**
 * Create a Twilio Proxy session for masked communication.
 * Returns the session SID.
 */
export async function createProxySession(
  driverPhone: string,
  clientPhone: string
): Promise<string | null> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PROXY_SERVICE_SID) {
    console.warn("Twilio Proxy not configured — skipping session creation");
    return null;
  }

  try {
    // Create session
    const sessionRes = await fetch(
      `https://proxy.twilio.com/v1/Services/${TWILIO_PROXY_SERVICE_SID}/Sessions`,
      {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          UniqueName: `session-${Date.now()}`,
          Ttl: "86400", // 24 hours
        }),
      }
    );

    if (!sessionRes.ok) {
      console.error("Proxy session create error:", await sessionRes.text());
      return null;
    }

    const session = await sessionRes.json();
    const sessionSid = session.sid;

    // Add driver participant
    await addParticipant(sessionSid, driverPhone, "driver");
    // Add client participant
    await addParticipant(sessionSid, clientPhone, "client");

    return sessionSid;
  } catch (error) {
    console.error("Proxy session creation failed:", error);
    return null;
  }
}

async function addParticipant(
  sessionSid: string,
  phone: string,
  friendlyName: string
) {
  await fetch(
    `https://proxy.twilio.com/v1/Services/${TWILIO_PROXY_SERVICE_SID}/Sessions/${sessionSid}/Participants`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        Identifier: phone,
        FriendlyName: friendlyName,
      }),
    }
  );
}

/**
 * Close a Twilio Proxy session.
 */
export async function closeProxySession(sessionSid: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PROXY_SERVICE_SID) {
    return;
  }

  try {
    await fetch(
      `https://proxy.twilio.com/v1/Services/${TWILIO_PROXY_SERVICE_SID}/Sessions/${sessionSid}`,
      {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ Status: "closed" }),
      }
    );
  } catch (error) {
    console.error("Proxy session close failed:", error);
  }
}
