const LOCAL_DEVELOPMENT_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
]);

export function parseRealtimeRelayAllowedOrigins(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function isNegaYunanaVercelOrigin(origin: string) {
  try {
    const url = new URL(origin);

    return (
      url.protocol === "https:" &&
      (url.hostname === "nega-yunana.vercel.app" ||
        (url.hostname.startsWith("nega-yunana-") &&
          url.hostname.endsWith(".vercel.app")))
    );
  } catch {
    return false;
  }
}

export function isRealtimeRelayOriginAllowed(
  origin: string | undefined,
  allowedOrigins: Set<string>,
) {
  if (allowedOrigins.size === 0) {
    return true;
  }

  if (!origin) {
    return false;
  }

  return (
    allowedOrigins.has(origin) ||
    LOCAL_DEVELOPMENT_ORIGINS.has(origin) ||
    isNegaYunanaVercelOrigin(origin)
  );
}
