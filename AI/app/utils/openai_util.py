import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

VALID_ACCIDENT_TYPES = ["차대차", "차대보행자"]

def generate_accident_type_question() -> str:
    return "어떤 유형의 사고였나요? (예: 차대차, 차대보행자 등으로 답변해주세요.)"


def validate_accident_type_response(answer: str) -> tuple:
    """
    사용자 입력이 유효한 사고 유형인지 판단
    """
    answer_clean = answer.strip()

    if answer_clean in VALID_ACCIDENT_TYPES:
        return True, answer_clean, None
    else:
        correction_question = (
            f"'{answer_clean}'는 유효한 사고 유형이 아닙니다."
            f"차대차 또는 차대보행자 중 하나로 정확히 입력해주세요."
        )
        return False, None, correction_question


def generate_uncertain_questions(analysis: dict) -> list:
    """
    판단불가 항목을 기반으로 사용자에게 물어볼 질문 리스트 생성
    """
    questions = []

    for key, value in analysis.items():
        if isinstance(value, str) and "판단불가" in value:
            questions.append(f"{key}에 대해 {value}. 이에 대해 알려주세요.")

    return questions


def merge_user_answers(analysis: dict, user_answers: dict) -> dict:
    """
    사용자 응답을 기존 분석 결과에 반영하여 최종 결과 생성
    """
    merged = analysis.copy()
    for key, value in user_answers.items():
        if key in merged and isinstance(merged[key], str) and "판단불가" in merged[key]:
            merged[key] = value
    return merged
