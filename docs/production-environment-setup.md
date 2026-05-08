# Production Environment Setup

## Current Vercel Project

- Vercel account: `shanzitong020717-9686`
- Vercel project: `nega-yunana`
- Expected production URL: `https://nega-yunana.vercel.app`
- Local project link: `.vercel/` is generated locally and ignored by git.

## Variables Already Configured

These non-secret values have been added to Vercel Production and Development:

- `APP_BASE_URL`
  - Production: `https://nega-yunana.vercel.app`
  - Development: `http://localhost:3000`
- `UPLOAD_DIR`
  - Production and Development: `/tmp/rokid-uploads`
- `CONFIDENTIAL_MODE_DEFAULT`
  - Production and Development: `true`

Preview variables are not configured yet because the Vercel project is not connected to the GitHub repository. Connect the project to `shanzitong020717/Nega_Yunana`, then add Preview values in the Vercel dashboard.

CLI Git connection was attempted with:

```bash
npx vercel git connect https://github.com/shanzitong020717/Nega_Yunana
```

Vercel returned: `You need to add a Login Connection to your GitHub account first.` Add the GitHub connection in Vercel account settings, then rerun the command or connect the repository from Project Settings -> Git.

## Variables Still Required

Add these in Vercel Project Settings > Environment Variables:

- `OPENAI_API_KEY`
  - Environments: Production, Preview, Development
  - Mark as sensitive.
- `DATABASE_URL`
  - Environments: Production, Preview, Development
  - Use a managed PostgreSQL database, not the local development URL.

Recommended optional variables:

- `OPENAI_TEXT_MODEL=gpt-5.4-mini`
- `OPENAI_REALTIME_MODEL=gpt-realtime-mini`
- `AI_MOCK_MODE=false`

## CLI Commands

Use these commands if you prefer the terminal. Do not paste secrets into committed files.

```bash
npx vercel link --yes --project nega-yunana
npx vercel env ls
npx vercel env add OPENAI_API_KEY production --sensitive
npx vercel env add DATABASE_URL production --sensitive
npx vercel env pull .env.local --yes
```

After connecting the GitHub repository to Vercel, also add Preview values:

```bash
npx vercel env add OPENAI_API_KEY preview --sensitive
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
