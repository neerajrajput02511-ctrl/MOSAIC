# MOSAIC Production Deployment Guide
**Problem Statement SIH26081 — MoES / NCMRWF**

---

## 1. Multi-Tier Production Architecture

```
[Users / Forecasters / SIH Judges]
                |
                v
[Vercel Global Edge CDN] ------------> Next.js 16 App (Static UI + SSR Client)
                |
                v (HTTPS API Calls)
[Render / AWS / NIC Cloud] ----------> FastAPI Python Backend (Uvicorn Workers)
                |
                v (Pooled SSL Connection)
[Supabase / PostgreSQL + PostGIS] ----> Persistent Relational Store (22 Schemas)
```

---

## 2. Step-by-Step Deployment

### 2.1 Backend Deployment (Render / Docker / Linux VM)
1. **Clone repository:**
   ```bash
   git clone https://github.com/neerajrajput02511-ctrl/MOSAIC.git
   cd MOSAIC
   ```
2. **Configure Environment:**
   Copy `.env.example` to `.env` and configure:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   APP_ENV="production"
   DEBUG=false
   MOSDAC_USERNAME="<your_mosdac_email>"
   MOSDAC_PASSWORD="<your_mosdac_password>"
   ```
3. **Run with Uvicorn or Docker:**
   ```bash
   pip install -r backend/requirements.txt
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```
   Or via Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

### 2.2 Frontend Deployment (Vercel)
1. **Import Repository to Vercel:**
   - Root directory: `frontend`
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Output directory: `.next`
2. **Environment Variables on Vercel:**
   - `NEXT_PUBLIC_API_URL`: Your backend URL (e.g. `https://mosaic-mgbt.onrender.com/api/v1` or custom domain).
3. **Deploy:**
   Vercel automatically compiles via Turbopack and deploys to the global edge network.

---

## 3. Local Development Mode

To run both services locally on Windows/Linux:

**Terminal 1 (Backend):**
```powershell
python -m uvicorn backend.app.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```
Open `http://localhost:3000` in your browser.
