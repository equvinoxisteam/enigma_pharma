# Enigma Pharma — Platform Guide
**Pharmaceutical CDMO procurement · Live at [enigmapharma.equvinoxis.com](https://enigmapharma.equvinoxis.com)**

> Internal + onboarding document. **Do not commit real API keys or passwords to GitHub.**

---

## 1. Production health check

| Service | URL | Notes |
|---------|-----|--------|
| Frontend | https://enigmapharma.equvinoxis.com | SPA (Vite + serve) |
| Backend API | https://api.enigmapharma.equvinoxis.com | Express on Railway |
| Health endpoint | `/api/health` | Expect `status: OK`, `storage: s3`, `adminConfigured: true` |
| MongoDB | Atlas `…/enigmapharma` | Separate DB from manufacturing Enigma |
| File storage | S3 `indianet-equvinoxis/enigmapharma/` | NDA PDFs, project docs, profile images |
| CORS | `enigmapharma.equvinoxis.com` | Must match `CORS_ORIGINS` (no quotes in Railway) |

### Common deploy issue: 502 / CORS errors

If the browser shows **CORS blocked** or **ERR_FAILED** on `/api/auth/register`, the API is often **down** (502), not misconfigured CORS.

**Fix:** In Railway backend variables, **remove `PORT=5005`**. Railway injects `PORT` automatically. Hardcoding it causes Bad Gateway.

---

## 2. What Enigma Pharma solves

### The pain
- Pharma sponsors and buyers struggle to find **GMP-certified CDMOs** for API, formulation, fill-finish, and biologics.
- RFQs live in email with NDAs attached — no structured bid workflow, no match scoring, no audit trail.
- CDMOs waste time on unqualified leads and cannot showcase GMP capabilities to the right buyers.

### Enigma Pharma’s answer
- **Pharma RFQ pool** with NDA/PDF uploads, service category & GMP filters, and AI-assisted CDMO matching.
- **Role-based access:** Pharma buyers publish projects free; CDMOs bid based on subscription tier.
- **Trust layer:** GMP certifications, verified badges (Pro+), NDA gating, in-platform chat & project status.
- **Same India-first INR pricing** as manufacturing Enigma; admin-controlled upgrades (no Razorpay).

---

## 3. User journeys

### A. Pharma buyer (free forever)
1. Register as **Buyer** (or Hybrid)
2. Verify email → **Start RFQ** → upload **NDA/CDA (PDF required)** + project specs
3. RFQ opens in the **project pool**
4. CDMOs submit bids → buyer reviews profiles & match scores
5. **Accept CDMO** → chat, production updates, rating

### B. CDMO / API manufacturer (subscription)
1. Register as **Manufacturer** — select service categories (API, formulation, biologics, etc.) and GMP certs
2. **Free plan:** browse pool **view-only** (no bids)
3. **Pricing** → request Standard / Pro / Enterprise
4. **Admin approves** → plan activates
5. Submit bids (20 / 40 / unlimited per year)
6. Win projects → **Accepted RFQs**

### C. Hybrid (buyer + CDMO)
- Buyer side: **always free** (publish unlimited pharma RFQs)
- CDMO side: same paid tiers
- **Cannot bid on own RFQs** — pool, search, and bid APIs exclude self-created projects

### D. Admin
- Login: `ADMIN_EMAIL` / `ADMIN_PASSWORD` from Railway
- **`/admin`** → Overview, Upgrade Requests, Manage Users

---

## 4. Pricing & plans

| Plan | Price (INR/yr) | RFQ bids | Key features |
|------|----------------|----------|--------------|
| **Buyer** | Free | N/A (publish unlimited RFQs) | Create RFQs, invite CDMOs, AI search, chat |
| **Free** | ₹0 | 0 (view only) | Anonymous CDMO profile, limited AI (2 results), pool browse |
| **Standard** | ₹3,42,000 | 20 / year | Full profile, capacity, docs, full AI, submit bids |
| **Pro** | ₹5,22,000 | 40 / year | Verified GMP badge, high search rank, document AI |
| **Enterprise** | ₹15,75,000 | Unlimited | #1 placement, corporate RFQs, concierge support |

Upgrades: user requests on `/pricing` → admin approves in **Admin → Upgrade Requests**.

---

## 5. Pharma-specific RFQ rules

| Rule | Detail |
|------|--------|
| NDA required | Every published RFQ must include an NDA/CDA PDF |
| Service category | API, formulation, biologics, fill-finish, etc. |
| Documents | PDF specs (product spec, process description, analytical methods) |
| No CAD/STL | Manufacturing CAD upload is disabled; PDF-first workflow |
| Self-bid blocked | Hybrid users cannot bid on, invite themselves to, or accept their own RFQ |
| Visibility | Free CDMOs see masked buyer + truncated preview; paid see more; full after selection |

---

## 6. Comparison with alternatives

| Capability | Enigma Pharma | IndiaMART / listings | Traditional brokers | Email + Excel |
|------------|---------------|----------------------|---------------------|---------------|
| Pharma RFQ end-to-end | ✅ | ❌ | ⚠️ manual | ❌ |
| NDA/PDF workflow | ✅ | ❌ | ⚠️ | ❌ |
| GMP / service category matching | ✅ | ❌ | ⚠️ | ❌ |
| CDMO match scoring | ✅ | ❌ | ❌ | ❌ |
| India INR annual plans | ✅ | ⚠️ ads | ❌ | — |
| AI search (natural language) | ✅ | ❌ | ❌ | ❌ |
| Admin-approved B2B upgrades | ✅ | N/A | N/A | N/A |

**Positioning:** *“RFQ workflow for Indian pharma CDMO sourcing — not a parts catalog, not a $100k ERP.”*

---

## 7. Admin operations

| Item | Value |
|------|--------|
| URL | https://enigmapharma.equvinoxis.com/admin |
| Login | https://enigmapharma.equvinoxis.com/login |
| Credentials | Railway: `ADMIN_EMAIL`, `ADMIN_PASSWORD` |

### Common tasks

| Task | Steps |
|------|--------|
| Onboard paid CDMO | Users → set plan Standard/Pro/Enterprise → Activate |
| Fix “can’t submit bids” | Check plan ≠ FREE; subscription ACTIVE; annual bid limit |
| Reset admin password | Update `ADMIN_PASSWORD` in Railway → redeploy → login once |
| Corporate RFQ access | Enterprise plan only |
| API 502 / CORS | Remove hardcoded `PORT` from Railway backend; redeploy |

### Admin API endpoints
```
GET  /api/admin/stats
GET  /api/admin/users
GET  /api/admin/upgrade-requests?status=PENDING
PUT  /api/admin/upgrade-requests/:id/approve
PUT  /api/admin/upgrade-requests/:id/reject
PUT  /api/admin/users/:id/upgrade
```

---

## 8. Onboarding checklist

### Before inviting users
- [ ] Railway backend root: `project/server`, start: `node server.js`
- [ ] Railway frontend root: `project/ecotrade`, `VITE_BACKEND_URL=https://api.enigmapharma.equvinoxis.com`
- [ ] **No `PORT` variable** on backend Railway service
- [ ] `MONGODB_URI` ends with `/enigmapharma`
- [ ] `S3_FOLDER_PREFIX=enigmapharma`
- [ ] `CORS_ORIGINS` without quotes
- [ ] Test `/api/health` → OK
- [ ] Test registration → email → verify → login

### Per new CDMO
1. `https://enigmapharma.equvinoxis.com/register?role=MANUFACTURER`
2. Complete service categories + GMP certifications
3. Admin approve plan if paid
4. Confirm **Submit bid** works (not view-only)

### Per new buyer
1. `https://enigmapharma.equvinoxis.com/register?role=BUYER`
2. Walk through **Start RFQ** + NDA PDF upload

---

## 9. Environment variables (reference)

Set in **Railway → backend service**. Use your secure vault — **never commit to Git**.

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas, database name `enigmapharma` |
| `JWT_SECRET` / `JWT_EXPIRE` | Auth tokens |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin bootstrap |
| `FRONTEND_URL` / `CLIENT_URL` | Email links |
| `API_URL` | File URLs |
| `CORS_ORIGINS` | Comma-separated, **no quotes** |
| `AWS_*` / `S3_FOLDER_PREFIX=enigmapharma` | Uploads |
| `GMAIL_*` | Transactional email |
| `APP_NAME` | `Enigma Pharma` |
| `VERTICAL` | `pharma` |

**Do not set `PORT` on Railway.**

**Frontend service:**
```
VITE_BACKEND_URL=https://api.enigmapharma.equvinoxis.com
VITE_APP_NAME=Enigma Pharma
```

---

## 10. Security reminders

- Rotate AWS, Gmail, JWT, and admin secrets if ever pasted in chat or docs.
- Never push `.env` or live credentials to GitHub.
- MongoDB Atlas: restrict IP to Railway egress where possible.

---

## 11. Support & repos

- **Platform support:** info@equvinoxis.com
- **GitHub:** https://github.com/equvinoxisteam/enigma_pharma
- **Manufacturing Enigma:** https://github.com/equvinoxisteam/enigma

---

*Last updated: June 2026 — CORS hardening, self-bid prevention, pharma AI search, PORT deploy fix documented.*
