from fastapi import APIRouter, Body
from app.utils.similarity_search import (
    convert_analysis_to_sentence,
    query_similar_cases,
    generate_fault_response_gpt,
    generate_fault_explanation_gpt
)

router = APIRouter()

@router.post("/similar")
def recommend_similar_cases(payload: dict = Body(...)):
    """
    분석 결과를 문장으로 바꾸고, 유사 사고 사례 조회 (Pinecone 검색)
    """
    analysis = payload.get("analysis")
    if not analysis:
        return {"error": "analysis 필드가 필요합니다."}

    try:
        situation_sentence = convert_analysis_to_sentence(analysis)
        similar_cases = query_similar_cases(situation_sentence)
        return {
            "query_summary": situation_sentence,
            "similar_case": similar_cases[0]
        }
    except Exception as e:
        return {"error": str(e)}

@router.post("/summary-text")
def generate_summary_text(payload: dict = Body(...)):
    """
    사고 요약 + 유사 사례 기반 설명 문장 생성 (GPT)
    - 간결한 설명 문장만 반환
    """
    query_summary = payload.get("query_summary")
    similar_case = payload.get("similar_case")

    if not query_summary or not similar_case:
        return {"error": "query_summary와 similar_case 필드는 필수입니다."}

    try:
        explanation = generate_fault_explanation_gpt(query_summary, similar_case)
        return {
            "summary_explanation": explanation
        }
    except Exception as e:
        return {"error": str(e)}


@router.post("/summary-gpt")
def generate_gpt_style_response(payload: dict = Body(...)):
    """
    사고 요약 + 유사 사례 기반 GPT 스타일 응답 생성
    - 사용자에게 바로 전달 가능한 자연스러운 설명 응답
    """
    query_summary = payload.get("query_summary")
    similar_case = payload.get("similar_case")

    if not query_summary or not similar_case:
        return {"error": "query_summary와 similar_case 필드는 필수입니다."}

    try:
        reply = generate_fault_response_gpt(query_summary, similar_case)
        return {
            "gpt_reply": reply
        }
    except Exception as e:
        return {"error": str(e)}

