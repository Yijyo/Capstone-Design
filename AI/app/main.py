from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analyze, generate, upload, recommend, chat

app = FastAPI()
# uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(analyze.router, prefix="/analyze", tags=["Analyze"])
app.include_router(generate.router, prefix="/generate", tags=["Generate"])
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommend"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])

@app.get("/")
def root():
    return {"message": "Traffic Accident Analysis API Running"}