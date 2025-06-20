from .base import BaseAccidentAnalyzer
import cv2
import numpy as np
from norfair import Detection, Tracker
import os

class VehicleToVehicleAnalyzer(BaseAccidentAnalyzer):
    def __init__(self, video_path: str, accident_type: str, road_type: str):
        super().__init__(video_path)
        self.accident_type = accident_type
        self.road_type = road_type
        self.tracker = Tracker(
            distance_function="euclidean",
            distance_threshold=30
        )

    def analyze(self):
        results = {}

        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            print(f"[오류] 영상 열기 실패: {self.video_path}")
            return {"error": "영상 열기 실패"}


        if self.road_type == "교차로":
            results["신호위반"] = self.detect_signal_violation()
            results["선진입 여부"] = self.detect_prior_entry()
            results["회전 중 주의의무 위반"] = self.detect_turn_duty_violation()
            results["역주행 여부"] = self.detect_wrong_direction_driving()
            results["진로변경 위반"] = self.detect_illegal_lane_change()
            results["돌발운전 여부"] = self.detect_abrupt_maneuvering()

        elif self.road_type == "고속도로":
            results["안전거리 미확보"] = self.detect_tailgating()
            results["역주행 여부"] = self.detect_wrong_direction_driving()
            results["돌발운전 여부"] = self.detect_abrupt_maneuvering()
            results["진로변경 위반"] = self.detect_illegal_lane_change()

        elif self.road_type in ["일반도로", "대로", "소로"]:
            results["중앙선 침범"] = self.detect_center_line_violation()
            results["안전거리 미확보"] = self.detect_tailgating()
            results["진로변경 위반"] = self.detect_illegal_lane_change()
            results["돌발운전 여부"] = self.detect_abrupt_maneuvering()
            results["역주행 여부"] = self.detect_wrong_direction_driving()

        elif self.road_type in ["골목길", "주택가", "주차장"]:
            results["선진입 불분명"] = self.detect_unclear_lane_entry()
            results["안전거리 미확보"] = self.detect_tailgating()
            results["진로변경 위반"] = self.detect_illegal_lane_change()
            results["돌발운전 여부"] = self.detect_abrupt_maneuvering()

        else:
            results["오류"] = "알 수 없는 도로 유형"

        return results

    def draw_tracked_objects(frame, tracked_objects):
        for obj in tracked_objects:
            track_id = obj.id
            cx, cy = map(int, obj.estimate[0])
            cv2.circle(frame, (cx, cy), 8, (0, 255, 0), -1)
            cv2.putText(frame, f'ID: {track_id}', (cx + 10, cy - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        return frame

    def detect_signal_violation(self):
        """
        교차로에서 신호위반 여부 판단
        - 신호등 존재 여부 확인
        - 빨간불(Hue 기반 마스크) + 차량 진입 시점 비교
        - 신호등 없으면 서행 판단 또는 질문 필요로 처리
        """

        if self.road_type != "교차로":
            return "미적용: 해당 도로에서는 신호위반 판단 제외"

        print("[신호위반 여부 판단]")

        red_light_detected = False
        car_entered = False
        enter_frame_index = None    
        red_light_frame_index = None
        signal_detected = False

        for idx, frame in enumerate(self.frames):
            results = self.model.predict(frame, verbose=False)[0]

            for box in results.boxes:
                cls = int(box.cls[0])
                label = self.model.names[cls]

                if label == "traffic light":
                    signal_detected = True
                    x1, y1, x2, y2 = map(int, box.xyxy[0])

                    # 신호등 영역 자르기
                    light_region = frame[y1:y2, x1:x2]
                    hsv = cv2.cvtColor(light_region, cv2.COLOR_BGR2HSV)

                    # 빨간불 판별: HSV 마스크 처리
                    lower_red1 = np.array([0, 70, 50])
                    upper_red1 = np.array([10, 255, 255])
                    lower_red2 = np.array([160, 70, 50])
                    upper_red2 = np.array([180, 255, 255])

                    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
                    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
                    red_mask = mask1 | mask2

                    red_ratio = np.sum(red_mask) / red_mask.size
                    if red_ratio > 0.2:  # 픽셀 비율 기준
                        red_light_detected = True
                        red_light_frame_index = idx

            # 차량 진입 판단
            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck", "bus"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    if y2 > frame.shape[0] * 0.8:
                        car_entered = True
                        enter_frame_index = idx

            if red_light_detected and car_entered:
                break

        if signal_detected:
            if red_light_detected and car_entered and enter_frame_index >= red_light_frame_index:
                return True
            else:     
                return False
        else:
            # 신호등이 감지되지 않음 → fallback 처리
            result = self.detect_slow_driving_obligation()
            return f"신호등 없음, 서행 판단 기준: {result}"

    def detect_slow_driving_obligation(self, speed_threshold=10.0):
        """
        신호가 없는 구간에서 차량 속도가 일정 이상이면 '서행 불이행' 으로 판단
        속도 추정 방식: 프레임 간 차량 위치 변화 거리 / 시간
        """

        print("[서행 여부 판단]")

        from math import hypot
        prev_center = None
        speed_sum = 0
        count = 0

        for i in range(1, len(self.frames)):
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
    
    def detect_center_line_violation(self, angle_threshold=20):
        """
        중앙선 침범 여부 판단
        - 수평선(HoughLinesP) 기준으로 중앙선 추정
        - 차량 중심 y좌표가 그 아래로 침범하면 True
        """

        print("[중앙선 침범 여부 판단]")

        from math import atan2, degrees

        for frame in self.frames:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)

            lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=200, maxLineGap=10)
            if lines is None:
                continue

            height = frame.shape[0]
            center_line_y = height // 2
            detected_center_lines = []

            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = abs(degrees(atan2(y2 - y1, x2 - x1)))
                if angle < angle_threshold:  # 거의 수평선
                    y_mean = (y1 + y2) // 2
                    if y_mean > center_line_y:
                        detected_center_lines.append(y_mean)

            if not detected_center_lines:
                continue

            estimated_center_y = sum(detected_center_lines) // len(detected_center_lines)

            # 차량 위치 판단
            results = self.model.predict(frame, verbose=False)[0]
            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck", "bus"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2

                    if cy > estimated_center_y:
                        return True  # 중심이 중앙선 아래 → 침범

        return False  # 침범 아님 or 판단불가

    def detect_prior_entry(self):
        """
        Norfair 기반 차량 ID 추적으로 선진입 차량 판단
        - 각 차량의 진입선(y 기준) 통과 프레임 추적
        - 평균 y값 기준으로 본 차량 추정
        - 진입 순서 비교하여 True/False 반환
        """
        if self.road_type != "교차로":
            return "미적용: 교차로 외 도로에서는 선진입 판단 제외"

        print("[선진입 여부 판단]")

        entry_line_y = int(self.frames[0].shape[0] * 0.6)
        tracker = Tracker(distance_function="euclidean", distance_threshold=30)
        id_entry_frames = {}      # 차량 ID별 진입 프레임
        y_positions = {}          # 차량 ID별 y 좌표 궤적

        for frame_idx, frame in enumerate(self.frames):
            results = self.model.predict(frame, verbose=False)[0]

            detections = []
            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2
                    detections.append(Detection(points=np.array([[cx, cy]])))

            tracked_objects = tracker.update(detections=detections)

            for obj in tracked_objects:
                track_id = obj.id
                cy = int(obj.estimate[0][1])

                # 진입선 넘었으면 기록
                if cy > entry_line_y and track_id not in id_entry_frames:
                    id_entry_frames[track_id] = frame_idx

                # y 좌표 누적
                if track_id not in y_positions:
                    y_positions[track_id] = []
                y_positions[track_id].append(cy)

        if len(id_entry_frames) < 2 or len(y_positions) < 2:
            return "판단불가: 두 차량 궤적 또는 진입 정보 부족"

        # 진입 순서 정렬
        sorted_entries = sorted(id_entry_frames.items(), key=lambda x: x[1])
        first_id, _ = sorted_entries[0]
        second_id, _ = sorted_entries[1]

        # 본 차량 = 평균 y가 더 큰 차량 (하단에서 진입한 차량)
        avg_y = {tid: np.mean(y_list) for tid, y_list in y_positions.items()}
        my_id = max(avg_y, key=avg_y.get)  # y가 가장 큰 차량이 내 차량

        return first_id == my_id  # 내가 먼저 진입했으면 True
        
    def detect_wrong_direction_driving(self, angle_diff_threshold=120):
        """
        차량 궤적과 차선 방향의 평균 angle 차이가 크면 역주행 판단
            - 궤적: 프레임 간 중심점 이동 방향의 angle 평균
            - 차선: houghLinesP 기반 도로 각도 평균균
        """
        
        print("[역주행 여부 판단]")

        from math import atan2, degrees

        prev_center = None
        vehicle_angles = []

        for i in range(0, len(self.frames), 3):  # 프레임 샘플링
            frame = self.frames[i]
            results = self.model.predict(frame, verbose=False)[0]

            # 차량 중심점 추출
            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck", "bus"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

                    if prev_center:
                        dx = cx - prev_center[0]
                        dy = cy - prev_center[1]

                        if dx == 0 and dy == 0:
                            continue

                        angle = degrees(atan2(dy, dx))
                        vehicle_angles.append(angle)
                    prev_center = (cx, cy)
                    break

        # 차량 진행 평균 방향
        if not vehicle_angles:
            return "판단 불가: 차량궤적 부족"
        
        avg_vehicle_angle = sum(vehicle_angles) / len(vehicle_angles)

        # 차선 방향 검출
        frame = self.frames[len(self.frames) // 2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100, minLineLength=100, maxLineGap=10)

        lane_angles = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = degrees(atan2(y2 - y1, x2 - x1))
                if abs(angle) < 45:  # 수평에 가까운 차선만 고려
                    lane_angles.append(angle)

        if not lane_angles:
            return "판단불가: 차선 인식 실패"

        avg_lane_angle = sum(lane_angles) / len(lane_angles)

        # 두 방향 차이가 120도 이상이면 역주행 간주
        angle_diff = abs(avg_vehicle_angle - avg_lane_angle)
        angle_diff = min(angle_diff, 360 - angle_diff)

        return angle_diff > angle_diff_threshold

    def detect_tailgating(self, min_distance_threshold=50, min_close_frames=10, sample_rate=3):
        """
        안전거리 미확보 판단 (고속도로 등)
        - 차량 중심 간 거리 계산
        - 일정 거리 미만이 일정 프레임 이상 유지되면 True 반환
        """

        from math import hypot

        close_frame_count = 0

        for i in range(0, len(self.frames), sample_rate):
            frame = self.frames[i]
            results = self.model.predict(frame, verbose=False)[0]
            centers = []

            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck", "bus"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2
                    centers.append((cx, cy))

            if len(centers) < 2:
                continue

            # 가장 가까운 두 차량 거리 계산
            min_dist = float("inf")
            for i in range(len(centers)):
                for j in range(i + 1, len(centers)):
                    d = hypot(centers[i][0] - centers[j][0], centers[i][1] - centers[j][1])
                    if d < min_dist:
                        min_dist = d

            if min_dist < min_distance_threshold:
                close_frame_count += 1

        return close_frame_count >= min_close_frames

    def detect_turn_duty_violation(self, angle_threshold=40, proximity_threshold=100, min_turn_frames=3, close_count_required=3):
        """
        교차로에서 좌/우회전 시 주의의무 위반 판단
        - 연속적인 회전 궤적 발생 + 회전 중 특정 차량(ID)과 연속 근접 시 위반
        - 본 차량이 선진입일 경우, 회전 중 위반 판단에서 제외
        """

        if self.road_type != "교차로":
            return "미적용: 교차로 외 도로에서는 회전 주의의무 판단 제외"

        print("[회전 중 주의의무 위반 판단]")

        from math import atan2, degrees, hypot

        prev_center = None
        prev_angle = None
        turn_frame_count = 0
        close_counts = {}  # 차량 ID별 근접 카운트

        # optional: 선진입 여부 확인
        prior_entry_result = self.detect_prior_entry()
        if prior_entry_result == "판단불가" or prior_entry_result == "미적용":
            prior_entry_result = False  # 판단불가일 경우, 보수적으로 후진입 처리

        if prior_entry_result is True:
            return False  # 내가 선진입이면 회전 중 위반 책임 없음

        for i in range(1, len(self.frames), 3):
            frame = self.frames[i]
            results = self.model.predict(frame, verbose=False)[0]

            my_center = None
            other_centers = {}
            tracked_objects = self.tracker.update([])  # Norfair 추적기 유지용

            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

                    # 첫 번째 차량 = 본 차량
                    if my_center is None:
                        my_center = (cx, cy)
                    else:
                        # 차선 기준 거리상 가장 먼 2번째 차량들 추적용
                        other_centers[len(other_centers)] = (cx, cy)

            if prev_center and my_center:
                dx = my_center[0] - prev_center[0]
                dy = my_center[1] - prev_center[1]
                angle = degrees(atan2(dy, dx))

                if prev_angle is not None:
                    delta = abs(angle - prev_angle)
                    if delta > angle_threshold:
                        turn_frame_count += 1

                        # 근접 차량 추적 (프레임마다)
                        for track_id, (ox, oy) in other_centers.items():
                            dist = hypot(ox - my_center[0], oy - my_center[1])
                            if dist < proximity_threshold:
                                if track_id not in close_counts:
                                    close_counts[track_id] = 1
                                else:
                                    close_counts[track_id] += 1

                prev_angle = angle
            prev_center = my_center

        # 특정 차량과 3프레임 이상 근접 유지되었는지 확인
        for count in close_counts.values():
            if count >= close_count_required and turn_frame_count >= min_turn_frames:
                return True

        return False

    def detect_illegal_lane_change(self, dx_threshold=50, proximity_threshold=80, min_change_frames=3, min_close_frames=3):
        """
        교차로 내 진로변경 시 끼어들기 위반 판단
        - 본 차량이 일정 dx 이상 차선 변경
        - 그 상태에서 일정 프레임 이상 근접 차량이 존재할 경우 위반 간주
        """

        from math import hypot

        prev_cx = None
        lane_change_count = 0
        close_frame_count = 0

        for i in range(1, len(self.frames), 3):
            frame = self.frames[i]
            results = self.model.predict(frame, verbose=False)[0]

            my_center = None
            others = []

            # 차량 중심점 추출
            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2

                    if my_center is None:
                        my_center = (cx, cy)
                    else:
                        others.append((cx, cy))

            # 진로 변경 감지 (수평 방향 변화량)
            if prev_cx is not None and my_center:
                dx = abs(my_center[0] - prev_cx)
                if dx > dx_threshold:
                    lane_change_count += 1

                    # 근접 차량 존재 여부 체크
                    for ox, oy in others:
                        dist = hypot(ox - my_center[0], oy - my_center[1])
                        if dist < proximity_threshold:
                            close_frame_count += 1
                            break  # 프레임당 1건만 체크

            if my_center:
                prev_cx = my_center[0]

        return lane_change_count >= min_change_frames and close_frame_count >= min_close_frames

    def detect_merge_yield_violation(self, merge_distance_threshold=100, entry_lead_threshold=5):
        """
        합류도로에서 본선 차량에 양보하지 않고 먼저 진입했을 가능성 판단
        - 두 차량이 서로 가까워지고 있고
        - 진입 차량이 먼저 본선 위치에 진입하면 위반으로 간주
        """

        from math import hypot

        entry_frames = []
        min_distance_frames = 0

        for i in range(1, len(self.frames), 3):
            frame = self.frames[i]
            results = self.model.predict(frame, verbose=False)[0]

            centers = []

            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    centers.append((cx, cy))

            if len(centers) < 2:
                continue

            # 거리 측정
            dist = hypot(centers[0][0] - centers[1][0], centers[0][1] - centers[1][1])
            if dist < merge_distance_threshold:
                min_distance_frames += 1
                entry_frames.append(i)

        # 일정 프레임 이상 거리 가까웠고, 비교적 초기에 겹침 → 진입차가 양보 안했을 가능성
        if min_distance_frames >= entry_lead_threshold:
            return True
        return False

    def detect_unclear_lane_entry(self, dx_threshold=40, proximity_threshold=100, overlap_frame_min=5):
        """
        좁은 도로/골목길에서 선진입 불분명 판단
        - 2대 차량이 동시에 일정 dx로 움직이고, 가까운 거리 유지
        """

        from math import hypot

        prev_positions = []
        overlap_count = 0

        for i in range(1, len(self.frames), 3):
            frame = self.frames[i]
            results = self.model.predict(frame, verbose=False)[0]

            centers = []

            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    centers.append((cx, cy))

            if len(centers) != 2:
                continue  # 판단은 2대일 때만 수행

            if prev_positions:
                dx1 = abs(centers[0][0] - prev_positions[0][0])
                dx2 = abs(centers[1][0] - prev_positions[1][0])

                dist = hypot(centers[0][0] - centers[1][0], centers[0][1] - centers[1][1])

                # 동시에 비슷한 거리 이동 + 서로 가까움
                if dx1 > dx_threshold and dx2 > dx_threshold and dist < proximity_threshold:
                    overlap_count += 1

            prev_positions = centers

        return overlap_count >= overlap_frame_min

    def detect_abrupt_maneuvering(self, delta_threshold=50, count_threshold=3, min_frames_between=3):
        """
        돌발운전 판단 (급차선 변경, 급정지 등)
        - 중심 좌표 변화량이 일정 이상 → 급격한 조작으로 간주
        - 일정 프레임 간격마다 변화 확인
        - 일정 횟수 이상 발생 시 True 반환
        """

        from math import hypot

        prev_center = None
        abrupt_count = 0
        last_abrupt_frame = -min_frames_between  # 초기값: 충분히 이전

        for i in range(1, len(self.frames), 3):
            frame = self.frames[i]
            results = self.model.predict(frame, verbose=False)[0]

            for box in results.boxes:
                cls = int(box.cls[0])
                if self.model.names[cls] in ["car", "truck"]:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

                    if prev_center is not None:
                        dist = hypot(cx - prev_center[0], cy - prev_center[1])

                        # 급격한 변화가 최소 프레임 간격 이상 떨어졌을 경우에만 카운트
                        if dist > delta_threshold and (i - last_abrupt_frame) >= min_frames_between:
                            abrupt_count += 1
                            last_abrupt_frame = i

                    prev_center = (cx, cy)
                    break  # 차량 1대만 추적

        return abrupt_count >= count_threshold
