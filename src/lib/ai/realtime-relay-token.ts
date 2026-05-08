import { createHmac, timingSafeEqual } from "node:crypto";

export type RealtimeRelayUnsignedPayload = {
  practiceSessionId: string;
  realtimeSessionId: string;
  model: string;
  instructions: string;
};

export type RealtimeRelayTokenPayload = RealtimeRelayUnsignedPayload & {
  issuedAt: string;
  expiresAt: string;
};

type CreateRealtimeRelayTokenOptions = {
  secret: string;
  now?: Date;
  ttlSeconds: number;
};

type VerifyRealtimeRelayTokenOptions = {
  secret: string;
  now?: Date;
};

function requireSecret(secret: string) {
  if (secret.trim().length === 0) {
    throw new Error("REALTIME_RELAY_SHARED_SECRET is required.");
  }
}

function encodeBase64URL(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64URL(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createRealtimeRelayToken(
  payload: RealtimeRelayUnsignedPayload,
  options: CreateRealtimeRelayTokenOptions,
) {
  requireSecret(options.secret);

  const now = options.now ?? new Date();
  const signedPayload: RealtimeRelayTokenPayload = {
    ...payload,
    issuedAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + options.ttlSeconds * 1000,
    ).toISOString(),
  };
  const encodedPayload = encodeBase64URL(JSON.stringify(signedPayload));
  const signature = signPayload(encodedPayload, options.secret);

  return `v1.${encodedPayload}.${signature}`;
}

export function verifyRealtimeRelayToken(
  token: string,
  options: VerifyRealtimeRelayTokenOptions,
) {
  requireSecret(options.secret);

  const [version, encodedPayload, signature] = token.split(".");

  if (version !== "v1" || !encodedPayload || !signature) {
    throw new Error("Realtime relay token is malformed.");
  }

  const expectedSignature = signPayload(encodedPayload, options.secret);
  const signatureBuffer = Buffer.from(signature, "base64url");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "base64url");

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error("Realtime relay token signature is invalid.");
  }

  const payload = JSON.parse(decodeBase64URL(encodedPayload)) as unknown;

  if (!payload || typeof payload !== "object") {
    throw new Error("Realtime relay token payload is invalid.");
  }

  const typedPayload = payload as Partial<RealtimeRelayTokenPayload>;
  const requiredStringFields: Array<keyof RealtimeRelayTokenPayload> = [
    "practiceSessionId",
    "realtimeSessionId",
    "model",
    "instructions",
    "issuedAt",
    "expiresAt",
  ];

  for (const field of requiredStringFields) {
    if (typeof typedPayload[field] !== "string") {
      throw new Error("Realtime relay token payload is invalid.");
    }
  }

  const expiresAt = Date.parse(typedPayload.expiresAt as string);

  if (!Number.isFinite(expiresAt)) {
    throw new Error("Realtime relay token expiration is invalid.");
  }

  if ((options.now ?? new Date()).getTime() > expiresAt) {
    throw new Error("Realtime relay token has expired.");
  }

  return typedPayload as RealtimeRelayTokenPayload;
}
