# 파일 경로: backend/app/router/ingredients.py

import shutil
import os
from typing import List
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from app.services.yolo_service import detect_ingredient

# DB 및 모델 관련 임포트
from ..db import get_db
from ..models import FridgeIngredient, User
from ..schemas import FridgeIngredientCreate, FridgeIngredientOut
from .auth import get_current_user

# ✅ YOLO 서비스 임포트
from app.services.yolo_service import detect_ingredient

router = APIRouter(
    prefix="/api/ingredients",
    tags=["ingredients"]
)

# ---------------------------------------------------------
# 1. 재료 목록 조회
# ---------------------------------------------------------
@router.get("", response_model=List[FridgeIngredientOut])
def read_ingredients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ingredients = db.query(FridgeIngredient).filter(FridgeIngredient.user_id == current_user.id).all()
    return ingredients


# ---------------------------------------------------------
# 2. 재료 직접 추가
# ---------------------------------------------------------
@router.post("", response_model=FridgeIngredientOut, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    item: FridgeIngredientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_item = FridgeIngredient(
        name=item.name,
        category=item.category,
        quantity=item.quantity,
        unit=item.unit,
        expected_expiry=item.expected_expiry,
        user_id=current_user.id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


# ---------------------------------------------------------
# 3. AI 이미지 분석 (YOLO 연동)
# ---------------------------------------------------------
@router.post("/analyze")
async def analyze_ingredient_image(file: UploadFile = File(...)):
    """
    업로드된 사진을 잠시 저장한 뒤,
    YOLO 서비스로 분석하고 결과를 반환한다.
    """

    # 1) 파일명 충돌 방지용 timestamp 붙이기
    timestamp = int(datetime.utcnow().timestamp())
    temp_filename = f"temp_{timestamp}_{file.filename}"
    temp_path = UPLOAD_DIR / temp_filename

    try:
        # 2) 업로드된 파일을 uploads 폴더에 저장
        with temp_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3) YOLO 분석
        label, confidence = detect_ingredient(str(temp_path))

        # 4) 영어 -> 한글 이름 매핑 (원하면 계속 추가)
        name_map = {
            "onion": "양파",
            "apple": "사과",
            "carrot": "당근",
            "egg": "계란",
            "milk": "우유",
        }
        korean_name = name_map.get(label, label)

        # 5) 카테고리도 간단 매핑 (원하면 분리해서 더 깔끔하게 가능)
        if label in ["onion", "carrot"]:
            category = "채소"
        elif label in ["apple"]:
            category = "과일"
        elif label in ["egg", "milk"]:
            category = "유제품/단백질"
        else:
            category = "기타"

        print(f"✅ [분석완료] {label} ({confidence*100:.1f}%) -> {korean_name}")

        return {
            "name": korean_name,
            "category": category,
            "quantity": 1,
            "unit": "개",
            "confidence": round(confidence, 4),  # 프론트에서 신뢰도 표시할 때 유용
        }

    except Exception as e:
        print(f"❌ [분석실패] 에러: {e}")
        raise HTTPException(status_code=500, detail="이미지 분석 실패")

    finally:
        # 6) 임시 파일 삭제
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception as e:
                print(f"⚠️ [파일삭제실패] {temp_path} / 에러: {e}")

# ---------------------------------------------------------
# 4. 재료 삭제
# ---------------------------------------------------------
@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(FridgeIngredient).filter(
        FridgeIngredient.id == ingredient_id,
        FridgeIngredient.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="재료를 찾을 수 없습니다.")

    db.delete(item)
    db.commit()
    return None