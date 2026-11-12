# StudyFlow Design System

## Purpose

StudyFlow의 유일한 최종 UI 기준은 **Design Preview V2**, `/design-preview-v2`에 구현된 디자인 시스템이다.
팀원과 AI agent는 UI 작업 전 Foundations / Components를 확인한다. 이 문서는 현재 구현을 기록하며 새로운 디자인 값이나 variant를 정의하지 않는다.
서비스 UI는 이번 기준 확정 작업에서 교체하지 않았다. 향후 승인된 작업 범위 안에서 점진 적용한다.

## Source of Truth

- 시각적 기준: `/design-preview-v2`의 실제 구현. 문서와 충돌하면 실제 구현을 우선하고 문서를 맞춘다.
- 사용·협업 규칙: `DESIGN_SYSTEM.md`와 `AGENTS.md`.
- 소스: `src/app/design-preview-v2/page.tsx`와 `src/components/design-preview-v2/`의 화면·Overview·예시·CSS.
- 예전 Theme A / Theme B, 버튼 inventory, 폰트 비교 실험은 기준에서 제외한다. 프레임 녹색의 출처였던 과거 Theme A도 별도 테마로 유지하지 않는다.
- 발표용 디자인 시스템 화면은 최종 route만 사용한다. 기존 발표 파일은 이번에 수정하지 않았으며, 옛 프리뷰 화면이 남아 있으면 다음 발표 갱신 때 교체한다.

## Foundations

### Colors

현재 V2 전용 CSS와 예시에 실제 사용하는 값이다. 서비스 전역 token의 변경 지시가 아니다.

| 용도 | 값 |
| --- | --- |
| Header / Sidebar 프레임 | `#205D40` (`--v2-frame`) |
| 주요 동작·강조 | `#27834F` (`--v2-green`) |
| 연한 녹색 | `#EEF7F1` (`--v2-soft`) |
| 흰색 바탕·카드 | `#FFFFFF` |
| 기본 텍스트 | `#242B27` |
| 보조 텍스트 | `#707773` (`--v2-muted`) |
| 기본 border | `#E5E7E6` (`--v2-line`) |
| 상세 예시 영역 바탕 | `#FAFCFB` |
| Primary hover | `#216E43` |
| Secondary hover | `#EEF7F1` |
| Disabled 배경 / 글자 | `#E5EAE7` / `#6E7872` |
| Overview hover 배경 / border | `#F7FAF8` / `#B6D3C0` |

프레임 글자는 흰색, 보조 글자는 흰색 76%, 메뉴는 흰색 86%다.
선택 메뉴는 흰색 배경과 `#205D40` 글자다. 메뉴 hover는 흰색 10%다.
강조색은 녹색 한 계열이며 shadow, gradient, glassmorphism은 사용하지 않는다.

### Typography

- 기본 폰트는 기존 `--font-study-sans`를 참조한다. fallback은 Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR, Segoe UI, sans-serif다. 새 폰트 설치나 전역 설정 변경은 하지 않는다.
- 기본 문자는 14px / line-height 1.6이다.
- 상세 제목은 36px / 1.2 / weight 650, Overview 제목은 28px / weight 650이다. 760px 이하에서는 기존 `.intro h1` 규칙으로 30px이다.
- Overview 그룹 제목·항목 이름은 15px / weight 650, 짧은 설명은 11px이다.
- Typography 상세의 대표 제목은 26px / 1.5 / weight 650이다.
- 카드 제목은 14px / weight 650, 본문은 12px / 1.7이다.
- 값은 역할별 구현값이므로 단일 font size나 weight로 일괄 치환하지 않는다.

### Spacing

