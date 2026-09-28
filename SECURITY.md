# MOSAIC Enterprise Security & Secrets Policy
**Problem Statement SIH26081 — MoES / NCMRWF**

---

## 1. Secrets & Credential Management
- **Zero Frontend Secrets:** No API keys, MOSDAC passwords, database URIs, or private tokens are packaged into client-side JavaScript bundles.
- **Server-Side Environment Variables:** All upstream provider credentials reside exclusively in `.env` read by the backend:
  - `DATABASE_URL`: PostgreSQL connection string.
  - `MOSDAC_USERNAME` & `MOSDAC_PASSWORD`: Server-side SAC-ISRO authentication.
  - `ECMWF_API_KEY` & `ECMWF_API_EMAIL`: ECMWF dissemination license tokens.
  - `IMD_API_KEY`: IMD operational gateway token.
- **Client Fallback:** If upstream credentials are not configured, the frontend gracefully renders honest `AUTHORIZATION REQUIRED` states with guidance for system administrators.

---

## 2. API Gateway Protection & Network Security
- **Cross-Origin Resource Sharing (CORS):** Strict CORS policies configured in FastAPI `CORSMiddleware`.
- **Input Sanitization:** Fast validation via Pydantic v2 schemas; geographic queries validated within legitimate latitudes $[6^\circ\text{N}, 38^\circ\text{N}]$ and longitudes $[68^\circ\text{E}, 98^\circ\text{E}]$.
- **Rate Limiting & DDoS Prevention:** In-memory caching (15-min TTL for spatial grids, 5-min TTL for forecast points) minimizes repetitive computation and protects upstream meteorological APIs from rate exhaustion.
- **Secure Transport:** All production traffic enforced over HTTPS/TLS 1.3.
