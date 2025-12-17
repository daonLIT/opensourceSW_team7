# backend/app/router/auth.py

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func  # ✅ 날짜 비교용 함수

from app.db import get_db
from app import models, schemas
from app.services.auth_service import hash_password, verify_password, get_current_user
from app.services.jwt_service import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    회원가입
    """
    existed = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = models.User(
        email=user_in.email,
        name=user_in.name,
        password_hash=hash_password(user_in.password),
        # 새로 가입하는 사람은 레벨 1, 포인트 0부터 시작
        level=1,
        points=0
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    로그인 → JWT 토큰 발급
    """
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password",
        )

    token = create_access_token(user.email)
    
    # 로그인 시점의 정보 반환 (스키마에 맞춰서 수동 생성)
    # DB에 없는 nextLevelPoints는 계산해서 넣어줌
    user_out = schemas.UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        level=user.level,
        points=user.points,
        nextLevelPoints=user.level * 100
    )

    return schemas.Token(
        access_token=token,
        user=user_out,
    )


@router.get("/me", response_model=schemas.UserOut)
def get_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    내 정보 조회 + 🔥 데일리 에코 포인트 심판 로직 포함
    """
    today = date.today()
    
    # 1. 오늘 출석체크(포인트 지급)를 아직 안 했다면?
    if current_user.last_daily_check != today:
        
        # 2. '어제' 날짜 구하기
        yesterday = today - timedelta(days=1)
        
        # 3. 어제 버린 음식(FoodWaste)이 있었는지 확인
        # (func.date를 써서 날짜만 비교)
        waste_count = db.query(models.FoodWaste).filter(
            models.FoodWaste.user_id == current_user.id,
            func.date(models.FoodWaste.discarded_at) == yesterday
        ).count()

        # 4. 심판 결과: 쓰레기가 하나도 없다면? -> 상점 부여!
        if waste_count == 0:
            print(f"🎉 {current_user.name}님! 어제 음식 쓰레기 0건! 포인트 +10 지급!")
            current_user.points += 10
        else:
            print(f"😢 {current_user.name}님... 어제 {waste_count}건의 쓰레기가 있었네요. 포인트 없음.")
        
        # 5. 레벨업 체크 (100점마다 레벨업)
        # 예: 100점 -> Lv2, 200점 -> Lv3
        new_level = (current_user.points // 100) + 1
        if new_level > current_user.level:
            current_user.level = new_level
            print(f"🆙 축하합니다! 레벨 업! Lv.{current_user.level}")

        # 6. "오늘 검사 끝!" 도장 찍기 (날짜 업데이트)
        current_user.last_daily_check = today
        db.commit()
        db.refresh(current_user)

    # 7. 다음 레벨까지 남은 포인트 계산 (UI 표시용)
    next_level_points = current_user.level * 100
    
    # 최종 응답 데이터 만들기
    return schemas.UserOut(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        level=current_user.level,
        points=current_user.points,
        nextLevelPoints=next_level_points
    )