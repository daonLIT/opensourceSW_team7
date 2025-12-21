# 🧊 냉장고를 지켜줘 (Save My Fridge)

1인 가구의 식재료 낭비를 줄이기 위한 **스마트 냉장고 관리 서비스**입니다.  
본 프로젝트는 **FastAPI 백엔드 + Expo(React Native) 프론트엔드** 구조로 구성되어 있으며,  
식재료 관리, AI 인식, 레시피 추천, 음식물 쓰레기 분석 기능을 제공합니다.

---
## 역할 분담

- 최다온: 백엔드 전체 구조, 코어기능
- 유용우: 음식정보 csv파일 만들기, 쓰레기/플라스틱 분리배출 가이드
- 김영우: 소비기한 알리미, 식재료 보관 방법 TIP
- 김재민: 레시피추천, 칼로리 & 영양 정보

---

## 🏗 시스템 아키텍처

- **Backend**: FastAPI (API 서버, AI 처리, DB 관리)
- **Frontend**: Expo + React Native (모바일 / 웹 UI)
- **AI**: YOLOv8, Gemini API
- **DB**: SQLite (개발 환경)

---

## ✨ 주요 기능

### 🥬 냉장고 재료 관리
- 재료 목록 조회 / 추가 / 삭제
- 사용자별 냉장고 재료 DB 관리

### 📷 AI 이미지 인식
- 재료 사진 촬영 또는 업로드
- YOLOv8 기반 식재료 자동 인식
- 인식 결과를 재료 입력 화면에 자동 반영

### 🍳 레시피 추천
- 냉장고 보유 재료 기반 추천
- CSV 기반 클러스터링 추천 로직 사용
- 부족한 재료 표시

### ♻️ 음식물 쓰레기 관리
- 버려진 식재료, 양, 사유 기록
- 날짜순 조회

### 🗑 분리배출 / 음식물 쓰레기 Q&A
- Gemini 기반 자연어 질문 응답
- 공식 문서 기반 분리배출 안내 제공

---

## 🧱 기술 스택

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- YOLOv8 (Ultralytics)
- Gemini API (google-generativeai)

### Frontend
- Expo
- React Native
- TypeScript
- Expo Router
- Fetch API

---

## 📁 프로젝트 구조

```bash
backend/
 ├─ app/
 │   ├─ main.py
 │   ├─ db.py
 │   ├─ models.py
 │   ├─ schemas.py
 │   ├─ router/
 │   │   ├─ auth.py
 │   │   ├─ ingredients.py
 │   │   ├─ recipes.py
 │   │   ├─ recipe_recommend.py
 │   │   └─ waste.py
 │   ├─ services/
 │   │   ├─ yolo_service.py
 │   │   ├─ recipe_recommender.py
 │   │   ├─ recipe_ai_service.py
 │   │   └─ waste_ai_service.py
 │   ├─ data/
 │   │   ├─ recipe_main_clustering.csv
 │   │   └─ waste_knowledge.json
 │   └─ vector_store.py
 ├─ fridge.db
 ├─ yolov8n.pt
 ├─ requirements.txt
 └─ .env

frontend/
 ├─ app/
 ├─ assets/
 ├─ components/
 ├─ constants/
 ├─ hooks/
 ├─ scripts/
 ├─ src/
 ├─ util/
 ├─ app.json
 ├─ package.json
 └─ tsconfig.json
```

---

## 🚀 실행 방법

### Backend 실행

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

`.env` 파일 생성 (backend 경로):

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

서버 실행:

```bash
uvicorn app.main:app --reload
```

---

### Frontend 실행

```bash
cd frontend
npm install
npx expo start
```

- Expo Go 앱 또는 웹 브라우저에서 실행 가능

---

## ⚠️ 프론트엔드 API 주소 설정 (중요)

프론트엔드는 백엔드와 통신하기 위해  
`constants/api.ts` 파일에 정의된 `API_BASE_URL`을 사용합니다.

현재 기본값은 아래와 같이 placeholder 상태입니다.

```ts
export const API_BASE_URL = "http://yourip:8000";
```

### 🔧 반드시 본인 환경에 맞게 수정해야 합니다

백엔드를 실행하는 **PC의 IP 주소**로 `yourip` 부분을 변경해야 합니다.

#### 예시

- 같은 Wi-Fi의 다른 기기(휴대폰, Expo Go)에서 접속할 경우:
```ts
export const API_BASE_URL = "http://192.168.0.12:8000";
```

> IP 주소는 `ipconfig`(Windows) 또는 `ifconfig` / `ip a`(Mac/Linux) 명령어로 확인할 수 있습니다.

### 🚨 설정하지 않으면 발생하는 문제
- 프론트 화면은 정상 실행되지만
- API 요청이 실패하여 데이터가 표시되지 않습니다.

프론트 실행 전 반드시 `API_BASE_URL` 설정을 확인하세요.

---

## 🔌 프론트 ↔ 백엔드 연동 흐름

1. 프론트엔드에서 재료 사진 촬영
2. `/api/ingredients/analyze` 호출 → YOLO 분석
3. 분석 결과를 재료 추가 화면에 자동 반영
4. `/api/recommend/recipes`로 레시피 추천 요청
5. `/api/waste/qa`로 분리배출 질문 처리

---

## 📝 참고 사항
- 개발 환경 기준 CORS 허용
- Gemini API 키가 없으면 AI 기능 제한

---

## 라이선스
본 프로젝트는 MIT License를 따르며, 자유로운 사용, 수정, 배포가 가능합니다.
단, 프로젝트에 포함된 외부 라이브러리는 각자의 라이선스를 따릅니다.

본 프로젝트는 YOLOv8(AGPL-3.0) 및 Google Gemini API(독점 라이선스)와 같은
제3자 구성 요소를 사용하며, 해당 구성 요소들은 각각의 라이선스를 따르며,
본 프로젝트에서는 학습 및 연구 목적의 프로토타입 단계에서만 사용되었습니다.
