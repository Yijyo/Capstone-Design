from fastapi import APIRouter, UploadFile, File, Form, Body
import os
import uuid
from app.services.vehicle_to_vehicle import VehicleToVehicleAnalyzer
from app.services.vehicle_to_pedestrian import VehicleToPedestrianAnalyzer
from app.utils.similarity_search import (
    convert_analysis_to_sentence,
    query_similar_cases,
    generate_fault_explanation_gpt,
    generate_question_gpt,
    update_analysis_with_answer
)

router = APIRouter()

UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/video")
async def analyze_video(
    video: UploadFile = File(...),
    accident_type: str = Form(...),
    road_type: str = Form(...),
):
    filename = f"{uuid.uuid4().hex}_{video.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(await video.read())

    if accident_type == "차대차":
        analyzer = VehicleToVehicleAnalyzer(filepath, accident_type, road_type)
    elif accident_type == "차대보행자":
        analyzer = VehicleToPedestrianAnalyzer(filepath, accident_type, road_type)
    else:
        return {"error": "지원하지 않는 사고 유형입니다."}

    try:
        results = analyzer.analyze()
        
        # 판독불가 항목 체크
        uncertain_items = [key for key, value in results.items() 
                         if isinstance(value, str) and "판단불가" in value]
        
        if not uncertain_items:
            # 판독불가 항목이 없는 경우, 유사도 검색 및 설명 생성
            situation_sentence = convert_analysis_to_sentence(results)
            similar_cases = query_similar_cases(situation_sentence)
            
            print("situation_sentence:", situation_sentence)

            if similar_cases and len(similar_cases) > 0:
                similar_case = similar_cases[0]
                explanation = generate_fault_explanation_gpt(situation_sentence, similar_case)
                
                return {
                    "analysis": results,
                    "similar_case": similar_case,
                    "explanation": explanation,
                    "question": None,
                    "needs_confirmation": False,
                    "uncertain_items": []
                }
            else:
                return {
                    "analysis": results,
                    "similar_case": None,
                    "explanation": "유사한 사례를 찾을 수 없어 과실 판단이 어렵습니다.",
                    "question": None,
                    "needs_confirmation": False,
                    "uncertain_items": []
                }
        
        # 판독불가 항목이 있는 경우, GPT로 질문 생성
        question = generate_question_gpt(results, uncertain_items)
        
        return {
            "analysis": results,
            "similar_case": None,
            "explanation": None,
            "question": question,
            "needs_confirmation": True,
            "uncertain_items": uncertain_items
        }
    except Exception as e:
        return {"error": str(e)}

@router.post("/update-analysis")
async def update_analysis(payload: dict = Body(...)):
    """
    사용자의 응답을 받아 분석 결과를 업데이트하고, 
    판독불가 항목이 없어진 경우 유사도 검색 및 설명을 생성
    """
    print("update_analysis 호출됨")
    try:
        analysis = payload.get("analysis")
        answer = payload.get("answer")
        uncertain_items = payload.get("uncertain_items")

        if not all([analysis, answer, uncertain_items]):
            return {"error": "필수 필드가 누락되었습니다."}

        # 사용자 응답을 기반으로 분석 결과 업데이트
        updated_analysis = update_analysis_with_answer(analysis, answer, uncertain_items)
        
        # 업데이트된 결과에서 판독불가 항목 재확인
        remaining_uncertain = [key for key, value in updated_analysis.items() 
                            if isinstance(value, str) and "판단불가" in value]
        
        if not remaining_uncertain:
            # 판독불가 항목이 모두 해결된 경우, 유사도 검색 및 설명 생성
            situation_sentence = convert_analysis_to_sentence(updated_analysis)
            similar_cases = query_similar_cases(situation_sentence)

            print("situation_sentence:", situation_sentence)
            
            if similar_cases and len(similar_cases) > 0:
                similar_case = similar_cases[0]
                explanation = generate_fault_explanation_gpt(situation_sentence, similar_case)
                
                print("[결과 반환]")

                return {
                    "analysis": updated_analysis,
                    "similar_case": similar_case,
                    "explanation": explanation,
                    "question": None,
                    "needs_confirmation": False,
                    "uncertain_items": []
                }
            else:

                print("[결과 반환]")

                return {
                    "analysis": updated_analysis,
                    "similar_case": None,
                    "explanation": "유사한 사례를 찾을 수 없어 과실 판단이 어렵습니다.",
                    "question": None,
                    "needs_confirmation": False,
                    "uncertain_items": []
                }
        
        # 아직 판독불가 항목이 남아있는 경우, 새로운 질문 생성
        question = generate_question_gpt(updated_analysis, remaining_uncertain)
        
        return {
            "analysis": updated_analysis,
            "similar_case": None,
            "explanation": None,
            "question": question,
            "needs_confirmation": True,
            "uncertain_items": remaining_uncertain
        }
    except Exception as e:
        return {"error": str(e)}
