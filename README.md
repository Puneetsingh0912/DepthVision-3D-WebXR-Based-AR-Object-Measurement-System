# AR 3D Measurement API (Node.js + MongoDB Atlas)

This backend stores each captured measurement sample from the GitHub Pages frontend. The frontend must call this API; GitHub Pages cannot run the Node server itself.

## 1. Create a MongoDB Atlas database
1. Create a free/shared cluster at https://www.mongodb.com/atlas/database.
2. Create a database user and a strong password.
3. In Network Access, allow the backend hosting provider to connect. Avoid `0.0.0.0/0` for production unless you understand the exposure and have no better option.
4. Copy the Node.js driver connection string and replace username/password/database values.

## 2. Run locally
Requires Node.js 20+.

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set MONGODB_URI and ALLOWED_ORIGINS
npm start
```

API endpoints:
- `GET /health` — health/database status
- `POST /api/readings` — store one measurement
- `GET /api/readings?limit=10` — latest readings (max 100)

## 3. Deploy backend separately
Deploy the `backend` directory to a Node.js host such as Render or Railway. Set these environment variables in the host dashboard:
- `MONGODB_URI` = your Atlas connection string
- `ALLOWED_ORIGINS` = your exact GitHub Pages origin, e.g. `https://YOUR-USERNAME.github.io` (origin has no repository path)
- `NODE_ENV` = `production` (if supported)

The backend host will provide an HTTPS service URL, e.g. `https://your-api.example.com`.

## 4. Connect GitHub Pages frontend
Open the deployed GitHub Pages website, find **MongoDB cloud readings**, paste the backend HTTPS URL (no trailing slash), then tap **Save API URL**. Capture a sample; it will be POSTed to MongoDB. Tap **Load latest readings** to view recent records.

## Security notes
- Never commit `.env` or expose `MONGODB_URI` in browser JavaScript.
- CORS only limits browser origins; it is not authentication. This starter is suitable for a prototype, not sensitive or public high-volume production use. Add authentication/API tokens, stronger abuse controls and retention rules before public deployment.
- Location data is not collected by this prototype. Only measurement fields are stored.
