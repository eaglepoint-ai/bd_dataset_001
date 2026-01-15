from fastapi import FastAPI
from app.api.routes.todos import router as todos_router

app = FastAPI(
    title="FastAPI Todo API",
    version="1.0.0",
    description="High-performance in-memory Todo API with CRUD, ready to migrate to SQLAlchemy later.",
)

# Register routers
app.include_router(todos_router)


# Optional health endpoint
@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}
