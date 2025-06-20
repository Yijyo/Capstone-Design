from fastapi import APIRouter, UploadFile, File
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/video")
async def upload_video(video: UploadFile = File(...)):
    filename = f"{uuid.uuid4().hex}_{video.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(await video.read())

    return {
        "filename": filename,
        "video_path": filepath
    }
