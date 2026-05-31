from fastapi import FastAPI
from app.routers import recommend
import os

app = FastAPI(title="Mo:lib AI Server")

app.include_router(recommend.router)

if os.getenv("ENV") != "production":
    from app.routers import test
    app.include_router(test.router)