- 상세에는 8, 12, 16, 24, 32px 예시가 있다. 막대 너비는 비교를 위해 값의 4배로 표시되며 새 token을 뜻하지 않는다.
- 카드 패딩은 14px, Overview 항목 패딩은 16px(760px 이하 14px), 항목 간격은 12px이다.
- Header 패딩은 위아래 16px / 왼쪽 32px / 오른쪽 48px, 760px 이하에서는 위아래 18px / 좌우 20px이다.
- Sidebar 패딩은 위 36px / 오른쪽 24px / 아래 32px / 왼쪽 32px, 760px 이하에서는 20px이다.
- Content 패딩은 위 34px / 좌우 48px / 아래 32px, 760px 이하에서는 위아래 24px / 좌우 20px이다.

### Radius

Radius 상세는 8, 12, 16px을 비교한다. 카드·상세 stage는 16px, Overview 항목은 12px, Button·Input은 10px, 메뉴·Sidebar 토글은 6px이다.
역할별 값을 확인하고 임의로 새 모서리 체계를 추가하거나 모든 요소를 같은 radius로 통일하지 않는다.

### Border

기본은 1px `#E5E7E6`다. 카드 외곽선과 정보 사이의 구분선으로 구조를 표현한다.
Tabs 선택 표시는 2px 녹색 하단 선이다. 그림자로 영역을 구분하지 않는다.

## Components

현재 표본은 시각적 기준이며 서비스용 공통 컴포넌트나 완성된 행동 명세를 구현한 것으로 간주하지 않는다.

| 항목 | 현재 구현 |
| --- | --- |
| Button | Primary, Secondary, Disabled. min-height 42px, padding 10px 16px, 글자 12px / weight 600, radius 10px. 표본은 서비스 동작을 실행하지 않는다. |
| Input | 학습 목표 라벨·입력창·도움말. padding 12px 14px, 글자 13px, radius 10px. 입력은 화면 안에만 남는다. |
| Card | 이번 주 학습 제목·설명·하단 구분선. padding 14px, radius 16px, 1px border, 최대 예시 폭 430px. |
| Modal | 인라인 대화상자 표본과 보조·주요 버튼. 실제 overlay, 열기·닫기, focus trap은 구현하지 않았다. 서비스 적용 시 기존 동작·접근성을 보존한다. |
| Tabs | 이번 주 / 다음 주 내용 전환. 선택 항목은 녹색 글자와 2px 하단 선. 현재 `aria-pressed` 버튼 묶음이며 완전한 ARIA tablist 키보드 동작을 구현한 것은 아니다. |

Overview에서는 대표 실루엣·이름·짧은 설명만 보여주며 항목 전체 클릭으로 상세를 연다.
size·variant·state를 임의로 추가하지 않는다. 서비스 적용 전 기존 컴포넌트의 행동·접근성 요구를 확인한다.

## Navigation / Layout

- Header는 전체 너비의 진한 녹색 프레임이다. min-height는 76px, 760px 이하 68px이며 아래 border는 1px이다.
- Sidebar는 viewport 왼쪽 끝, 폭 224px이다. 좁은 화면에서도 왼쪽 세로형을 유지한다.
- 흰색 Content는 Sidebar 바로 오른쪽의 남은 너비를 사용한다. 중앙 정렬 max-width는 없다.
- 760px 이하 Content 자식은 최소 너비 320px이고 Content 내부 가로 스크롤을 허용한다.
- Header의 Sidebar 토글로 접으면 Content가 전체 너비로 확장된다. React 로컬 상태이며 새로고침하면 펼쳐진다.
- Overview는 Foundations 5개, Components 5개다. 1024px 이상 3열, 360~1023px 2열, 359px 이하 1열이다.
- 상세는 같은 route 안의 로컬 선택 상태로 전환하며 개별 상세 URL은 없다.
- 상세 상단 `← Overview`는 브라우저 history와 관계없이 Overview를 선택한다.

## Usage Rule

