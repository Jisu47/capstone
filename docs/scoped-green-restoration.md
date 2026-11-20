# 기존 UI 복원 및 Plan 영역 녹색 치환

이 기록이 현재 작업 결과다. `design-system-migration.md`는 이전 전체 migration의 이력으로 보존한다.

## Git 기준과 복원

- 시작: `codex/design-system-migration`, `f5ca7f1`. 미커밋 변경·untracked 파일 없음.
- migration 이전 checkpoint: `0d9f3d978595ab2899cab9362c3872e3b8460480`.
- 새 브랜치: `codex/restore-ui-scoped-green`.
- 기존 migration 브랜치와 checkpoint 브랜치는 그대로 보존했다.
- `git fetch origin` 후 `origin/main`은 `9adfd13`, 로컬 main보다 10개 커밋 앞섰다. 이번 복원에 원격 변경을 merge하지 않았다.
- 깨끗한 새 브랜치에서 migration이 수정했던 기존 서비스 파일 21개와 검증 앱 layout 1개에만 `git restore --source=0d9f3d9 --worktree -- <명시한 경로>`를 적용하고 새 커밋을 만들었다. reset/force checkout/force push/history rewrite는 하지 않았다.
- 최종 `DESIGN_SYSTEM.md`, V2 소스와 이전 호환 preview route는 checkpoint와 동일하게 유지했다.
- 이전 migration의 추가 파일 `src/components/service-ui.css`, `src/lib/design-system.ts`는 삭제하지 않고 남겼지만, 서비스/검증 앱의 import와 루트 변수 연결은 제거되어 사용되지 않는다.

기존 phase 이력은 이전 migration 브랜치에 모두 남아 있다: Foundations `e030eeb`, Shared `8621ebd`/`c6ad5db`/`ca29371`, Auth `8ae3d7a`, Group `91c6c17`/`e60d18d`/`9a49ffb`, Plan `b29c16a`/`aea4991`, Materials `7e63b9b`/`2ad498c`, 검증 `f5ca7f1`.

## 담당 판별 근거와 적용 범위

실명·배타적 소유권을 추정하지 않고 현재 Git 계정 Jisu47과 발표 자료의 Git 기준 A/B 구분을 사용했다.
`artifacts/capstone-presentation/build/create-deck-v5.mjs`의 역할 슬라이드는 A=Jisu47, B=kimhanbyeol04로 기록하며, 배타적 담당은 아니라고 명시한다. 중간 보고서에는 개인별 확정 담당표가 없다.

| 구분 | 파일/기능 | 근거 및 이번 처리 |
| --- | --- | --- |
| A. Jisu47 주 담당이 명확 | `plan-screen.tsx`: 공동 계획·개인 Todo·Review, `plan-agent-screen.tsx`: Plan AI·초안 편집 | 최초 구현 `01cf5c9`, 계획/복습 `b2abdb8`, 초안 저장 `303d04b`, 직접 편집 `9a8a44c`, Review `85fdf37`/`bd7d304` 등. 두 화면 내부의 기존 green만 치환 |
| B. 팀원 주 담당이 명확 | 서비스 진입, 로그인/회원가입, 그룹 생성, Materials 목록·업로드·분석 화면 | kimhanbyeol04의 `6372b78`, `1cc53b8`, `4e4a83e`, `7da7d4b`, `3c755c3`; 최신 원격 로그인 `0c8631a`/`6b7a553`, 그룹 생성 `9adfd13`. checkpoint 복원 이후 색상/포맷 변경 없음 |
| C. 공유/복수 수정 | `globals.css`, RootLayout, AppShell/SectionCard, BottomNavigation, GroupPageHeader, ProfileAvatar, StudyRulesModal, GroupHomeTutorial, `group-home-screen.tsx`, `study-hub.tsx`, `mypage/page.tsx` | 여러 기능에 영향 또는 두 계정 수정 이력. 복원만 수행, 새 색상 적용 안 함 |
| C. Plan 소스지만 공유 사용처 있음 | `weekly-plan-tabs.tsx`, `plan-reference-viewer-dialog.tsx` | 관련 변경은 Jisu47 기록이지만 여러 화면에서 사용. 소스 직접 수정 안 함. Plan 하위로 렌더링된 부분만 상속된 기존 `--brand` 색상 적용 |
| C. 기능 통합 파일 | AuthProvider/PrototypeProvider, API, domain/repository, schema | 변경 안 함 |
| D. 배타적 담당 불명 | `group-setup/page.tsx`의 가입 흐름, `prototype-screens.tsx`의 legacy 화면별 소유, 발표/샘플 자산의 개인별 담당 | 추측하지 않고 새 색상 적용 제외. group-setup은 migration 변경 복원만 수행 |

Material AI 연결에 Jisu47의 AI 기여도 있으나, `materials-screen.tsx`의 주요 UI 구현과 업로드 변경은 팀원 기록이다. 해당 파일 전체를 개인 담당으로 간주하지 않았다. Group/Study의 일부 Todo/타이머도 파일 전체의 단독 담당이 확정되지 않아 이번 색상 범위에서 제외했다.

## 실제 CTA reference와 대응표

checkpoint/로컬 원본은 `--brand: #79B895`를 사용한다. 더 최신인 원격 팀원 CSS를 **읽기만** 해서 실제 CTA를 확인했다:

