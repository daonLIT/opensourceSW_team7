from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd
import ast
import re

DATA_DIR = Path("app/data")

def norm(s: str) -> str:
    s = str(s).strip().lower()
    s = re.sub(r"\s+", "", s)
    return s

def parse_list_str(x) -> List[str]:
    """ "['감자','양파']" 같은 문자열 list를 안전하게 list로 변환 """
    if pd.isna(x):
        return []
    if isinstance(x, list):
        return x
    try:
        v = ast.literal_eval(str(x))
        return v if isinstance(v, list) else []
    except Exception:
        return []
    
# ===== 동의어/표준화 사전 =====
# key(변형) -> value(표준)
SYNONYMS = {
    # 마늘/파 계열
    "다진마늘": "마늘",
    "다진마늘(또는간마늘)": "마늘",
    "간마늘": "마늘",
    "다진파": "파",
    "대파": "파",
    "쪽파": "파",

    # 간장 계열
    "진간장": "간장",
    "국간장": "간장",
    "양조간장": "간장",

    # 고춧가루 표기
    "고추가루": "고춧가루",

    # 소금/설탕 류 (원하면 확장)
    "천일염": "소금",
    "꽃소금": "소금",
    "흰설탕": "설탕",
    "황설탕": "설탕",

    # 소고기/돼지고기 류 (원하면 확장)
    "다진소고기": "소고기",
    "소고기다짐육": "소고기",
    "다진돼지고기": "돼지고기",
    "돼지고기다짐육": "돼지고기",
}

def canonicalize(token_norm: str) -> str:
    """정규화된 토큰을 표준 단어로 통일"""
    # 1) 사전에 정확히 있으면 치환
    if token_norm in SYNONYMS:
        return SYNONYMS[token_norm]

    # 2) 괄호/중량/단위 등이 섞인 케이스 간단 제거(필요시)
    return token_norm

class RecipeRecommender:
    def __init__(self, csv_name: str = "recipes_preprocessed.csv"):
        self.csv_path = DATA_DIR / csv_name
        self.df: pd.DataFrame | None = None

    def load(self) -> None:
        df = pd.read_csv(self.csv_path)

        # 재료 컬럼 파싱
        df["재료_list"] = df["재료"].apply(parse_list_str)
        df["재료_norm"] = df["재료_list"].apply(lambda lst: [norm(x) for x in lst])
        df["재료_canon"] = df["재료_norm"].apply(lambda lst: [canonicalize(x) for x in lst])
        df["재료_canon_set"] = df["재료_canon"].apply(lambda lst: set(lst))


        # 조회수 "173,846" -> 173846 (선택: 추천 정렬에 활용 가능)
        if "조회수" in df.columns:
            df["조회수_int"] = (
                df["조회수"].astype(str).str.replace(",", "", regex=False)
                .str.extract(r"(\d+)")[0]
                .fillna("0").astype(int)
            )
        else:
            df["조회수_int"] = 0

        self.df = df

    def recommend_by_ingredients(self, ingredients: List[str], top_k: int = 10) -> List[Dict[str, Any]]:
        if self.df is None:
            self.load()
        assert self.df is not None

        # 사용자 입력: norm -> canon
        user_pairs = []
        for raw in ingredients:
            if not str(raw).strip():
                continue
            n = norm(raw)
            c = canonicalize(n)
            user_pairs.append((str(raw).strip(), n, c))

        # 중복 제거(사용자 입력 기준)
        # 같은 표준(canon)이 여러 번 들어오면 1개만 평가
        seen_canon = set()
        user_unique = []
        for raw, n, c in user_pairs:
            if c in seen_canon:
                continue
            seen_canon.add(c)
            user_unique.append((raw, n, c))

        def best_match_score(user_canon: str, recipe_canon_set: set) -> float:
            """완전일치(1.0), 부분일치(0.6), 그 외 0"""
            if user_canon in recipe_canon_set:
                return 1.0

            # 부분(포함) 매칭: user_canon이 recipe 토큰에 포함되거나 그 반대
            for r in recipe_canon_set:
                if user_canon and r and (user_canon in r or r in user_canon):
                    return 0.6
            return 0.0

        scored = []
        for _, row in self.df.iterrows():
            recipe_set = row["재료_canon_set"]

            matched_inputs = []
            missing_inputs = []
            match_details = []

            total_match_score = 0.0
            for raw, _n, c in user_unique:
                s = best_match_score(c, recipe_set)
                if s > 0:
                    matched_inputs.append(raw)
                    total_match_score += s
                    match_details.append({"input": raw, "canon": c, "match_score": s})
                else:
                    missing_inputs.append(raw)

            if not matched_inputs:
                continue

            # 기본 점수: 매칭 점수 합 - (부족 재료 패널티)
            base_score = total_match_score - 0.3 * len(missing_inputs)

            # 조회수 tie-break (기존 로직 유지)
            views = int(row.get("조회수_int", 0))
            tie_break = min(views / 1_000_000, 0.2)
            score = base_score + tie_break

            scored.append((score, len(matched_inputs), -len(missing_inputs), views, row,
                        matched_inputs, missing_inputs, match_details))

        scored.sort(key=lambda x: (x[0], x[1], x[2], x[3]), reverse=True)

        results = []
        for score, matched_cnt, _, views, row, matched_inputs, missing_inputs, match_details in scored[:top_k]:
            results.append({
                "recipe_id": int(row["index"]),
                "title": row.get("제목"),
                "url": row.get("url"),
                "chef": row.get("셰프"),
                "views": views,

                # 사용자 입력 기준으로 보기 좋게 반환
                "matched_inputs": matched_inputs,
                "missing_inputs": missing_inputs,

                # 디버깅/설명용(원하면 RN에서 숨겨도 됨)
                "match_details": match_details,

                "matched_count": int(matched_cnt),
                "missing_count": int(len(missing_inputs)),
                "score": float(score),
            })
        return results


