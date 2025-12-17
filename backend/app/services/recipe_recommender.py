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

class RecipeRecommender:
    def __init__(self, csv_name: str = "recipes_preprocessed.csv"):
        self.csv_path = DATA_DIR / csv_name
        self.df: pd.DataFrame | None = None

    def load(self) -> None:
        df = pd.read_csv(self.csv_path)

        # 재료 컬럼 파싱
        df["재료_list"] = df["재료"].apply(parse_list_str)
        df["재료_norm"] = df["재료_list"].apply(lambda lst: [norm(x) for x in lst])

        # 조회수 "173,846" -> 173846 (선택: 추천 정렬에 활용 가능)
        if "조회수" in df.columns:
            df["조회수_int"] = (
                df["조회수"].astype(str).str.replace(",", "", regex=False)
                .str.extract(r"(\d+)")[0]
                .fillna("0").astype(int)
            )

        self.df = df

    def recommend_by_ingredients(self, ingredients: List[str], top_k: int = 10) -> List[Dict[str, Any]]:
        if self.df is None:
            self.load()
        assert self.df is not None

        user = [norm(x) for x in ingredients if str(x).strip()]
        user_set = set(user)

        scored = []
        for _, row in self.df.iterrows():
            ing_set = set(row["재료_norm"])
            matched = len(user_set & ing_set)
            if matched == 0:
                continue
            missing = len(user_set - ing_set)

            # MVP 점수식: 많이 맞추고(+) 없는 재료는 약하게 패널티(-)
            score = matched - 0.3 * missing

            scored.append((score, matched, -missing, row))

        scored.sort(key=lambda x: (x[0], x[1], x[2]), reverse=True)

        results = []
        for score, matched, _, row in scored[:top_k]:
            results.append({
                "recipe_id": int(row["index"]),
                "title": row.get("제목"),
                "url": row.get("url"),
                "chef": row.get("셰프"),
                "matched_count": int(matched),
                "missing_count": int(len(user_set - set(row["재료_norm"]))),
                "matched_ingredients": sorted(list(user_set & set(row["재료_norm"]))),
                "score": float(score),
            })
        return results
