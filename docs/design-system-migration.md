# Design System migration review

## Preserved baseline

- Start branch: `main`, commit `fcd3da5`.
- Checkpoint: `0d9f3d978595ab2899cab9362c3872e3b8460480` (`chore: checkpoint before design system migration`).
- Safety branch: `codex/ui-checkpoint-20261120`.
- Review branch: `codex/design-system-migration`.
- The checkpoint preserves all pre-existing tracked/untracked, non-ignored work, including AI changes, documents and presentation artifacts. Ignored local environment files remain in place and were not committed.
- `origin/main` was fetched at `9adfd13`, 10 commits ahead of local `main`. Those commits were not merged into this experiment. Review remote changes separately before any eventual merge. Local `main` is unchanged; nothing was pushed or merged.

## Scope and implementation

The approved `/design-preview-v2`, its component sources and `DESIGN_SYSTEM.md` are unchanged from the checkpoint. The service consumes the existing palette through `src/lib/design-system.ts`, mapped to `--sf-*` variables on the root layout. Legacy global color aliases point to those variables.

Existing native controls and shared components use `src/components/service-ui.css` (`sf-button`, `sf-primary`, `sf-secondary`, `sf-field`, `sf-card`, `sf-dialog`). This keeps their props, event handlers, form semantics and conditional states. No duplicate Button/Input/Card implementations or dependencies were added.

- Primary `#4B6C57`, hover `#405C4A`, foreground `#FFFFFF`.
- Background/surface `#FFFFFF`; subtle surface `#E6F3EB`; accent `#79B895`; border `#E0E4E2`.
- Text primary/secondary/muted `#38423D` / `#66786F` / `#7D8C85`.
- Buttons: minimum height 42px, padding 10px 16px, radius 10px, type 12px/600.
- Fields: padding 12px 14px, radius 10px, type 13px.
- Cards: padding 14px, radius 16px, 1px border. Shared card headings use 14px/650. Existing service text hierarchy remains role-specific; display-font usages use the existing sans stack.
- Decorative shadows/gradients were removed from migrated service UI. Existing mobile shell width, responsive grid structure and feature-specific layout are preserved; the development preview's sidebar was not copied into the mobile service.

The shared `globals.css` change is limited to palette aliases, page background, selection and placeholder color. RootLayout supplies variables and imports the scoped shared visual classes. These are conflict-prone shared files to review when combining other branches.

## Phase commits

| Phase | Main commit | Scoped follow-up commits |
| --- | --- | --- |
| 1 Foundations | `e030eeb` | — |
| 2 Shared components | `8621ebd` | `c6ad5db`, `ca29371` |
| 3 Authentication / entry | `8ae3d7a` | — |
| 4 Group / study / account | `91c6c17` | `e60d18d`, `9a49ffb` |
| 5 Plan / AI / Todo / Review | `b29c16a` | `aea4991` |
| 6 Materials / Material AI | `7e63b9b` | `2ad498c` |

Shared components touched: AppShell/SectionCard, BottomNavigation, GroupPageHeader, ProfileAvatar, WeeklyPlanTabs, StudyRulesModal, PlanReferenceViewerDialog and GroupHomeTutorial. Screen changes cover login, signup, group setup, entry, group creation, group home, study hub, mypage, plan, plan agent and materials.

## Verification

