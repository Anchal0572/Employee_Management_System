# Production Deployment & Cloud Infrastructure Guide

## 1. Overview
This guide provides step-by-step instructions for deploying the Employee Management System (EMS) across production cloud providers with zero secret exposure, high availability, and SSL/TLS encryption.

---

## 2. Recommended Cloud Architecture

```
                      +-----------------------------+
                      |         USERS / WEB         |
                      +--------------+--------------+
                                     | HTTPS (Port 443)
                                     v
                      +-----------------------------+
                      |      VERCEL / NETLIFY       |
                      |   React 18 Production SPA   |
                      +--------------+--------------+
                                     | REST API (HTTPS)
                                     v
                      +-----------------------------+
                      |       RENDER / RAILWAY      |
                      |  Node.js API Server (5000)  |
                      |  & Decoupled AI Microservice|
                      +--------------+--------------+
                                     | TLS 1.3 / SRV
                                     v
                      +-----------------------------+
                      |        MONGODB ATLAS        |
                      |     Cloud Replica Set       |
                      +-----------------------------+
```

---

## 3. Database Deployment: MongoDB Atlas

### Step 1: Create a MongoDB Atlas Cluster
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project and provision a cluster (the **M0 Free Tier** or **M10+** for production).
3. Select an AWS/GCP region closest to your server deployment location.

### Step 2: Configure Database User & Access
1. Navigate to **Database Access** &rarr; **Add New Database User**.
2. Create an administrative user (e.g., `ems_admin`) with **Read and write to any database** privileges.
3. Generate a secure, 32-character password.

### Step 3: Network Access & IP Whitelisting
1. Navigate to **Network Access** &rarr; **Add IP Address**.
2. For production platforms with dynamic IPs (like Render or Railway), allow access from anywhere (`0.0.0.0/0`) or enter the dedicated static outbound IPs if using a static VPC.

### Step 4: Obtain Connection String
1. Under your cluster, click **Connect** &rarr; **Drivers** (Node.js).
2. Copy the standard connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/ems_db?retryWrites=true&w=majority
   ```

---

## 4. Backend Deployment: Render or Railway

### Step 1: Push Repository to GitHub
Ensure the `.env` file is listed in `.gitignore` and has **never** been pushed.

### Step 2: Create a Web Service on Render
1. Sign in to [Render](https://render.com) and click **New +** &rarr; **Web Service**.
2. Connect your GitHub repository.
3. Configure the build and start settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

### Step 3: Configure Environment Variables
In the Render dashboard under **Environment**, add the following:
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-ems-frontend.vercel.app
MONGO_URI=mongodb+srv://ems_admin:<PASSWORD>@cluster0.abcde.mongodb.net/ems_db?retryWrites=true&w=majority
JWT_SECRET=your_super_secure_random_64_character_key
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX_REQUESTS=300
AUTH_RATE_LIMIT_MAX=15
```

---

## 5. Frontend Deployment: Vercel

### Step 1: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New...** &rarr; **Project**.
2. Import the repository.

### Step 2: Configure Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Single-Page Application (SPA) Routing
Ensure `client/vercel.json` exists in the repository with the rewrite configuration:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 4: Add Environment Variables in Vercel
In Vercel **Settings** &rarr; **Environment Variables**:
```env
VITE_API_BASE_URL=https://your-ems-backend.onrender.com/api
VITE_APP_NAME="EMS Enterprise"
```

---

## 6. Pre-Flight Production Checklist

- [x] **No Secrets in Version Control**: `.env` is ignored by `.gitignore`.
- [x] **JWT Secret Strength**: `JWT_SECRET` is a cryptographically strong random string (>= 32 characters).
- [x] **CORS Locked Down**: `CLIENT_URL` restricts origins to the exact production frontend domain.
- [x] **Secure Headers Active**: Helmet HSTS, X-Frame-Options (`DENY`), and CSP enabled.
- [x] **Rate Limiting Enabled**: Auth route throttled to 15 attempts / 15 min; API throttled to 300 req / 15 min.
- [x] **Input Sanitization**: NoSQL injection operators and XSS script tags stripped automatically.
- [x] **MongoDB Atlas Connection**: Authenticated via TLS connection string with replica set failover.
- [x] **Frontend SPA Routing**: `vercel.json` rewrites all direct URL navigations to `index.html`.
