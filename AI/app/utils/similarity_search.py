# app/utils/similarity_search.py
import os
from openai import OpenAI
from pinecone import Pinecone
from typing import List, Dict
import json

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX") or "accident-cases"
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")

client = OpenAI(api_key=OPENAI_API_KEY)

# Pinecone 초기화
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX)

def convert_analysis_to_sentence(analysis: dict) -> str:
    """분석 결과를 문장으로 변환"""
    print("[분석 결과를 문장으로 변환]")
    factor_list = []
    for key, value in analysis.items():
        if isinstance(value, bool):
            description = f"{key}은 {'발생했습니다' if value else '발생하지 않았습니다'}."
        elif isinstance(value, str) and "판단불가" in value:
            description = f"{key}은 판단할 수 없었습니다. ({value})"
        else:
            description = f"{key}: {value}"
        factor_list.append(description)

    raw_summary = "\n".join(factor_list)

    prompt = f"""
    다음은 교통사고 판단 요소들입니다. 이 요소들을 바탕으로 상황을 설명하는 한 문장을 생성해주세요:

    {raw_summary}

    상황 설명:
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )

    return response.choices[0].message.content.strip()


def query_similar_cases(situation_sentence: str, top_k: int = 1) -> list:
    print("[유사 사고 찾는 중]")
    embedding_response = client.embeddings.create(
        input=[situation_sentence],
        model="text-embedding-3-large"
    )
    embedding = embedding_response.data[0].embedding

    results = index.query(namespace="vehicle_to_vehicle",vector=embedding, top_k=top_k, include_metadata=True)

    cases = []
    for match in results["matches"]:
        case = {
            "score": match["score"],
            "situation": match["metadata"].get("situation_text"),
            "final_ratio": match["metadata"].get("final_ratio"),
            "related": match["metadata"].get("related")
        }
        cases.append(case)

    # 결과가 비어있는 경우 기본값 반환
    if not cases:
        return [{
            "score": 0.0,
            "situation": "유사한 사례를 찾을 수 없습니다.",
            "final_ratio": "판단 불가",
            "ralated": "유사 판례 및 법령 없음"
        }]

    return cases


def generate_fault_explanation_gpt(query_summary: str, similar_case: dict) -> str:
    print("[답변 생성 중]")
    """OpenAI를 통한 설명 생성"""
    situation = similar_case.get("situation", "")
    ratio = similar_case.get("final_ratio", "")
    related = similar_case.get("related", "")

    prompt = f"""
    다음은 교통사고 상황과 유사한 판례입니다:
    
    현재 상황: {query_summary}

    예측 과실 비율: {ratio}
    사용자가 A이야
    
    유사 판례: {related}
    
    위 정보를 바탕으로, 현재 상황에 대한 과실 판단과 그 이유를 설명해주세요.
    설명은 자연스럽고, 친절한 한국어로 작성해주세요.
    유사 판례는 답변 마지막에 깔끔하게 정리해서 주세요.
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "당신은 교통사고 분석 전문가입니다."},
            {"role": "user", "content": prompt}
        ]
    )
    
    return response.choices[0].message.content


def generate_fault_response_gpt(query_summary: str, similar_case: dict) -> str:
    situation = similar_case.get("situation", "")
    ratio = similar_case.get("final_ratio", "")
    score = similar_case.get("score", 0)

    prompt = f"""
    당신은 교통사고 과실 판단을 설명하는 GPT입니다.
    주어진 사용자 사고 요약, 유사 사례, 과실 비율을 바탕으로 아래 조건에 맞는 응답을 생성해주세요.

    ### 조건:
    1. 사고 상황을 사용자에게 요약 설명
    2. 유사한 판례 내용을 연결해 설명
    3. 과실 비율을 해석해서 사용자에게 설명
    4. 최종적으로 사용자가 참고할 수 있는 메시지로 마무리

    모든 설명은 자연스럽고, 친절한 한국어로 작성해주세요.

    ### 사용자 사고 요약:
    {query_summary}

    ### 유사 사례:
    {situation}

    ### 유사 사고 과실 비율:
    {ratio} (유사도: {score:.2f})

    --- 사용자에게 전달할 답변 시작 ---
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6
    )

    return response.choices[0].message.content.strip()


def generate_question_gpt(analysis: dict, uncertain_items: list) -> str:
    """판독불가 항목에 대한 질문을 GPT로 생성"""
    prompt = f"""
    다음은 교통사고 분석 결과입니다. 판독불가 항목에 대해 사용자에게 물어볼 질문을 생성해주세요.

    분석 결과:
    {analysis}

    판독불가 항목:
    {uncertain_items}

    위 정보를 바탕으로, 사용자에게 물어볼 자연스러운 질문을 생성해주세요.
    질문은 하나의 문장으로 작성해주세요.
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "당신은 교통사고 분석 전문가입니다."},
            {"role": "user", "content": prompt}
        ]
    )
    
    return response.choices[0].message.content


def update_analysis_with_answer(analysis: dict, answer: str, uncertain_items: list) -> dict:
    """사용자의 응답을 기반으로 분석 결과 업데이트"""
    prompt = f"""
    다음은 교통사고 분석 결과와 사용자의 응답입니다.
    사용자의 응답을 바탕으로 분석 결과를 업데이트해주세요.

    현재 분석 결과:
    {analysis}

    판독불가 항목:
    {uncertain_items}

    사용자 응답:
    {answer}

    위 정보를 바탕으로, 사용자의 응답을 반영하여 분석 결과를 업데이트해주세요.
    판독불가 항목에 대해서만 값을 변경하고, 나머지 항목은 그대로 유지해주세요.
    응답은 JSON 형식으로 반환해주세요. 예시:
    {{
        "신호위반": true,
        "선진입 여부": "true",
        "회전 중 주의의무 위반": false
    }}
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "당신은 교통사고 분석 전문가입니다. JSON 형식으로만 응답해주세요."},
            {"role": "user", "content": prompt}
        ]
    )
    
    try:
        # 응답에서 JSON 부분만 추출
        content = response.choices[0].message.content
        # JSON 형식의 문자열을 찾아서 파싱
        import re
        json_str = re.search(r'\{.*\}', content, re.DOTALL).group()
        updated_analysis = json.loads(json_str)
        
        # 원본 분석 결과와 병합
        result = analysis.copy()
        for key in uncertain_items:
            if key in updated_analysis:
                result[key] = updated_analysis[key]
        
        return result
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Raw response: {content}")
        # 오류 발생 시 원본 분석 결과 반환
        return analysis
