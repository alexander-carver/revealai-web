import Whop from "@whop/sdk";

let whopClient: Whop | null = null;

function getWhopWebhookKey() {
  const rawSecret = process.env.WHOP_WEBHOOK_SECRET?.trim();

  if (!rawSecret) {
    return undefined;
  }

  // Whop's webhook guide shows copying the dashboard key and base64-encoding it
  // before passing it to the SDK. Keep already-normalized secrets untouched.
  if (rawSecret.startsWith("whsec_")) {
    return rawSecret;
  }

  const isAlreadyBase64 =
    rawSecret.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(rawSecret);

  if (isAlreadyBase64) {
    return rawSecret;
  }

  return Buffer.from(rawSecret, "utf8").toString("base64");
}

export function getWhopClient() {
  const apiKey = process.env.WHOP_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("WHOP_API_KEY is not configured");
  }

  if (!whopClient) {
    whopClient = new Whop({
      apiKey,
      webhookKey: getWhopWebhookKey(),
    });
  }

  return whopClient;
}

export function toWhopCheckoutUrl(purchaseUrl: string) {
  return new URL(purchaseUrl, "https://whop.com").toString();
}