- `pnpm lint`: passed before migration and after the final style changes.
- `pnpm build`: passed before migration and after migration; all existing service routes compile.
- `node --test tests/ai-provider.test.cjs`: 15 passed. These are existing tests with mocked upstream transport, including plan draft edit/apply and materials flows; they do not call a paid provider or prove live Supabase behavior.
- `node scripts/check-design-migration.cjs`: passed. Protected APIs, auth/provider/domain/schema files and the approved design system are byte-unchanged relative to the checkpoint. Functional AST comparison passed for 19 changed service TSX files, ignoring visual attributes/color-class literals. RootLayout style wiring is reviewed separately. This audit supplements, rather than replaces, runtime testing.
- Actual production app: login route, email editing, signup navigation and create route auth guard checked. Login CTA computed style: `rgb(75,108,87)`, white text, 10px radius, 42px min-height, 12px font.
- Isolated sample-data app: group render, rules modal open/edit/close, day-tab switching, review interval switching, review modal open/close, Todo completion toggle, plan draft edit controls, material selection, Material AI input/send enablement, expand/close, upload modal open/close checked. Narrow viewport renders were inspected; temporary viewport override was reset.
- Group creation sample inputs were checked, but automated native date input did not accept a value; successful form submission/navigation was not verified.
- No real account sign-in/signup, persistent group/plan/Todo/review writes, file upload, AI request or destructive action was performed. These authenticated backend flows still require a test account and user review.

The sample-data QA app already existed under `artifacts/presentation-preview-app`; its root layout now consumes the same service variables/CSS. The added `/qa-create` route exists only in that isolated app, not in the service router. Production auth/providers were not bypassed or modified.

## Review routes

Production app (`pnpm start --hostname 127.0.0.1 --port 3000`, after `pnpm build`):

- `/`, `/login`, `/signup`, `/group-setup`, `/create`, `/study`, `/mypage`.
- `/group/<id>`, `/group/<id>/study`, `/group/<id>/plan`, `/group/<id>/plan/agent`, `/group/<id>/materials`, `/group/<id>/ai`, `/group/<id>/progress`.
- `/design-preview-v2` remains the unchanged visual reference.

Sample UI review (no live login/data required):

```powershell
node node_modules/next/dist/bin/next dev artifacts/presentation-preview-app --hostname 127.0.0.1 --port 3100
```

- `http://127.0.0.1:3100/presentation-preview/group`
- `http://127.0.0.1:3100/presentation-preview/todo` (plan/Todo/Review)
- `http://127.0.0.1:3100/presentation-preview/plan` (Plan AI)
- `http://127.0.0.1:3100/presentation-preview/materials` (includes Material AI)
- `http://127.0.0.1:3100/qa-create`

## Remaining styles requiring a decision

- `study-hub.tsx`: timer uses a functional conic-gradient with `#8ED2A4` / translucent green to visualize elapsed progress. It was retained rather than removing a functional indicator.
- Existing rose/red error, deletion and validation colors remain: no approved semantic danger/error palette exists in the current preview.
- Profile preset colors remain user identity choices. Decorative avatar gradient was removed; old `from-*`/`to-*` class strings in presets are inert without a gradient utility.
- Icon-only buttons, avatars, progress tracks and specialized interactive rows retain their geometry; not every local utility was forced into a text button or card rule. Existing service title sizes and specialized row spacing remain where role mapping is ambiguous.
- `prototype-screens.tsx` is unused legacy code and was not extended or migrated. Presentation artifacts outside the QA palette bridge retain their existing content.
- Some old geometry/color-alias utility strings remain on native controls; shared visual classes/aliases override them. Do not infer the rendered style solely from those strings.

## Rollback (examples only; not executed)

Preserve any new uncommitted work before switching or reverting. To inspect the exact pre-migration state while keeping every migration commit:

```powershell
git switch codex/ui-checkpoint-20261120
```

To resume the experiment:

```powershell
git switch codex/design-system-migration
```

To create an independent branch at the baseline:

```powershell
git switch -c codex/pre-migration-review 0d9f3d978595ab2899cab9362c3872e3b8460480
```

To undo only Materials styling on the migration branch, revert its follow-up first, then its main phase:

```powershell
git revert 2ad498c 7e63b9b
```

Likewise Plan is `aea4991` then `b29c16a`, Group is `e60d18d` then `91c6c17`. For shared components/foundations, first revert dependent screen phases and later shared follow-ups; leaving screen classes without their shared variables/styles would be incomplete. Reverts can conflict when later commits touch the same styles; inspect rather than auto-resolving. Switching to the checkpoint branch is the simplest complete rollback and requires no history rewrite.

No reset, force-push, branch deletion, automatic merge or actual rollback was performed.
