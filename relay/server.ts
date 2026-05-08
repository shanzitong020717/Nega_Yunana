import { createServer, type IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer, type RawData } from "ws";

import { buildProviderRealtimeWebSocketURL } from "../src/lib/ai/realtime-relay-url";
import { verifyRealtimeRelayToken } from "../src/lib/ai/realtime-relay-token";

type RelayWebSocket = WebSocket & {
  isAlive?: boolean;
};

const DEFAULT_PORT = 4001;
const DEFAULT_REALTIME_MODEL = "gpt-4o-realtime-preview";
const MAX_QUEUED_MESSAGES = 25;

function stripQuotes(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    return trimmedValue.slice(1, -1).trim();
  }

  return trimmedValue;
}

function optionalEnv(name: string) {
  const value = stripQuotes(process.env[name]);

  return value.length > 0 ? value : undefined;
}

function requiredEnv(name: string) {
  const value = optionalEnv(name);

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function parseAllowedOrigins(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function requestURL(request: IncomingMessage) {
  return new URL(request.url ?? "/", `http://${request.headers.host}`);
}

function isOriginAllowed(request: IncomingMessage, allowedOrigins: Set<string>) {
  if (allowedOrigins.size === 0) {
    return true;
  }

  const origin = request.headers.origin;

  return typeof origin === "string" && allowedOrigins.has(origin);
}

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return {
    status,
    body: `${JSON.stringify(payload)}\n`,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  };
}

function buildSessionUpdate(instructions: string) {
  return {
    type: "session.update",
    session: {
      modalities: ["audio", "text"],
      instructions,
      voice: "marin",
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "gpt-4o-mini-transcribe",
        language: "en",
        prompt:
          "Expect English business meeting speech about Rokid smart glasses, real-time translation, overseas sales, pilots, deployment, security, ROI, and customer objections.",
      },
      turn_detection: {
        type: "server_vad",
        create_response: true,
        interrupt_response: true,
      },
    },
  };
}

function closeSocket(socket: Duplex, statusCode: number) {
  const statusText = statusCode === 401 ? "Unauthorized" : "Forbidden";

  socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r\n\r\n`);
  socket.destroy();
}

function createProviderSocket(token: string, model: string) {
  const providerWebSocketURL = buildProviderRealtimeWebSocketURL({
    baseURL: optionalEnv("OPENAI_BASE_URL") ?? "https://api.openai.com/v1",
    providerWebSocketURL: optionalEnv("REALTIME_PROVIDER_WS_URL"),
    model,
  });

  return new WebSocket(providerWebSocketURL, {
    headers: {
      Authorization: `Bearer ${token}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });
}

function bridgeSockets({
  browserSocket,
  providerSocket,
  instructions,
  realtimeSessionId,
  model,
}: {
  browserSocket: RelayWebSocket;
  providerSocket: WebSocket;
  instructions: string;
  realtimeSessionId: string;
  model: string;
}) {
  const queuedMessages: Array<{ data: RawData; isBinary: boolean }> = [];

  browserSocket.isAlive = true;
  browserSocket.on("pong", () => {
    browserSocket.isAlive = true;
  });

  browserSocket.on("message", (data, isBinary) => {
    if (providerSocket.readyState === WebSocket.OPEN) {
      providerSocket.send(data, { binary: isBinary });
      return;
    }

    if (queuedMessages.length < MAX_QUEUED_MESSAGES) {
      queuedMessages.push({ data, isBinary });
    }
  });

  browserSocket.on("close", () => {
    providerSocket.close();
  });

  browserSocket.on("error", () => {
    providerSocket.close();
  });

  providerSocket.on("open", () => {
    providerSocket.send(JSON.stringify(buildSessionUpdate(instructions)));
    browserSocket.send(
      JSON.stringify({
        type: "relay.ready",
        realtimeSessionId,
        model,
      }),
    );

    for (const message of queuedMessages.splice(0)) {
      providerSocket.send(message.data, { binary: message.isBinary });
    }
  });

  providerSocket.on("message", (data, isBinary) => {
    if (browserSocket.readyState === WebSocket.OPEN) {
      browserSocket.send(data, { binary: isBinary });
    }
  });

  providerSocket.on("close", (code, reason) => {
    if (browserSocket.readyState === WebSocket.OPEN) {
      browserSocket.close(code, reason);
    }
  });

  providerSocket.on("error", (error) => {
    console.warn("[relay] Provider WebSocket failed.", {
      name: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });

    if (browserSocket.readyState === WebSocket.OPEN) {
      browserSocket.send(
        JSON.stringify({
          type: "relay.error",
          message: "Realtime provider connection failed.",
        }),
      );
      browserSocket.close(1011, "Provider connection failed.");
    }
  });
}

const port = Number.parseInt(optionalEnv("PORT") ?? `${DEFAULT_PORT}`, 10);
const sharedSecret = requiredEnv("REALTIME_RELAY_SHARED_SECRET");
const providerApiKey = requiredEnv("OPENAI_API_KEY");
const defaultModel = optionalEnv("OPENAI_REALTIME_MODEL") ?? DEFAULT_REALTIME_MODEL;
const allowedOrigins = parseAllowedOrigins(
  optionalEnv("REALTIME_RELAY_ALLOWED_ORIGINS"),
);

const server = createServer((request, response) => {
  const url = requestURL(request);

  if (url.pathname === "/health") {
    const health = jsonResponse(200, {
      ok: true,
      service: "nega-yunana-realtime-relay",
    });

    response.writeHead(health.status, health.headers);
    response.end(health.body);
    return;
  }

  const notFound = jsonResponse(404, {
    error: "not_found",
  });

  response.writeHead(notFound.status, notFound.headers);
  response.end(notFound.body);
});
const webSocketServer = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = requestURL(request);

  if (url.pathname !== "/realtime") {
    closeSocket(socket, 403);
    return;
  }

  if (!isOriginAllowed(request, allowedOrigins)) {
    closeSocket(socket, 403);
    return;
  }

  const token = url.searchParams.get("token");

  if (!token) {
    closeSocket(socket, 401);
    return;
  }

  let payload: ReturnType<typeof verifyRealtimeRelayToken>;

  try {
    payload = verifyRealtimeRelayToken(token, {
      secret: sharedSecret,
    });
  } catch {
    closeSocket(socket, 401);
    return;
  }

  webSocketServer.handleUpgrade(request, socket, head, (browserSocket) => {
    const model = payload.model || defaultModel;
    const providerSocket = createProviderSocket(providerApiKey, model);

    bridgeSockets({
      browserSocket: browserSocket as RelayWebSocket,
      providerSocket,
      instructions: payload.instructions,
      realtimeSessionId: payload.realtimeSessionId,
      model,
    });
  });
});

const heartbeat = setInterval(() => {
  for (const browserSocket of webSocketServer.clients as Set<RelayWebSocket>) {
    if (browserSocket.isAlive === false) {
      browserSocket.terminate();
      continue;
    }

    browserSocket.isAlive = false;
    browserSocket.ping();
  }
}, 30_000);

server.listen(port, "0.0.0.0", () => {
  console.info(`[relay] Listening on 0.0.0.0:${port}`);
});

function shutdown() {
  clearInterval(heartbeat);
  webSocketServer.close();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
