# Render Realtime Relay Setup

This service is required when the Realtime provider supports direct WebSocket access but does not support OpenAI ephemeral WebRTC client secrets.

## Architecture

- Vercel runs the Next.js app and creates a short-lived signed relay token.
- Render runs `nega-yunana-realtime-relay`, a Node WebSocket service.
- The browser connects to the Render relay with the signed token.
- The relay verifies the token, then connects to the provider WebSocket with `OPENAI_API_KEY`.
- The browser never receives the provider API key.

## Render Blueprint

Use `render.yaml` to create a new Render Blueprint service from this repository.

Render service settings:

- Service type: Web Service
- Runtime: Node
- Build command: `npm ci --include=dev`
- Start command: `npm run relay:start`
- Health check path: `/health`

Render environment variables:

- `REALTIME_RELAY_PROVIDER`: `gemini_live`
- `GEMINI_API_KEY`: Gemini API key. Mark as secret.
- `GEMINI_LIVE_MODEL`: `gemini-3.1-flash-live-preview`
- `REALTIME_RELAY_SHARED_SECRET`: a long random secret that you provide during Blueprint creation. Use the same value in Vercel.
- `REALTIME_RELAY_ALLOWED_ORIGINS`: `https://nega-yunana.vercel.app`

## Vercel Variables

Before creating the Render service, generate one shared secret:

```bash
openssl rand -base64 32
```

Use that exact value for `REALTIME_RELAY_SHARED_SECRET` in both Render and Vercel.

After the Render service is live, add these to the Vercel project:

- `OPENAI_REALTIME_TRANSPORT=websocket_relay`
- `REALTIME_RELAY_PROVIDER=gemini_live`
- `REALTIME_RELAY_URL=wss://<your-render-service>.onrender.com/realtime`
- `REALTIME_RELAY_SHARED_SECRET=<same value as Render>`

## Local Smoke Test

Start the relay locally:

```bash
REALTIME_RELAY_PROVIDER=gemini_live \
GEMINI_API_KEY=AIza... \
GEMINI_LIVE_MODEL=gemini-3.1-flash-live-preview \
REALTIME_RELAY_SHARED_SECRET=dev-relay-secret \
REALTIME_RELAY_ALLOWED_ORIGINS=http://localhost:3000 \
npm run relay:start
```

Check health:

```bash
curl http://localhost:4001/health
```

Expected:

```json
{"ok":true,"service":"nega-yunana-realtime-relay"}
```
