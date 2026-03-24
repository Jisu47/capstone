# Study Flow Prototype

스터디 모임용 AI 모바일 웹 프로토타입입니다.  
실제 백엔드 없이 `Next.js + TypeScript + Tailwind CSS`로 핵심 사용자 흐름만 빠르게 확인할 수 있게 구성했습니다.

## 포함된 화면

- 홈
- 모임 생성
- 모임 상세
- 자료 업로드/목록
- AI 질의응답
- 주간 학습 계획
- 팀원 진도

## 실행 방법

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 열면 바로 데모를 볼 수 있습니다.

## 프로토타입 특징

- 모든 화면에 mock 데이터가 바로 표시됩니다.
- 모임 생성, 체크 토글, AI 질문, 자료 추가는 클라이언트 상태로만 동작합니다.
- 실제 로그인, DB, 파일 업로드, AI API, RAG는 구현하지 않았습니다.

## 검증

```bash
pnpm lint
pnpm build
```
