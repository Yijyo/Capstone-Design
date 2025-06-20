from fastapi import APIRouter, Body
from app.utils.openai_util import (
    generate_accident_type_question,
    validate_accident_type_response,
    generate_uncertain_questions,
    merge_user_answers
)

router = APIRouter()

@router.post("/ask-accident-type")
def ask_accident_type(user_input: dict = Body(...)):
    """
    사용자에게 사고 유형을 질문하고,
    그 응답이 적절한지 확인하여 다시 질문할지 결정함
    """
    answer = user_input.get("answer")

    if not answer:
        question = generate_accident_type_question()
        return {"question": question}
    
    is_valid, confirmed_type, correction_question = validate_accident_type_response(answer)

    if is_valid:
        return {"accident_type": confirmed_type}
    else:
        return {"question": correction_question}


@router.post("/handle-uncertain")
def handle_uncertain(payload: dict = Body(...)):
    """
    판단불가 항목만 사용자에게 질문하고,
    응답이 들어오면 해당 항목만 반영하여 최종 결과 반환
    """
    analysis = payload.get("analysis", {})
    user_answers = payload.get("user_answers", {})

    uncertain_keys = [key for key, value in analysis.items()
                      if isinstance(value, str) and "판단불가" in value]

    items_to_confirm = []
    for key in uncertain_keys:
        question = f"{key}에 대해 {analysis[key]}. 이에 대해 알려주세요."
        items_to_confirm.append({
            "key": key,
            "value": analysis[key],
            "question": question
        })

    if user_answers:
        final_result = analysis.copy()
        for k, v in user_answers.items():
            if k in uncertain_keys:
                final_result[k] = v

        return {
            "status": "complete",
            "final_result": final_result
        }

    return {
        "status": "needs_confirmation",
        "items_to_confirm": items_to_confirm
    }


