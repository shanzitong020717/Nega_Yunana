# Production Environment Setup

## Current Vercel Project

- Vercel account: `shanzitong020717-9686`
- Vercel project: `nega-yunana`
- Expected production URL: `https://nega-yunana.vercel.app`
- Local project link: `.vercel/` is generated locally and ignored by git.

## Variables Already Configured

These values have been added to Vercel Production and Development:

- `APP_BASE_URL`
  - Production: `https://nega-yunana.vercel.app`
  - Development: `http://localhost:3000`
- `UPLOAD_DIR`
  - Production and Development: `/tmp/rokid-uploads`
- `CONFIDENTIAL_MODE_DEFAULT`
  - Production and Development: `true`

Preview values are configured for the active `feature/app-foundation` branch.

## AI Variables Configured

These AI variables are configured in Vercel Production, Preview for `feature/app-foundation`, and Development:

- `DEEPSEEK_API_KEY`
  - Environments: Production, Preview, Development
  - Mark as sensitive.
- `DEEPSEEK_BASE_URL=https://api.deepseek.com`
  - Environments: Production, Preview, Development
- `DEEPSEEK_TEXT_MODEL=deepseek-v4-pro`
  - Environments: Production, Preview, Development
Recommended optional variables:

- `AI_MOCK_MODE=false`
- `SUBTITLE_TRANSLATION_PROVIDER=deepseek`
- `SUBTITLE_DEEPSEEK_MODEL=deepseek-v4-flash`
- `GEMINI_FLASH_TEXT_MODEL=gemini-2.5-flash` if Gemini Flash subtitles are enabled later
- `GEMINI_API_KEY=<same Gemini key, also configured on Vercel if Gemini Flash subtitles are enabled later>`

For Realtime voice practice, use Gemini Live through the Render relay:

- `OPENAI_REALTIME_TRANSPORT=websocket_relay`
- `REALTIME_RELAY_PROVIDER=gemini_live`
- `REALTIME_RELAY_URL=wss://nega-yunana-realtime-relay-oregon.onrender.com/realtime`
- `REALTIME_RELAY_SHARED_SECRET=<same value as Render>`

The active Render relay is `nega-yunana-realtime-relay-oregon` in Oregon. Keep the older Singapore relay unused for Gemini Live unless Google enables that Render egress path.

See `docs/render-realtime-relay.md`.

## CLI Commands

Use these commands if you prefer the terminal. Do not paste secrets into committed files.

```bash
npx vercel link --yes --project nega-yunana
npx vercel env ls
npx vercel env add DEEPSEEK_API_KEY production --sensitive
npx vercel env add DEEPSEEK_BASE_URL production
npx vercel env add DEEPSEEK_TEXT_MODEL production
npx vercel env add SUBTITLE_TRANSLATION_PROVIDER production
npx vercel env add SUBTITLE_DEEPSEEK_MODEL production
npx vercel env add GEMINI_FLASH_TEXT_MODEL production
npx vercel env add GEMINI_API_KEY production --sensitive
npx vercel env add REALTIME_RELAY_URL production
npx vercel env add DATABASE_URL production --sensitive
npx vercel env pull .env.local --yes
```

For branch-specific Preview values:

```bash
npx vercel env add DEEPSEEK_API_KEY preview --sensitive
npx vercel env add DEEPSEEK_BASE_URL preview
npx vercel env add DEEPSEEK_TEXT_MODEL preview
npx vercel env add SUBTITLE_TRANSLATION_PROVIDER preview
npx vercel env add SUBTITLE_DEEPSEEK_MODEL preview
npx vercel env add GEMINI_FLASH_TEXT_MODEL preview
npx vercel env add GEMINI_API_KEY preview --sensitive
npx vercel env add REALTIME_RELAY_URL preview feature/app-foundation
npx vercel env add DATABASE_URL preview --sensitive
npx vercel env add APP_BASE_URL preview
npx vercel env add UPLOAD_DIR preview
npx vercel env add CONFIDENTIAL_MODE_DEFAULT preview
```

## Important Storage Note

The current upload adapter writes files to local filesystem storage. On Vercel, `/tmp` is ephemeral and not suitable for long-term customer material retention. This is acceptable for a first deployment smoke test, but production use should move uploaded files to persistent object storage such as Vercel Blob, S3, R2, or Supabase Storage.

## Deployment Check

Run locally before production deployment:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
```

Apply production database migrations after `DATABASE_URL` points to the managed production database:

```bash
npm run db:migrate:deploy
```

Deploy after required secrets are configured:

```bash
npx vercel --prod
```
