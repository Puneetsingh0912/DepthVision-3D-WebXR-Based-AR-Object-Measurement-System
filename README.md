# DepthVision 3D — WebXR AR Object Measurement

A browser-based AR measurement prototype exploring object-distance estimation using smartphone camera parameters and WebXR depth sensing. It supports capturing measurement samples, exporting CSV, comparing an estimate with a reference distance, and saving captured samples to MongoDB Atlas through a separate Node.js API.

## Features

- WebXR immersive AR session on compatible browsers/devices
- Optional depth sensing where the browser exposes it
- Point-depth distance calculations using camera intrinsics
- Sample capture, recent measurement log, and CSV export
- Backend API endpoints for storing and retrieving readings
- MongoDB Atlas persistence via Mongoose

## Architecture

`Phone browser → GitHub Pages frontend → Node.js/Express API → MongoDB Atlas`

GitHub Pages hosts only static frontend files. It cannot run the Node.js API; deploy `backend/` separately on a Node.js host such as Render.

## Publish frontend on GitHub Pages

1. Upload the repository files with `index.html` at the repository root.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, branch `main`, folder `/(root)`, then save.
4. Your expected project URL is `https://Puneetsingh0912.github.io/DepthVision-3D-WebXR-Based-AR-Object-Measurement-System/` once Pages has finished deploying.

## Deploy backend and MongoDB

1. In MongoDB Atlas, create/use a cluster and create a dedicated database user with `readWrite` only on the `depthvision` database. Avoid using an `atlasAdmin` user for the app.
2. Because a database URI/password was shared in chat, rotate that database user's password or create a new restricted user before deployment. Do not reuse the exposed password.
3. Deploy this repository as a Web Service on a Node.js host. Set the **Root Directory** to `backend`, the **Build Command** to `npm install`, and the **Start Command** to `npm start`.
4. In the host's environment/secrets settings, set:
   - `MONGODB_URI` = the new Atlas connection string including database `depthvision`
   - `ALLOWED_ORIGINS` = `https://puneetsingh0912.github.io`
   - `NODE_ENV` = `production` (if supported)
5. Wait for the host to provide an HTTPS backend URL. Open the GitHub Pages website, enter that URL in **MongoDB cloud readings**, then click **Save API URL**.
6. Capture a reading and use **Load latest readings** to confirm persistence.

Never place `MONGODB_URI`, passwords, API secrets, or `.env` files in the frontend or GitHub repository.

## API endpoints

- `GET /health` — API and database connection status
- `POST /api/readings` — stores one measurement sample
- `GET /api/readings?limit=10` — retrieves recent samples (maximum 100)

## Limitations

WebXR immersive AR and depth sensing depend on device/browser support and a secure HTTPS origin. This is a research prototype; it is not yet a validated automatic full 3D scanner. Robust object segmentation, multi-frame point-cloud fusion, and automatic width/height/depth reconstruction remain future work. The sample API currently has no user authentication, so add authentication and abuse controls before collecting sensitive data or opening it to high-volume public use.
