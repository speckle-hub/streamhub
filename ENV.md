# Environment Variables Guide

## Required

*   `TMDB_API_KEY`: Your The Movie Database API key (create one at tmdb.org -> Settings -> API).
*   `JWT_SECRET`: Used to sign user session cookies. Run `openssl rand -base64 32` to generate one.

## Vercel Auto-Provisioned (Do not set manually)

If deploying on Vercel Context, attaching Vercel Postgres and Vercel KV in the dashboard will automatically inject these variables into your app context:
*   `POSTGRES_PRISMA_URL`
*   `POSTGRES_URL_NON_POOLING`
*   `KV_URL`
*   `KV_REST_API_URL`
*   `KV_REST_API_TOKEN`

## Optional / Advanced

*   `RD_TOKEN`: Your Real-Debrid API token for resolving cached torrents. (If omitted, individual users can provide their own Debrid API token in the StreamHub client settings).
*   `NODE_ENV`: Standard environment flag (`development` or `production`). 
*   `PORT`: Localhost port for the server (default `3001`).
