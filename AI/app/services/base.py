import cv2
from ultralytics import YOLO

class BaseAccidentAnalyzer:
    def __init__(self, video_path: str):
        self.video_path = video_path
        self.frames = self.load_video_frames()
        self.model = self.load_yolo_model()

    def load_video_frames(self):
        import cv2
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            raise FileNotFoundError(f"[영상 열기 실패: {self.video_path}]")

        frames = []
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()

        if not frames:
            raise ValueError("[영상에서 프레임을 하나도 불러오지 못함]")

        return frames

    
    def load_yolo_model(self):
        """
        YOLOv8 모델 불러오기 - 절대 경로 기반으로 지정
        """
        import os
        base_dir = os.path.dirname(os.path.dirname(__file__))  # project_root/
        model_path = os.path.join(base_dir, "yolov8n.pt")
        print(f"[YOLO 모델 로딩 시도] {model_path}")

        try:
            return YOLO(model_path)
        except Exception as e:
            import traceback
            print("[YOLO 모델 로딩 실패]", str(e))
            traceback.print_exc()
            raise

    def analyze(self):
        """
        자식 클래스에서 구현해야 하는 메서드
        """
        print("[분석 시작]")
        raise NotImplementedError("analyze() must be embodied in subclass")