1. 작업 전 최종 화면과 이 문서에서 해당 요소를 확인한다.
2. 기존 서비스 컴포넌트를 먼저 검색·재사용한다. Preview 표본을 그대로 복제하거나 새 전역 Context를 만들지 않는다.
3. 필요한 시각적 변화만 최소 적용하고 기능·인증·데이터 접근·접근성을 보존한다.
4. 새 variant, 색상, spacing, radius는 기존 구현으로 해결 가능한지 먼저 확인한다. 확장이 필요하면 팀과 합의하고 Preview·문서를 함께 갱신한다.
5. 전역 스타일·Provider·공유 타입·컴포넌트 수정은 `AGENTS.md` 협업 규칙을 따른다. 이 문서는 서비스 전체 교체를 자동 승인하지 않는다.
6. 기존 서비스 스타일은 아직 이전되지 않은 구현이며 별도의 디자인 기준이 아니다.

## Suggested migration order

1. Button: 기존 사용처·행동을 확인하고 공통 컴포넌트부터 적용.
2. Input: 라벨·검증·에러·disabled 등 기존 기능을 보존하며 적용.
3. Card: border·padding·radius를 점진 적용.
4. Modal / Tabs: 시각 표본과 서비스 행동 명세를 구분하고 접근성 확인 후 적용.
5. Shared layout: 영향과 충돌 가능성을 팀과 공유한 뒤 적용. 개발용 224px Sidebar를 모바일 서비스에 강제하지 않는다.
6. Feature screens: 하나의 사용자 흐름씩 검증하며 화면별 적용.

위 순서는 다음 작업 제안이며 이번에 서비스 코드를 바꾸지 않았다.

## Legacy audit and cleanup

이전 route와 전용 구현의 import/reference 확인 후 정리했다. 공식 route는 기존 링크·발표 자료 호환성을 위해 `/design-preview-v2` 그대로 유지한다.

### 호환 route로 유지

- `src/app/design-preview/page.tsx`: 옛 UI를 제거하고 최종 route redirect만 유지.
- `src/app/design-preview/buttons/page.tsx`: 옛 inventory를 제거하고 같은 최종 route로 redirect.

### 제거한 이전 전용 구현

- `src/components/design-preview/button-context-mocks.tsx`
- `src/components/design-preview/button-decision-guide.tsx`
- `src/components/design-preview/button-inventory-screen.tsx`
- `src/components/design-preview/button-samples.ts`
- `src/components/design-preview/preview-document.module.css`
- `src/components/design-preview/preview-themes.ts`
- `src/components/design-preview/theme-review.tsx`
- `src/components/design-preview/typography-comparison.tsx`
- `src/lib/preview-fonts.ts`
- `src/lib/preview-fonts.test.mjs`
- `src/lib/server/preview-fonts.ts`
- `public/fonts/preview/.gitkeep` (폰트 파일 없이 빈 폴더 자리만 존재했음)

위 파일은 이전 route 내부에서만 사용되었고 서비스나 최종 V2에서 import하지 않았다. V2 프레임 값은 전용 CSS에 독립적으로 정의되어 있다.

### 수정하지 않고 보존한 항목

- `src/components/app-providers.tsx`: 옛 `/design-preview/buttons`의 Provider 초기화 제외 조건은 공유 서비스 진입 코드다. 서비스 변경을 피하려고 유지했으며 옛 화면을 렌더링하지 않는다. 후속 공통 코드 정리 시 검토할 legacy candidate다.
- `src/app/globals.css`, `src/components/mobile-shell.tsx`, 서비스 공통 UI·Provider·타입: 서비스 의존 파일이므로 삭제하지 않는다. 기존 디자인 값이 있어도 최종 기준으로 간주하지 않는다.
- `artifacts/` 발표 자료와 `src/components/presentation-preview/`: 작업 전부터 있던 미커밋 작업·산출물로 보존한다. 옛 프리뷰 화면 교체 여부는 다음 발표 갱신 때 확인한다.
- 조사 범위에서 별도 기존 `DESIGN_SYSTEM.md`나 디자인 규칙 문서는 발견되지 않았다. 이 문서를 새로 생성했다.
