# Deployment Readiness Notes

## Production Environment

Configure these variables in the deployment provider before enabling real AI calls:

- `DEEPSEEK_API_KEY`: server-side DeepSeek API key for text analysis, material briefs, prep cards, and reviews.
- `DEEPSEEK_BASE_URL`: `https://api.deepseek.com`.
- `DEEPSEEK_TEXT_MODEL`: `deepseek-v4-pro`.
- `OPENAI_REALTIME_TRANSPORT`: use `websocket_relay` for the Render relay.
- `REALTIME_RELAY_PROVIDER`: `gemini_live` for Gemini Live realtime voice.
- `REALTIME_RELAY_URL`: Render relay WebSocket URL when `OPENAI_REALTIME_TRANSPORT=websocket_relay`; production uses `wss://nega-yunana-realtime-relay-oregon.onrender.com/realtime`.
- `REALTIME_RELAY_SHARED_SECRET`: shared HMAC secret used by Vercel and Render to sign and verify relay tokens.
- `GEMINI_API_KEY`: Gemini key configured on the Render relay service only.
- `GEMINI_LIVE_MODEL`: `gemini-3.1-flash-live-preview`.
- `DATABASE_URL`: PostgreSQL connection string.
- `APP_BASE_URL`: public app URL, such as `https://your-domain.com`.
- `UPLOAD_DIR`: local upload directory for the current filesystem storage adapter.
- `CONFIDENTIAL_MODE_DEFAULT`: keep as `true` for customer materials.

`.env.example` contains the required shape. Do not commit real `.env` or `.env.local` files.

See `docs/production-environment-setup.md` for the current Vercel project, configured non-secret values, and remaining required secrets.
See `docs/render-realtime-relay.md` for the Render WebSocket relay setup.

## Privacy And Storage

- Uploaded files are written under `UPLOAD_DIR`.
- `.gitignore` excludes `uploads/`, `storage/`, `.env`, `.env.local`, and `.env.*.local`.
- Material deletion removes the local stored file, material record, generated brief, related prep cards, related practice sessions, transcripts, and reviews.
- The current local filesystem upload adapter is suitable for local development. For production hosting on Vercel or another serverless platform, replace or wrap it with persistent object storage before relying on uploaded files across deployments.

## AI Key Safety

- `DEEPSEEK_API_KEY` is read in server-side AI modules only.
- `GEMINI_API_KEY` is used by the Render relay only, not by browser code.
- `REALTIME_RELAY_SHARED_SECRET` is server-side only and must match between Vercel and Render.
- Client components never read provider API keys or any `NEXT_PUBLIC_*` AI key variable.
- The Realtime route returns a short-lived relay token, not a provider API key.
- `tests/api/realtime-session.test.ts` verifies that the serialized Realtime response does not contain server-side secrets.

## Confidential Material UX

- The upload form shows an English and Chinese privacy warning before file selection.
- `Confidential mode` is checked by default.
- The material list displays a visible `Confidential` status pill for protected materials.

## Validation Commands

Run before deployment:

```bash
npm run typecheck
npm run test
npm run build
npm run e2e
```

GitHub Actions currently runs:

```bash
npm ci
npm run typecheck
npm run test
npm run build
```
