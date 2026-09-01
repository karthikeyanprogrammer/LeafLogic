import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import init_db
from app.routes import plants, users

init_db()
upload_directory = Path(
    os.getenv("UPLOAD_DIR", "/tmp/uploads" if os.getenv("VERCEL") else "uploads")
)
upload_directory.mkdir(parents=True, exist_ok=True)

app = FastAPI()

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_URLS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=(
        r"https://.*\.vercel\.app"
        if os.getenv("ALLOW_VERCEL_PREVIEWS", "false").lower() == "true"
        else None
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=upload_directory), name="uploads")

app.include_router(users.router)
app.include_router(plants.router)


@app.get("/")
def root():
    return {"name": "LeafLogic API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}
