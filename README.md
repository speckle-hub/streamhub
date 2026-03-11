# StreamHub

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOURNAME/streamhub)

Unified streaming interface bridging the gap between premium TMDB metadata, Real-Debrid high-speed streaming, and Community Stremio Addons.

## Features
- **Unified Catalog**: Browse Movies, TV Shows, and Anime in one unified cinematic interface powered by TMDB.
- **Debrid Streaming**: Seamlessly resolves high-speed cached torrents via Real-Debrid.
- **Stremio Addon Engine**: Install community Stremio addons via an intuitive proxy layer.
- **Progressive Web App**: Installable PWA with offline caching strategies.
- **Privacy First**: Secure Adult content section behind an 18+ Age Gate and secondary PIN lock with auto-clearing histories.

## Local Development
1. Clone the repository.
2. Fill out the `.env` file (refer to `ENV.md`).
3. Run `npm install` in both `/client` and `/server`.
4. Run `vercel dev` in the project root to start both environments using Vercel CLI routing.

*See DEPLOY.md for 1-click Vercel Deployment instructions.*
