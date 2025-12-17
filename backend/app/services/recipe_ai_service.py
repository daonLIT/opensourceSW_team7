from __future__ import annotations
import os
import re
import hashlib
from typing import Optional

# (선택) 메모리 캐시: 같은 조리법은 재요청 안 하게
_REWRITE_CACHE: dict[str, str] = {}

def _clean_raw_instructions(raw: str) -> str:
    """원문 조리법 텍스트를 LLM에 보내기 전에 살짝 정리"""
    s = str(raw).strip()
    # 과도한 공백 정리
    s = re.sub(r"\n{3,}", "\n\n", s)
    s = re.sub(r"[ \t]{2,}", " ", s)
    s = s.replace("\\n", "\n").replace("\\t", "\t")
    return s

def _make_cache_key(title: str, raw: str) -> str:
    h = hashlib.sha256((title + "\n" + raw).encode("utf-8")).hexdigest()
    return h[:24]

def _build_prompt(title: str, raw_instructions: str) -> str:
    return f"""
너는 한국어 요리 레시피 편집자야.
아래 '원문 조리법'을 사용자가 바로 따라할 수 있도록 "단계별 레시피"로 다시 작성해줘.

[출력 규칙]
- 반드시 1️⃣, 2️⃣, 3️⃣ ... 형태로 단계 번호를 붙여라
- 각 단계는 "짧은 제목(한 줄)" + 설명(2~4줄)로 구성
- 양념/재료/계량이 나오면 '• 불릿 리스트'로 정리
- 원문에 없는 내용을 새로 만들지 말 것(추측 금지)
- 말투는 친절하지만 과하게 길지 않게
- 결과는 Markdown 텍스트로만 출력(추가 설명/머리말 금지)

[요리명]
{title}

[원문 조리법]
{raw_instructions}
""".strip()

def _postprocess_markdown(md: str) -> str:
    """LLM 출력이 너무 엉키지 않게 최소한의 후처리"""
    s = (md or "").strip()

    # 혹시 "```" 코드펜스로 감싸서 주는 경우 제거
    s = re.sub(r"^```(?:markdown)?\s*", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s*```$", "", s)

    # 단계 번호가 전혀 없으면(실패) 그냥 원문 느낌으로라도 정리
    if "1️⃣" not in s and "2️⃣" not in s:
        s = "1️⃣ 조리하기\n" + s

    # 줄바꿈 과다 정리
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s

# -------------------------------
# ✅ 핵심: LLM 호출 부분
# -------------------------------

def rewrite_instructions(
    title: str,
    raw_instructions: str,
    *,
    use_cache: bool = True,
) -> str:
    """
    입력:
      - title: 레시피 제목
      - raw_instructions: 원문 조리법(줄줄이 텍스트)
    출력:
      - LLM이 단계별로 정리한 Markdown 문자열
    """
    title = (title or "").strip() or "레시피"
    raw_instructions = _clean_raw_instructions(raw_instructions)

    if not raw_instructions:
        return ""

    cache_key = _make_cache_key(title, raw_instructions)
    if use_cache and cache_key in _REWRITE_CACHE:
        return _REWRITE_CACHE[cache_key]

    prompt = _build_prompt(title, raw_instructions)

    # 1) 여기서 LLM 호출해서 텍스트를 받아오면 됨
    #    프로젝트가 Gemini를 쓰고 있으니, 아래 중 한 가지 방식으로 구현하면 돼.
    rewritten = _call_gemini_text(prompt)

    # 2) 후처리
    rewritten = _postprocess_markdown(rewritten)

    if use_cache:
        _REWRITE_CACHE[cache_key] = rewritten

    return rewritten


# ------------------------------------------------------------
# ✅ Gemini 호출 구현 (A안: google-generativeai 라이브러리)
# ------------------------------------------------------------
def _call_gemini_text(prompt: str) -> str:
    """
    google-generativeai 패키지를 쓰는 방식.
    이미 GEMINI_API_KEY를 .env로 쓰고 있으니 이 방식이 가장 깔끔함.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY가 설정되어 있지 않습니다.")

    try:
        import google.generativeai as genai
    except ImportError as e:
        raise RuntimeError(
            "google-generativeai 패키지가 없습니다. "
            "pip install google-generativeai 로 설치하세요."
        ) from e

    genai.configure(api_key=api_key)

    # 모델명은 네 프로젝트 정책에 맞게 바꿔도 됨
    model = genai.GenerativeModel("gemini-2.5-flash")

    resp = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.3,   # 너무 창작하지 않게
            "max_output_tokens": 3000,
        },
    )

    # 라이브러리 응답 형태에 따라 text 접근
    text = getattr(resp, "text", None)
    if text:
        return text.strip()

    # 혹시 안전필터 등으로 text가 비면 후보에서 추출 시도
    try:
        return resp.candidates[0].content.parts[0].text.strip()  # type: ignore
    except Exception:
        return ""
