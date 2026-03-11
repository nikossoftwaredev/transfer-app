"use server";

/**
 * Send SMS via Twilio.
 * Fire-and-forget with error logging.
 */
export async function sendSMS(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.warn("Twilio not configured — skipping SMS to", to);
    return;
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      }
    );

    if (!res.ok) {
      console.error("Twilio SMS error:", await res.text());
    }
  } catch (error) {
    console.error("SMS send failed:", error);
  }
}

// SMS Templates
export async function sendDriverAssignedSMS(
  clientPhone: string,
  driverName: string,
  vehicleName: string,
  plateNumber: string
) {
  await sendSMS(
    clientPhone,
    `Your driver ${driverName} is on the way in a ${vehicleName} (${plateNumber}). Track your ride in the app.`
  );
}

export async function sendDriverInviteSMS(
  phone: string,
  orgName: string,
  driverName: string
) {
  await sendSMS(
    phone,
    `Hi ${driverName}, you've been invited to join ${orgName} on TransferGR. Download the app and use your phone number to log in.`
  );
}

export async function sendTripCompletedSMS(
  clientPhone: string,
  fare: number,
  paymentMethod: string
) {
  await sendSMS(
    clientPhone,
    `Your trip is complete. Fare: €${fare.toFixed(2)} (${paymentMethod}). Thank you for riding with TransferGR!`
  );
}
