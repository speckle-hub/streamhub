# Deploy to Vercel

StreamHub is pre-configured to deploy directly to Vercel's Edge Serverless infrastructure with a single click.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOURNAME/streamhub)

## Post-Deploy Steps

1. **Click the button above** to clone the repository to your own GitHub and configure the Vercel project.
2. **Add Vercel Postgres Database**:
   - Go to the deployed project on your Vercel Dashboard.
   - Navigate to the **Storage** tab.
   - Attach a new **Vercel Postgres** database. This will autoset `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`.
3. **Add Vercel KV Database**:
   - In the same **Storage** tab, attach a new **Vercel KV** database. This provides low-latency caching for TMDB requests.
4. **Environment Variables**:
   - Add the required environment variables found in `ENV.md`. Most importantly: `TMDB_API_KEY` and `JWT_SECRET`.
5. **Initialize Database**:
   - Vercel automatically runs `npx prisma migrate deploy` on build. If it failed prior to step 2, trigger a manual redeployment.

Your StreamHub instance is now globally scaled!
