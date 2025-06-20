from fastapi import APIRouter, Body
from openai import OpenAI
import os

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/ask-followup")
def ask_followup(payload: dict = Body(...)):
    """
    사용자 분석 결과와 추가 질문을 받아 GPT를 통해 자연스러운 설명 생성
    """
    print("질문 들어옴")

    analysis = payload.get("analysis", {})
    explanation = payload.get("explanation", "")
    message = payload.get("message", "")
    conversation_history = payload.get("conversation_history", [])

    if not analysis:
        return {"error": "no analysis"}
    
    if not explanation:
        return {"error": "no explanation"}
    
    if not message:
        return {"error": "no question"}

    print("분석 결과:", analysis)
    print("설명:", explanation)
    print("질문:", message)
    print("대화 내용:", conversation_history)

    # messages 구성
    messages = [{"role": "system", "content": "당신은 교통사고 과실 판단 전문가입니다."}]

    # 이전 대화 삽입 (각 항목이 role, content 구조로 되어 있어야 함)
    for entry in conversation_history:
        if "role" in entry and "content" in entry:
            messages.append({"role": entry["role"], "content": entry["content"]})

    # 새로운 질문 추가
    messages.append({
        "role": "user",
        "content": f"""
    다음은 한 사용자의 교통사고 분석 결과입니다:

    분석결과 -> {analysis}
    해당 사고에 대한 과실예측 -> {explanation}

    사용자가 이에 대해 다음과 같은 질문을 했습니다:
    \"{message}\"

    이 사고 분석 결과를 바탕으로, 사용자의 질문에 대해 교통사고 과실 판단 전문가로서 자연스럽고 정확하게 설명해 주세요.
    대화는 지금이 처음 아니기 때문에 이전에도 대화하듯이 해도 됩니다 (인삿말은 필요 없음).
    이전 대화 내용에서의 질문과 답변을 바탕으로, 사용자가 이해할 수 있도록 설명해 주세요.
    참고로 사용자의 차량이 A이고, 상대 차량이 B입니다.
    """
    })

    # GPT 호출
    response = client.chat.completions.create(
        model="gpt-4",
        messages=messages
    )

    print("GPT 응답:", response.choices[0].message.content.strip())

    return {
        "response": response.choices[0].message.content.strip()
    }
