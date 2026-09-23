import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from backend.app.core.config import settings
from backend.app.database.init_db import init_db
from backend.app.api.routes import router as api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_SUBTITLE,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend and dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database schemas and meteorological reference seeds...")
    init_db()
    logger.info("WEATHERFUSION AI backend initialized successfully.")

# Mount API routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api") # convenience alias

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "status": "OPERATIONAL",
        "documentation": "/docs",
        "timestamp_utc": datetime.datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
