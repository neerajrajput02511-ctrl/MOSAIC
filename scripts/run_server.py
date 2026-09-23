import os
import sys
import uvicorn

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.config import settings

if __name__ == "__main__":
    print(f"Starting {settings.PROJECT_NAME} backend service on http://localhost:8000")
    print(f"API Documentation available at: http://localhost:8000/docs")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)
