# Design System 적용 전 재시작 상태

현재 활성 브랜치는 `codex/design-system-restart`다. 서비스 코드는 아래 checkpoint와 정확히 동일하며, 새로운 색상이나 디자인을 적용하지 않았다.

## 기준과 보존

- Checkpoint: `0d9f3d978595ab2899cab9362c3872e3b8460480` (`chore: checkpoint before design system migration`).
- 시작 브랜치: `codex/restore-ui-scoped-green`, `9628a5f32836df0198ed2fb0297e1837bdcf3076`.
- 시작 시 working tree는 깨끗했고 미커밋/미추적 작업은 없었다.
- `git switch -c codex/design-system-restart <checkpoint>`로 checkpoint에서 직접 새 브랜치를 만들었다. migration 커밋 위에서 부분 수정하거나 revert를 쌓지 않았다.
- `codex/design-system-migration` (`f5ca7f1`), `codex/restore-ui-scoped-green` (`9628a5f`), `codex/ui-checkpoint-20261120` (`0d9f3d9`)를 모두 보존했다.
- main과 origin/main은 이번 작업에서 변경하지 않았다. 확인 시 origin/main은 로컬 main보다 10개 커밋 앞서 있었으며, checkpoint를 정확히 재현하기 위해 원격 변경을 합치지 않았다.
- reset, force checkout, stash, branch 삭제, history rewrite, push, merge는 수행하지 않았다.

## 서비스와 Design System 구분

`src` 전체, `public`, `supabase`, 의존성/설정, 기존 샘플 검증 앱은 checkpoint 그대로다. 서비스 UI뿐 아니라 당시 미커밋 작업을 보존했던 AI 관련 코드도 checkpoint에 포함된 상태로 유지된다.

기존 UI로 돌아온 주요 파일:

- `src/app/globals.css`, `src/app/layout.tsx`
- 로그인/회원가입/group-setup/mypage 페이지
- AppShell/SectionCard, BottomNavigation, GroupPageHeader, ProfileAvatar
- GroupHomeScreen, StudyHub, StudyEntryScreen, StudyCreateScreen
- PlanFlowScreen, PlanAgentScreen, WeeklyPlanTabs, StudyRulesModal, PlanReferenceViewerDialog
- MaterialsScreen의 목록/업로드/Material AI

이전 migration의 `service-ui.css`, `src/lib/design-system.ts`, `plan-green-colors.ts`, migration 검증 스크립트와 `/qa-create` 검증 route는 checkpoint에 없으므로 이 새 브랜치에 없다. 해당 기록은 이전 브랜치에서 계속 확인할 수 있다.

최종 `DESIGN_SYSTEM.md`, `src/app/design-preview-v2/`, `src/components/design-preview-v2/`는 checkpoint와 작업 전 버전이 동일함을 확인하고 그대로 유지했다. 기존 디자인 시스템 관련 문서도 유지한다.

checkpoint 이후 작성된 다음 두 문서만 기존 브랜치에서 내용 그대로 보존했다:

- `docs/design-system-migration.md`
- `docs/scoped-green-restoration.md`

두 문서는 이전 실험의 이력이며 현재 서비스 적용 상태를 뜻하지 않는다. 이 문서와 함께 문서 전용 커밋으로 남긴다. checkpoint 이후 별도로 생긴 기능 변경 때문에 제외하거나 자동 덮어쓴 파일은 없다.

## 검증

- `git diff <checkpoint> -- src DESIGN_SYSTEM.md AGENTS.md package.json pnpm-lock.yaml supabase`: 차이 없음.
- `pnpm lint`: 통과.
- `pnpm build`: 통과. 기존 서비스 routes compile.
- 실제 앱의 `/` 진입 및 `/login` 화면 진입 확인.
- 기존 sample-data 앱에서 그룹, Plan/공동 계획/개인 Todo, Review 모달, Plan AI 채팅·미리보기, Materials, Material AI 열기/닫기 확인.
- Plan 218개, Plan AI 125개 DOM 요소의 spacing/radius/font/색상이 이전에 기록한 원래 UI 기준과 동일했다. Plan CTA는 기존 `#79B895`로 표시된다.
- 실제 인증·DB 저장·파일 업로드·AI 호출은 수행하지 않았다. 인증이 필요한 화면은 기존 isolated sample-data 앱으로 UI를 확인했다.

서비스: `http://127.0.0.1:3000/`
최종 Design System: `http://127.0.0.1:3000/design-preview-v2`
샘플 Plan/Todo/Review: `http://127.0.0.1:3100/presentation-preview/todo`
샘플 Plan AI: `http://127.0.0.1:3100/presentation-preview/plan`
샘플 Materials/Material AI: `http://127.0.0.1:3100/presentation-preview/materials`

서비스 소스는 checkpoint와 동일한 상태이므로, 사용자 확인 후 이 브랜치에서 별도 범위를 정해 다음 작업을 시작할 수 있다.
