StudyFlow Presentation Preview (isolated local app)

Start from C:/GitHub/capstone:
node node_modules/next/dist/bin/next dev artifacts/presentation-preview-app --hostname 127.0.0.1 --port 3100

Routes on http://127.0.0.1:3100:
/presentation-preview/group
/presentation-preview/plan
/presentation-preview/materials
/presentation-preview/todo
/presentation-preview/review

This app directly imports the existing GroupHomeScreen, PlanAgentScreen,
MaterialsScreen, PlanFlowScreen and their existing shared UI/styles.
Only this app's tsconfig resolves Auth/Prototype imports to the demo adapter.
The production app's tsconfig and Providers remain unchanged.
No dependencies need to be installed. Existing workspace packages are used.
The isolated root layout never mounts production AppProviders.

Example data lives in src/components/presentation-preview/demo-data.ts.
AI conversations and plan drafts are fixed examples, not live model outputs.
Adapter actions are no-ops or in-memory UI changes. No backend writes or auth.
The review route shares PlanFlowScreen; click '예정 항목 보기' to open the real modal.

Checks from repository root:
pnpm lint
node node_modules/eslint/bin/eslint.js src/components/presentation-preview artifacts/presentation-preview-app/app artifacts/presentation-preview-app/next.config.mjs artifacts/presentation-preview-app/postcss.config.mjs
node node_modules/typescript/bin/tsc --project artifacts/presentation-preview-app/tsconfig.json --noEmit
pnpm build

Generated Next output stays in the preview app's node_modules/.cache directory,
which is excluded from source linting and version control.

Preview-only source files:
C:/GitHub/capstone/src/components/presentation-preview/demo-data.ts
C:/GitHub/capstone/src/components/presentation-preview/demo-adapter.tsx
C:/GitHub/capstone/src/components/presentation-preview/presentation-preview-screen.tsx

Isolated app files (under C:/GitHub/capstone/artifacts/presentation-preview-app):
app/layout.tsx
app/page.tsx
app/presentation-preview/[screen]/page.tsx
app/preview.css
next.config.mjs
tsconfig.json
postcss.config.mjs
package.json (no dependencies added)
.gitignore
README.txt
public/hero-study-illustration.svg (unchanged copy of production asset)
public/logo-study.png (unchanged copy of production asset)

Presentation capture assets:
C:/GitHub/capstone/artifacts/capstone-presentation/assets/v4
Final presentation:
C:/GitHub/capstone/artifacts/capstone-presentation/output/StudyFlow_Capstone_Draft_v4.pptx

Replaced slide content: 4 (service flow), 5 (Plan AI), 6 (Material AI),
8 (shared/personal/review), 12 (demo summary), 14 (closing screenshot).
Design System slide 11 is preserved. V3 is preserved.
Captures show original UI + sample data. Live Gemini, real file persistence,
Supabase authorization, RLS, and learning effects were not evaluated.
