from .base import BaseAccidentAnalyzer
import cv2
import numpy as np
from norfair import Detection, Tracker
import os
from math import hypot

class VehicleToPedestrianAnalyzer(BaseAccidentAnalyzer):
    def __init__(self, video_path: str, accident_type: str, road_context: str):
        super().__init__(video_path)
        self.accident_type = accident_type  # e.g., "차대보행자"
        self.road_context = road_context    # e.g., "보도 없음", "보도 있음", "고속도로", "보호구역"
        self.tracker = Tracker(
            distance_function="euclidean",
            distance_threshold=30
        )

    def analyze(self):
        results = {}

        results["보행자 신호 위반"] = self.detect_pedestrian_signal_violation()
        results["무단횡단 여부"] = self.detect_crosswalk_violation()
        results["보호 의무 위반"] = self.detect_pedestrian_protection_duty()
        results["서행 여부"] = self.detect_vehicle_slow_duty()

        if self.road_context in ["야간", "시야장애"]:
            results["야간/시야장애 조건"] = self.detect_low_visibility_condition()

        if self.road_context == "보도 없음":
            results["보도/차도 구분 없음"] = "차량 서행/보행자 주의 의무 강화"

        if self.road_context == "고속도로":
            results["고속도로 보행자 과실"] = "보행자 과실 높음 (최대 80%)"

        if self.road_context == "보호구역":
            results["보호구역 내 사고"] = self.detect_school_zone_condition()

        return results

    def detect_pedestrian_signal_violation(self):
        """
        교차로에서 보행자 신호 위반 판단:
            - 신호등 색상 분석 (적색인지)
            - 보행자 진입 시점 분석
        """
        print("[보행자 신호위반 판단]")

        red_light_detected = False
        pedestrian_entered = False
        red_light_frame_idx = None
        enter_frame_index = None

        for idx, frame in enumerate(self.frames):
            results = self.model.predict(frame, verbose=False)[0]

            for box in results.boxes:
                cls = int(box.cls[0])
                label = self.model.names[cls]

                if label == "traffic light":
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    light_region = frame[y1:y2, x1:x2]
                    hsv = cv2.cvtColor(light_region, cv2.COLOR_BGR2HSV)

                    lower_red1 = np.array([0, 70, 50])
                    upper_red1 = np.array([10, 255, 255])
                    lower_red2 = np.array([160, 70, 50])
                    upper_red2 = np.array([180, 255, 255])

                    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
                    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
                    red_mask = mask1 | mask2

                    red_ratio = np.sum(red_mask) / red_mask.size
                    if red_ratio > 0.2:
                        red_light_detected = True
                        red_light_frame_idx = idx
                
                for box in results.boxes:
                    cls = int(box.cls[0])
                    if self.model.names[cls] == "person":
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        if y2 > frame.shape[0] * 0.8:
                            pedestrian_entered = True
                            enter_frame_index = idx

                
                if red_light_detected and pedestrian_entered:
                    break

            if red_light_detected and pedestrian_entered and enter_frame_index >= red_light_frame_idx:
                return True
            else:
                return False

    def detect_crosswalk_violation(self):
        """
        무단 횡단 여부 판단
            - 횡단보도 영역 외에서 보행자가 도로를 진입했는지 확인
            - 횡단보도 영역 내에서 적색 신호에 진입
        """

        print("[무단횡단 판단]")

        crosswalk_bboxes = []
        red_light_detected = False
        red_light_frame_idx = None
        violation_detected = False
        pedestrian_signal_detected = False

        for idx, frame in enumerate(self.frames):
            results = self.model.predict(frame, verbose=False)[0]

            current_crosswalks = []
            pedestrians = []

            for box in results.boxes:
                cls = int(box.cls[0])
                label = self.model.names[cls]

                if label == "traffic light":
                    pedestrian_signal_detected = True
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    light_region = frame[y1:y2, x1:x2]
                    hsv = cv2.cvtColor(light_region, cv2.COLOR_BGR2HSV)

                    lower_red1 = np.array([0, 70, 50])
                    upper_red1 = np.array([10, 255, 255])
                    lower_red2 = np.array([160, 70, 50])
                    upper_red2 = np.array([180, 255, 255])

                    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
                    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
                    red_mask = mask1 | mask2

                    red_ratio = np.sum(red_mask) / red_mask.size
                    if red_ratio > 0.2:
                        red_light_detected = True
                        red_light_frame_index = idx
                
                elif label == "crosswalk":
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    current_crosswalks.append((x1, y1, x2, y2))

                elif label == "person":
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    pedestrians.append((cx, cy))

            if current_crosswalks:
                crosswalk_bboxes = current_crosswalks

            for (cx, cy) in pedestrians:
                inside_crosswalk = False
                for (x1, y1, x2, y2) in crosswalk_bboxes:
                    if x1 <= cx <= x2 and y1 <= cy <= y2:
                        inside_crosswalk = True
                        break

                if not inside_crosswalk and cy > frame.shape[0] * 0.6:
                    violation_detected = True
                    break

                if inside_crosswalk and red_light_detected and idx >= red_light_frame_idx:
                    violation_detected = True
                    break

            if violation_detected:
                break

        if not pedestrian_signal_detected:
            return "판단불가: 보행자 신호등 미탐지, 사용자 확인 필요"

        return violation_detected
    
    def detect_pedestrian_protection_duty(self, proximity_threshold=100, speed_threshold=10):
        """
        보행자 보호 의무 위반 판단:
            - 차량이 보행자 근처에서 감속/정지하지 않았으면 위반
        """

        print("[보호 의무 위반 판단]")

        prev_vehicle_center = None
        vehicle_speed_sum = 0
        speed_count = 0
        protection_violation = False

        for i in range(1, len(self.frames), 3):
            frame = self.frames[i]
            results = self.model.predict(frame, verbose=False)[0]

            vehicle_center = None
            pedestrians = []

            for box in results.boxes:
                cls = int(box.cls[0])
                label = self.model.names[cls]

                if label in ["car", "truck", "bus"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    vehicle_center = (cx, cy)

                elif label == "person":
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    pedestrians.append((cx, cy))

            if not vehicle_center or not pedestrians:
                continue

            if prev_vehicle_center:
                dx = vehicle_center[0] - prev_vehicle_center[0]
                dy = vehicle_center[1] - prev_vehicle_center[1]
                dist = hypot(dx, dy)
                vehicle_speed_sum += dist
                speed_count += 1

            prev_vehicle_center = vehicle_center

            for (px, py) in pedestrians:
                dist_to_pedestrian = hypot(vehicle_center[0] - px, vehicle_center[1] - py)
                if dist_to_pedestrian < proximity_threshold:
                    avg_speed = vehicle_speed_sum / speed_count if speed_count else 0
                    if avg_speed > speed_threshold:
                        protection_violation = True
                    break

            if protection_violation:
                break

        return protection_violation

    def detect_vehicle_slow_duty(self, speed_threshold=10.0):
        """
        차량 서행 의무 판단:
        - 도로 상황에 따라 서행 의무 적용 여부 결정
        - 평균 속도 추정 → 일정 이상이면 서행 위반
        """

        print("[서행 여부 판단]")

        # [1] 도로 상황에 따른 서행 의무 적용 여부 판단
        if self.road_context in ["고속도로", "간선도로"]:
            return "서행 의무 없음"

        # [2] 속도 추정 로직
        from math import hypot
        prev_center = None
        speed_sum = 0
        count = 0

        for i in range(1, len(self.frames), 3):
            results = self.model.predict(self.frames[i], verbose=False)[0]

            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck", "bus"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

                    if prev_center is not None:
                        dist = hypot(cx - prev_center[0], cy - prev_center[1])
                        speed_sum += dist
                        count += 1

                    prev_center = (cx, cy)
                    break

        avg_speed = speed_sum / count if count else 0
        return avg_speed > speed_threshold

    def detect_low_visibility_condition(self, brightness_threshold=50):
        """
        야간/시야장애 판단:
        - 프레임 밝기 평균이 기준 이하 → 야간 간주
        """
        print("[야간/시야장애 판단]")

        total_brightness = 0
        frame_count = 0

        for i in range(0, len(self.frames), 5):
            frame = self.frames[i]
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            avg_brightness = np.mean(gray)
            total_brightness += avg_brightness
            frame_count += 1

        avg_frame_brightness = total_brightness / frame_count if frame_count else 255

        return avg_frame_brightness < brightness_threshold

    def detect_school_zone_condition(self):
        """
        보호구역 내 사고 여부 판단:
        - 영상에서 보호구역 표지판 감지
        - 감지 불가 시 사용자 질문 유도
        """
        print("[보호구역 여부 판단]")

        for frame in self.frames:
            results = self.model.predict(frame, verbose=False)[0]

            for box in results.boxes:
                cls = int(box.cls[0])
                label = self.model.names[cls]

                if label in ["school zone", "children zone"]:
                    return True  # 보호구역 내 사고로 간주

        return "판단불가: 보호구역 표지판 미탐지, 사용자 확인 필요"
