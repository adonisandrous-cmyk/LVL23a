/**
 * PHOENIX 23 LEGAL OS — MULTI-ACCOUNT INGESTION & DISPATCH BRIDGE (Node.js / JS Companion)
 * Accounts: level23@gmail.com, level23consulting@gmail.com, adonisandrous@gmail.com
 */

export const AUTHORIZED_SENDERS = [
  "level23@gmail.com",
  "level23consulting@gmail.com",
  "adonisandrous@gmail.com"
];

export const PHOENIX_BRIDGE_CONFIG = {
  stagingFolderId: "YOUR_GOOGLE_DRIVE_FOLDER_ID",
  authorizedSenders: AUTHORIZED_SENDERS,
  accounts: AUTHORIZED_SENDERS,
  appEndpoint: "/api/phoenix/webhook-intake",
  version: "2.4.0-phoenix"
};

// Dispatch payload helper for client-side or microservice use
export async function dispatchIntakeToPhoenixBridge(intakeData, bridgeWebhookUrl) {
  const url = bridgeWebhookUrl || "/api/phoenix/webhook-intake";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "Phoenix_Legal_OS_Client_Intake_Bridge",
      accounts: AUTHORIZED_SENDERS,
      ...intakeData
    })
  });
  return await response.json();
}

