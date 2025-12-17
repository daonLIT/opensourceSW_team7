# app/services/yolo_service.py
from typing import Tuple, Optional
import os

# ✅ Ultralytics YOLOv8
from ultralytics import YOLO

"""
YOLO 서비스 (YOLOv8 기준)

- detect_ingredient(image_path) : 이미지 파일 경로를 받아서
  (가장 유력한 식재료 라벨, confidence) 를 반환한다.

- 모델은 서버 실행 중에 1번만 로딩되게 만들어서
  요청이 여러 번 와도 느려지지 않게 한다.
"""

# ---------------------------------------------------------
# 1) 모델 파일 경로 설정
# ---------------------------------------------------------
# 기본값은 yolov8n.pt (Ultralytics가 자동 다운로드 가능)
# 나중에 커스텀 모델을 쓰고 싶으면 환경변수로 바꿔주면 됨.
# 예) YOLO_MODEL_PATH="weights/my_food.pt"
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")

# ---------------------------------------------------------
# 2) 모델을 한 번만 로딩하기 위한 전역 변수
# ---------------------------------------------------------
_model: Optional[YOLO] = None


def _get_model() -> YOLO:
    """
    모델을 최초 1번만 로딩하고, 이후에는 같은 모델을 재사용한다.
    """
    global _model
    if _model is None:
        print(f"✅ [YOLO] 모델 로딩 시작: {YOLO_MODEL_PATH}")
        _model = YOLO(YOLO_MODEL_PATH)
        print("✅ [YOLO] 모델 로딩 완료")
    return _model


def detect_ingredient(image_path: str) -> Tuple[str, float]:
    """
    이미지 경로를 받아서 (식재료명, confidence)를 반환한다.
    예) ("onion", 0.92)

    주의:
    - yolov8 기본 모델은 COCO 객체용이라 'onion' 같은 식재료가 정확히 안 나올 수 있음.
    - 나중에 식재료 커스텀 데이터셋으로 학습한 .pt로 바꾸면 훨씬 잘 됨.
    """

    # 1) 모델 불러오기
    model = _get_model()

    # 2) YOLO 추론 실행
    # verbose=False: 로그 너무 많이 뜨는 것 방지
    results = model.predict(source=image_path, verbose=False)

    # 3) 결과가 비었는지 확인
    if not results or len(results) == 0:
        print("⚠️ [YOLO] 결과가 없습니다. (아무것도 감지 못함)")
        return "unknown", 0.0

    r0 = results[0]

    # boxes가 없으면 감지 못한 것
    if r0.boxes is None or len(r0.boxes) == 0:
        print("⚠️ [YOLO] 박스가 없습니다. (감지 실패)")
        return "unknown", 0.0

    # 4) 가장 confidence가 높은 박스 1개 선택
    # r0.boxes.conf: 각 박스 confidence 배열
    # r0.boxes.cls : 각 박스 class id 배열
    conf_list = r0.boxes.conf.tolist()
    cls_list = r0.boxes.cls.tolist()

    best_idx = int(max(range(len(conf_list)), key=lambda i: conf_list[i]))
    best_conf = float(conf_list[best_idx])
    best_cls_id = int(cls_list[best_idx])

    # 5) class id -> 라벨명 변환
    # model.names: {id: "person", ...} 형태
    label = model.names.get(best_cls_id, "unknown")

    print(f"🤖 [YOLO] 감지 결과: {label} ({best_conf * 100:.1f}%)")
    return label, best_conf
