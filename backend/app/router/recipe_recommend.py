from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.recipe_recommender import RecipeRecommender

router = APIRouter(prefix="/api/recommend", tags=["recommend"])

recommender = RecipeRecommender(csv_name="recipe_main_clustering.csv")

class RecommendReq(BaseModel):
    ingredients: List[str]
    top_k: int = 10

@router.post("/recipes")
def recommend_recipes(req: RecommendReq):
    return {
        "query": req.ingredients,
        "top_k": req.top_k,
        "results": recommender.recommend_by_ingredients(req.ingredients, req.top_k),
    }
