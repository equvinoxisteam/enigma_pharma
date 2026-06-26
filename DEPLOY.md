# Enigma Pharma — Railway Deployment

## Architecture

| Service | Domain | Port |
|---------|--------|------|
| **Frontend** | `https://enigmapharma.equvinoxis.com` | 3000 |
| **Backend API** | `https://api.enigmapharma.equvinoxis.com` | Railway `PORT` (auto) |

MongoDB database: **`enigmapharma`** (not `enigma`)  
S3 folder prefix: **`enigmapharma`**

---

## Step 1 — GitHub

Repo: https://github.com/equvinoxisteam/enigma_pharma.git

---

## Step 2 — Railway: Backend service

1. New Project → Deploy from GitHub → `enigma_pharma`
2. **Root directory:** `project/server`
3. **Start command:** `node server.js`
4. Custom domain: `api.enigmapharma.equvinoxis.com`
5. Paste variables below into Railway → Variables (**no quotes**)

### Backend variables (copy block)

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/enigmapharma?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
ADMIN_EMAIL=your_admin@email.com
ADMIN_PASSWORD=your_strong_admin_password
FRONTEND_URL=https://enigmapharma.equvinoxis.com
CLIENT_URL=https://enigmapharma.equvinoxis.com
API_URL=https://api.enigmapharma.equvinoxis.com
CORS_ORIGINS=https://enigmapharma.equvinoxis.com,https://www.enigmapharma.equvinoxis.com
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=indianet-equvinoxis
S3_FOLDER_PREFIX=enigmapharma
S3_PUBLIC_URL=https://indianet-equvinoxis.s3.eu-north-1.amazonaws.com
GMAIL_CLIENT_ID=YOUR_GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET=YOUR_GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN=YOUR_GMAIL_REFRESH_TOKEN
GMAIL_USER=info@equvinoxis.com
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
APP_NAME=Enigma Pharma
SUPPORT_EMAIL=info@equvinoxis.com
VERTICAL=pharma
```

**Important:** Do **not** set `PORT` in Railway — Railway assigns it automatically. Hardcoding `PORT=5005` causes **502 Bad Gateway** and CORS errors in the browser.

Replace `YOUR_AWS_*` and `YOUR_GMAIL_*` with your Equvinoxis credentials (same AWS bucket as manufacturing, but `S3_FOLDER_PREFIX=enigmapharma` and DB `enigmapharma`).

**Do not add Razorpay keys.**

---

## Step 3 — Railway: Frontend service

1. New Service → same repo
2. **Root directory:** `project/ecotrade`
3. **Build:** `npm install && npm run build`
4. **Start:** `npm start`
5. Domain: `enigmapharma.equvinoxis.com`

```
VITE_BACKEND_URL=https://api.enigmapharma.equvinoxis.com
VITE_APP_NAME=Enigma Pharma
```

---

## Step 4 — DNS

| Type | Name | Target |
|------|------|--------|
| CNAME | enigmapharma | Railway frontend hostname |
| CNAME | api.enigmapharma | Railway backend hostname |

---

## Step 5 — Verify

1. `GET https://api.enigmapharma.equvinoxis.com/api/health` → `adminConfigured: true`
2. Register Pharma Buyer → Create RFQ (NDA required)
3. Admin login → approve CDMO plan
4. CDMO submits bid

## Admin login

- `https://enigmapharma.equvinoxis.com/login`
- `aniketh1607@gmail.com` / your `ADMIN_PASSWORD`