- `origin/main:src/app/login/login.module.css`: `--accent: #4b6c57`, `.primary`가 사용.
- `origin/main:src/components/study-create-screen.module.css`: `--create-accent: #4b6c57`, `.submit`이 사용. 기존 pale background는 `#e8f1e5`, hover는 `#405e4b`.
- `origin/main:src/app/login/page.tsx`, `src/components/study-create-screen.tsx`의 CSS 연결도 확인했다. 원격 파일을 checkout/수정/merge하지 않았다.

| 기존 Plan 색상 | 치환 | 범위 |
| --- | --- | --- |
| `--brand` = `#79B895` | `#4B6C57` | 기존 녹색 버튼·텍스트·border·icon·선택 상태·focus |
| `--brand-soft` = `#E6F3EB` | `#E8F1E5` | 원래 연녹색이던 말풍선/강조만 |
| `rgba(121,184,149,0.10/0.18/0.16)` | `rgba(75,108,87,동일 alpha)` | Plan/Review 기존 녹색 그림자. offset·blur·spread·opacity는 그대로 |

기존 hover/focus/disabled의 구조와 밝기·opacity 동작은 그대로다. 새 hover UI나 새 surface는 추가하지 않았다. 공유 WeeklyPlanTabs에 하드코딩된 연녹색 rgba와 녹색 그림자는 공유 소스를 수정하지 않기 위해 유지했다.

## 실제 변경 파일

색상 재적용은 아래 3개 파일뿐이다:

- `src/components/plan-green-colors.ts`: Plan 전용 CSS 변수 2개.
- `src/components/plan-agent-screen.tsx`: 기존 content div에 변수 style만 연결.
- `src/components/plan-screen.tsx`: 기존 content div와 Review overlay div에 변수 연결, 기존 녹색 rgba 세 곳의 RGB만 교체.

wrapper/컴포넌트/route를 새로 추가하지 않았다. Header, Navigation, AppShell, 전역에는 변수 override를 적용하지 않는다. 공유 컴포넌트는 Plan subtree에서 기존 CSS 변수를 상속하며, 다른 화면은 전역 원래 색상을 그대로 쓴다.

복원 커밋에서만 되돌린 파일:

- `src/app/{globals.css,layout.tsx,group-setup/page.tsx,login/page.tsx,mypage/page.tsx,signup/page.tsx}`
- `src/components/{bottom-navigation,group-home-screen,group-home-tutorial,group-page-header,materials-screen,mobile-shell,plan-agent-screen,plan-reference-viewer-dialog,plan-screen,profile-avatar,study-create-screen,study-entry-screen,study-hub,study-rules-modal,weekly-plan-tabs}.tsx`
- `artifacts/presentation-preview-app/app/layout.tsx`

팀원 파일을 새 스타일로 변경한 것이 아니라, 이전 migration의 해당 변경만 checkpoint와 동일하게 복원했다. API/Provider/비즈니스/DB/의존성에는 diff가 없다.

## 비교와 검증

색상 변경 전에 위 복원 파일들이 checkpoint와 동일한 것을 Git diff로 확인하고, 브라우저에서 Plan/Todo/Review, Plan AI, Materials를 확인했다. 복원 검증 이후에만 색상을 적용했다.

- `node scripts/check-scoped-green.cjs`: 통과. checkpoint 소스에 허용한 import·색상 style·green RGB 치환만 적용한 예상 결과와 **전체 파일 문자열**을 비교한다. geometry class·중립색·문구·기능 코드의 추가 변경을 허용하지 않는다. 다른 서비스/공유/팀원/DS/기능 파일은 checkpoint와 동일한지 확인한다.
- 샘플 앱 DOM 비교: Plan 218개 요소, Plan AI 125개 요소의 width/height·padding/margin/gap·radius·font family/size/weight·line-height·display/grid 차이 0건.
- 비교된 background/text/border에서 변경된 이전 값은 `rgb(121,184,149)`와 `rgb(230,243,235)`뿐이었다. white/gray/black/neutral 변경 0건. 배경 gradient와 neutral shadow는 소스 불변 비교로도 보호한다.
- Materials 88개 요소는 복원 직후와 색상 적용 후 전체 측정값(geometry/색상)이 동일했다.
- 요일 선택, Review 간격 변경, Review 모달 열기/닫기, Todo 체크, Plan AI 초안 편집 UI 확인.
- `pnpm lint`: 통과.
- `pnpm build`: 통과. 기존 서비스 route 전부 compile.
- 실제 계정 인증·DB 저장·업로드·유료 AI 호출은 수행하지 않았다. UI 검증은 기존 isolated presentation 앱의 sample data 기준이며, 실제 기능 변경은 없다.

비교 증거: `artifacts/scoped-green-review/`의 복원/적용 후 JPG와 comparison JSON.

## 커밋과 확인 경로

- `f7601fc`: `revert: restore pre-migration service UI`
- `c718a46`: `style: align plan agent green with service CTA`
- `928bacc`: `style: align plan todo and review green`
- 후속 검증 커밋은 이 문서·비교 증거·검증 스크립트만 포함한다.

서비스: `/group/<id>/plan`, `/group/<id>/plan/agent` (인증 필요).
샘플 확인: `http://127.0.0.1:3100/presentation-preview/todo`, `/presentation-preview/plan`, `/presentation-preview/materials`.
최종 DS: `http://127.0.0.1:3000/design-preview-v2` (변경 없음).

색상만 취소하려면 깨끗한 작업 트리에서 `git revert 928bacc c718a46`을 사용할 수 있다. 실행하지 않았다. 원래 migration 결과는 보존한 `codex/design-system-migration` 브랜치에서 언제든 볼 수 있다. main/develop merge와 원격 push는 하지 않았다.
