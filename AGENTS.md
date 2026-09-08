<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from general training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Study Flow Team Agent Rules

## Purpose

This file is the shared development and collaboration rule document for this project.

Multiple team members use different AI agents to implement features. To reduce inconsistent code structure, duplicated implementations, and merge conflicts, every agent and team member must follow the rules below before modifying the project.

This is not a design system document. Do not use this file to decide detailed UI colors, spacing, typography, radius, or visual style. A separate `DESIGN_SYSTEM.md` may be added later.

## Project Stack

- Framework: Next.js 16 App Router
- UI: React 19
- Language: TypeScript
- Styling: Tailwind CSS 4
- Backend/API: Next.js Route Handlers under `src/app/api`
- Auth/Database/Storage: Supabase
- AI: Gemini API integration, with some older OpenAI prototype code still present
- Package manager: pnpm

## Project Structure

- `src/app`: Route pages and API Routes.
- `src/components`: Screen components and reusable UI components.
- `src/lib`: Shared types, domain logic, client API functions, Supabase helpers, AI integration, and repository logic.
- `src/lib/server`: Server-only logic used by API Routes.
- `src/lib/supabase`: Supabase client creation code.
- `supabase/bootstrap.sql`: Supabase schema, RLS policies, Storage bucket setup, and RPC functions.
- `public`: Static image and asset files.
- `docs`: Project documents and reports.

Do not create a new top-level source architecture unless the team has agreed to it.

## File And Folder Roles

- Route page files in `src/app` should stay thin. They should usually import and render a Screen component from `src/components`.
- API Route files in `src/app/api` should focus on request parsing, validation, calling server/domain functions, and returning JSON responses.
- Shared data contracts should be defined or reused from `src/lib/api-contracts.ts`.
- Existing domain types and mock/prototype data types should be checked in `src/lib/mock-data.ts` before adding new types.
- Study plan, plan reference, review, and personal task logic should be checked in `src/lib/plan-flow.ts` before adding new helpers.
- Supabase browser/server client creation should stay in `src/lib/supabase`.
- Server-only upload or API helper logic should stay in `src/lib/server`.

## Component Rules

- Before creating a new UI component, search `src/components` for an existing component with the same role.
- Reuse existing components when possible, especially:
  - `AppShell`
  - `SectionCard`
  - `BottomNavigation`
  - `GroupPageHeader`
  - `ProfileAvatar`
  - `WeeklyPlanTabs`
  - `StudyRulesModal`
  - `PlanReferenceViewerDialog`
- New screen-level components should use the `SomethingScreen` naming pattern.
- Do not add new feature code to `src/components/prototype-screens.tsx`. It contains older prototype screen implementations and should not be extended for new work.
- If a screen file is already large, avoid adding another large block directly to it. Create a small child component or helper function near the feature area or in a new feature-specific component file.
- Do not perform a large component refactor while implementing an unrelated feature.

## Routing Rules

- Use the existing Next.js App Router structure.
- New pages should be added under `src/app` using the current folder-based routing pattern.
- Dynamic group pages should follow the existing `/group/[id]/...` structure.
- For dynamic route params, follow the current project pattern using `params: Promise<{ id: string }>` when the surrounding route uses it.
- Route page files should not contain large UI implementations or business logic.
- Redirect-only routes may use `redirect` from `next/navigation`, as existing routes do.

## State Management Rules

- Authentication state must use `AuthProvider` and `useAuth` from `src/components/auth-provider.tsx`.
- Shared group/material/plan/AI/review state must use the current `PrototypeProvider` and `usePrototype` structure from `src/components/prototype-provider.tsx`.
- Local UI-only state, such as input text, selected tab, open modal, loading state for a local action, and temporary edit draft, may use React state hooks inside the component.
- Do not introduce a new global state management library or a parallel global context without team agreement.
- Do not duplicate existing `PrototypeProvider` behavior in an individual screen.
- When adding shared state, first check whether `PrototypeProvider` already exposes a matching value or action.

## API Writing And Calling Rules

- Before adding a client-side API call, check `src/lib/client-api.ts`.
- If an existing function in `src/lib/client-api.ts` can handle the request, reuse it.
- If a new client API function is needed, add it to `src/lib/client-api.ts` following the existing `parseResponse` pattern.
- API request and response types should be added to or reused from `src/lib/api-contracts.ts` when they are shared across files.
- API Routes should validate request bodies before calling domain or server functions.
- API Routes should return JSON responses consistently and include useful error messages.
- Use `jsonError` from `src/lib/server/route-utils.ts` where it fits the existing route style.
- Do not call Supabase directly from a component if an existing provider, repository function, or API wrapper already handles that operation.
- For AI chat, prefer the current Gemini flow through `/api/ai/chat` unless the team explicitly decides to keep or extend the older prototype question route.

## Authentication Rules

- Use `useAuth` for client-side authentication state.
- Use `getSupabaseBrowserClient` only where direct Supabase browser access is already part of the existing pattern, such as auth/session handling.
- API Routes that require a logged-in user must verify the access token.
- Group-specific mutations must verify that the user belongs to the group.
- Do not bypass existing membership checks when adding material, plan, group, or account-related actions.
- Account deletion and profile updates should follow the existing `AuthProvider` and API Route patterns.

## Existing Code And Type Reuse

- Before implementing a feature, search for existing functions, components, types, and API routes with a similar role.
- Check these files first when relevant:
  - `src/components/prototype-provider.tsx`
  - `src/components/auth-provider.tsx`
  - `src/lib/client-api.ts`
  - `src/lib/api-contracts.ts`
  - `src/lib/mock-data.ts`
  - `src/lib/plan-flow.ts`
  - `src/lib/prototype-repository.ts`
  - `src/lib/gemini.ts`
  - `src/lib/server/material-upload.ts`
