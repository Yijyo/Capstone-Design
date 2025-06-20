# 🚗 AI 기반 블랙박스 영상 과실비율 평가 시스템

## 📌 프로젝트 개요

본 프로젝트는 사용자로부터 블랙박스 영상을 업로드받고, AI 기반 분석을 통해 교통사고 과실 비율을 산정하는 시스템입니다. 사용자는 AI 분석 결과를 확인하고, 필요한 경우 추가 설명을 입력하여 재평가를 요청할 수 있습니다. 전체 프로세스는 웹 기반 인터페이스를 통해 직관적으로 제공됩니다.

—

## 🏗️ 시스템 구성

### 🧠 AI 서버 (FastAPI + YOLO + OpenCV + Norfair + OpenAI + Pinecone)

- 블랙박스 영상 내 객체 탐지 및 교통상황 인식
- YOLOv8 및 GNN 기반 모델로 위반 행위 분류 및 과실비율 산출
- `자동차사고 과실비율 인정기준` PDF와 비교하여 기준 반영
- 결과는 JSON 형태로 반환되어 백엔드로 전달됨

### 🔧 백엔드 서버 (NestJS + MariaDB)

- 사용자 인증 및 회원 관리 (JWT 기반)
- 영상 업로드 및 메타데이터 관리
- AI 결과 저장 및 사용자 설명 반영 기능
- 재평가 요청 처리 및 이력 관리
- RESTful API 형태로 프론트엔드와 통신

### 💬 프론트엔드 (React + TypeScript)

- 회원가입 및 로그인 화면
- 블랙박스 영상 업로드 UI
- AI 분석 결과 시각화
- 사용자 설명 입력 및 재평가 요청
- ChatGPT 스타일의 대화형 상담 UI 제공

—

## 🗂️ 디렉토리 구조 (예시)

```
/frontend       # React 기반 프론트엔드
/backend        # NestJS 기반 백엔드
/ai-server      # FastAPI 기반 AI 분석 서버
```

—

## ⚙️ 기술 스택

| 구성 요소 | 기술명 |
| — | — |
| 프론트엔드 | React, TypeScript, Axios, Tailwind |
| 백엔드 | NestJS, TypeORM, MariaDB, JWT |
| AI 분석 서버 | FastAPI, YOLOv8, OpenCV, Norfair, Openai API, Pinecone |

—

## 🔄 주요 기능 흐름

1. 사용자가 웹에서 영상 업로드
2. 백엔드에서 영상 저장 후 AI 서버에 전송
3. AI 서버는 분석 결과(JSON)를 반환
4. 백엔드는 결과를 저장하고 프론트에 전송
5. 사용자는 결과를 확인하고 추가 설명 입력 가능
6. 재평가 요청 시 새로운 결과 저장 및 기록

—

## 🧪 실행 방법

### 프론트엔드

```bash
cd frontend
npm install
npm run dev

```

### 백엔드

```bash
cd backend
npm install
npm run start:dev

```

### AI 서버

```bash
cd ai-server
pip install -r requirements.txt
uvicorn main:app —reload

```

—