- Do not create a second implementation of an existing feature under a different name.
- If the existing implementation is insufficient, extend it with the smallest possible change.
- Keep naming consistent with nearby files.

## Styling Rules

- The detailed design system has not been finalized by the team.
- Do not invent new global design rules.
- Do not refactor unrelated screens for visual consistency during feature work.
- Style only the minimum UI needed for the assigned feature.
- Do not modify `src/app/globals.css` without sharing the planned change with the team first.
- Do not use this file to define specific colors, typography, spacing, radius, button styles, card styles, input styles, or modal styles.
- If `DESIGN_SYSTEM.md` is added later, UI-related work must follow that document as the highest-priority design reference.

## Scope Control

- Modify only files directly related to the assigned feature.
- Do not change unrelated screens, routes, types, API behavior, or global styles.
- Do not run broad formatting that rewrites unrelated files.
- Do not rename, move, or delete files unless the task explicitly requires it and the team has agreed.
- If a requested change appears to require touching many shared files, pause and explain the impact before proceeding.

## Library Rules

- Do not install new libraries without team agreement.
- Before proposing a new dependency, check whether the current stack can solve the problem.
- If a dependency is needed, explain:
  - why it is needed
  - which existing alternatives were checked
  - which files will change
  - whether `package.json` and `pnpm-lock.yaml` will be modified
- Never modify `package.json` or `pnpm-lock.yaml` casually.

## Work Before Coding

Before making changes:

- Run or inspect `git status` to understand the current worktree.
- Check the current Git branch before starting work.
- Check whether the local branch is up to date with the remote branch.
- When the local worktree is clean and it is safe under the team's current branch strategy, sync the latest remote changes before implementing the feature.
- If uncommitted local changes exist, do not automatically stash, reset, discard, overwrite, force checkout, resolve conflicts, or force push in order to sync.
- If syncing would risk overwriting local work or causing a conflict, preserve the existing changes and report the situation before proceeding.
- Read the existing files connected to the assigned feature.
- Search for similar components, functions, types, and API calls before creating new ones.
- Identify whether the feature touches a shared or conflict-prone file.
- For Next.js changes, read the relevant document under `node_modules/next/dist/docs/`.
- For Supabase schema changes, inspect `supabase/bootstrap.sql` and the related TypeScript types.
- For API changes, inspect `src/lib/client-api.ts`, `src/lib/api-contracts.ts`, and the matching API Route.

## Work While Coding

During implementation:

- Stay inside the assigned feature scope.
- Prefer existing project patterns over new patterns.
- Do not introduce a new routing, API, state management, styling, or data access approach.
- Do not duplicate existing behavior in a second place.
- Keep shared file edits small.
- If a large common file must be changed, add only the smallest required change and avoid unrelated cleanup.
- If a large screen needs new UI, prefer extracting a small child component rather than adding another long block.
- Do not perform a broad architecture cleanup as part of a feature task.

## Work After Coding

After making changes:

- Run `pnpm lint`.
- Run `pnpm build` when practical, especially after route, API, type, Supabase, or provider changes.
- Manually inspect the touched user flow when possible.
- For API changes, check both success and failure paths.
- For auth or Supabase changes, check permissions and membership behavior.
- Check that Korean text is not corrupted.
- Summarize which files changed and why.
- Mention any checks that could not be run.

## Conflict-Prone Files

Treat these as shared, high-conflict files:

- `src/components/prototype-provider.tsx`
- `src/app/globals.css`
- `supabase/bootstrap.sql`
- `src/lib/mock-data.ts`
- `src/lib/prototype-repository.ts`
- `src/lib/api-contracts.ts`
- `src/lib/plan-flow.ts`
- `package.json`
- `pnpm-lock.yaml`
- Any file used by multiple screens or features

When editing a conflict-prone file:

- Share the intended change with the team before editing.
- Check whether another teammate is editing it.
- Keep the diff as small as possible.
- Avoid formatting unrelated sections.
- Prefer adding feature-specific code in a new file and wiring it in with a minimal shared-file change.

`PrototypeProvider` requires extra caution. Many features depend on it for shared state and mutations, so unrelated edits in this file often create merge conflicts. Before changing it, confirm that the new state or action cannot be handled by an existing provider method, local component state, `client-api.ts`, or a feature-specific helper.

## Git And Merge Rules

- Commit small, feature-focused changes.
- Avoid mixing unrelated UI, API, database, and refactor changes in one commit.
- Before editing shared files, confirm the current branch and remote sync status. Sync first only when the local state is safe.
- Never force-push, discard another teammate's work, or automatically resolve a potentially destructive Git situation without explicit user approval.
- Resolve conflicts by preserving existing behavior unless the team agreed to change it.
- Do not delete another teammate's code during conflict resolution unless the team confirms it is obsolete.
- Avoid large automatic formatting commits.
- Before opening or merging a PR, run `pnpm lint` and, when practical, `pnpm build`.
- In PR or merge notes, call out any changes to conflict-prone files.

## Team Coordination Rules

Team discussion is required before:

- changing `PrototypeProvider`
- changing `globals.css`
- changing `bootstrap.sql`
- changing shared domain types in `mock-data.ts`, `api-contracts.ts`, or `plan-flow.ts`
- changing dependencies
- changing route structure
- replacing the current state management, API, auth, or data access pattern
- deleting, moving, or renaming existing files

If a task is urgent and a shared file must be changed, make the smallest possible change and clearly document the reason in the commit or PR.
