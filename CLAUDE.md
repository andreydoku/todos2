# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is an npm workspaces monorepo (`frontend`, `backend`, `infra`). Run `npm install` once at the repo root to install all three.

### Frontend (`frontend/`)
```bash
cd frontend
npm run dev        # Vite dev server; proxies /todos and /order to DEV_API_URL (see below)
npm run build       # tsc -b && vite build -> frontend/dist
npm run lint         # oxlint
```
No test runner is configured in this repo (frontend, backend, or infra).

Local dev talks to the **live deployed dev API**, not a local backend. Create `frontend/.env.local` (gitignored):
```
DEV_API_URL=https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com
```
This is consumed by `vite.config.ts`, which only sets up the `/todos` and `/order` proxy when `DEV_API_URL` is present.

### Backend (`backend/`)
```bash
cd backend
npm run build       # tsc
npm run typecheck   # tsc --noEmit
```
There is no standalone way to run the Lambda handlers locally — they're only invoked via the deployed API Gateway, and get rebundled directly from `backend/src` by CDK on every deploy (see Deploying below).

### Infra (`infra/`, AWS CDK v2)
```bash
cd infra
npx cdk synth                                              # synthesize CloudFormation
npx cdk diff Todos2Stack-dev --profile todos2-deployer     # preview changes
npx cdk deploy Todos2Stack-dev --profile todos2-deployer   # deploy
npx cdk destroy Todos2Stack-dev --profile todos2-deployer  # tear down
```
Swap `-dev` for `-prod` to target the other environment. Requires the AWS CLI configured with the `todos2-deployer` profile and CDK already bootstrapped in the account.

### Deploying (both frontend + backend)
`cdk deploy` rebuilds the Lambdas from source automatically (`NodejsFunction` bundles `backend/src/handlers/*.ts` with esbuild on every deploy), but the frontend's static `dist/` must be built first since it's what gets synced to S3:
```bash
cd frontend
VITE_API_URL=https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com npm run build

cd ../infra
npx cdk deploy Todos2Stack-dev --profile todos2-deployer
```
The very first deploy to a fresh account needs three passes (placeholder frontend build → deploy to get the real `ApiUrl` output → rebuild frontend with that URL → deploy again to sync S3) — see `README.md` for the exact sequence. `VITE_API_URL` and `DEV_API_URL` both come from the stack's `ApiUrl` CloudFormation output; fetch it with:
```bash
aws cloudformation describe-stacks --stack-name Todos2Stack-dev --profile todos2-deployer --query "Stacks[0].Outputs"
```

## Architecture

### Environments
`dev` and `prod` are fully isolated stacks (`Todos2Stack-dev` / `Todos2Stack-prod`) in the same AWS account, defined side by side in `infra/bin/app.ts`. Every resource name is derived from the environment (`Todos2-{env}-{name}`), see the table in `README.md`.

### Data model — single DynamoDB table, single implicit user
There's no auth. Every item belongs to the hardcoded partition key `USER_PK = 'USER#default'` (`backend/src/types.ts`). Two kinds of items share the table:
- Todos: `SK = TODO#{id}`, shaped as `DynamoTodo` (a `Todo` plus `PK`/`SK`).
- Ordering: a single item at `SK = ORDER` whose `ids` attribute is the full ordered array of todo IDs. Reordering, adding, and deleting all write to this one item via `PUT /order` — the todo items themselves have no ordering field.

Handlers strip `PK`/`SK` before returning todos to the client (see the `{ PK: _pk, SK: _sk, ...todo }` destructure repeated in each handler).

### Backend — one Lambda per route
`backend/src/handlers/*.ts` are thin, independent `APIGatewayProxyHandlerV2` functions (`getTodos`, `createTodo`, `updateTodo`, `deleteTodo`, `getOrder`, `updateOrder`), each importing the shared DynamoDB Document Client from `backend/src/db.ts` and the key helpers/constants from `backend/src/types.ts`. `updateTodo` builds its `UpdateExpression` dynamically from whichever of `title` / `completed` / `doDate` are present in the body (`doDate: null` triggers a `REMOVE` instead of `SET`). `doDate` format validation (`YYYY-MM-DD`) is shared via `backend/src/validation.ts`'s `isValidDoDate`, used by both `createTodo` and `updateTodo`.

**`createTodo` takes a client-generated `id`** (a `crypto.randomUUID()` from the frontend), not a server-generated one — this lets the frontend add a todo optimistically under its *final* id with no later id-swap (see Frontend below). Its `PutCommand` uses `ConditionExpression: 'attribute_not_exists(PK)'` to reject an id collision with `409` rather than silently overwriting an existing item — the create-side mirror of the `attribute_exists(PK)` existence checks `updateTodo`/`deleteTodo` use (via caught `ConditionalCheckFailedException`) to return 404 instead.

### Infra — `infra/lib/todos-stack.ts`
One CDK stack (`Todos2Stack`) wires: DynamoDB table (single-table, pay-per-request) → 6 `NodejsFunction` Lambdas (one per handler, minified esbuild bundling, least-privilege `grantReadData`/`grantWriteData`/`grantReadWriteData` per handler) → HTTP API Gateway routes → S3 bucket + CloudFront distribution serving `frontend/dist` via `BucketDeployment` (which also invalidates CloudFront on deploy). SPA routing is handled by mapping 403/404 back to `/index.html`.

### Frontend — routed calendar views over one shared todo store

**Routing** (`frontend/src/App.tsx`, `react-router-dom`): `/all` (flat list), `/day/:date`, `/3-day/:date`, `/month/:date`. The bare form of each date route (`/day`, `/3-day`, `/month`) redirects to today's date-qualified URL — every route always has its date in a `:date`/`:year/:month`-shaped param, never an implicit "today" fallback baked into a component. `main` is pinned to `h-screen flex flex-col` (not `min-h-screen`) so the content area below `Nav` is a fixed, non-page-scrolling region (`flex-1 min-h-0 overflow-hidden`) — every view and every `TodoList` inside it is expected to fill that height itself (`h-full` threaded all the way down) and scroll internally, not grow the page.

**Shared state — `frontend/src/context/TodosContext.tsx`**: `TodosProvider`/`useTodos()` is the only thing that talks to the API (`frontend/src/api.ts`) or holds `todos`/`orderedIds`, fetched once on mount and shared by every route. Every mutating handler (`handleAdd`, `handleToggle`, `handleRename`, `handleSetDoDate`, `handleDelete`, `commitOrder`, `handleMoveTodo`) is **optimistic with rollback**: it applies the change to local state first, fires the API call(s), and on failure restores the pre-change snapshot and sets `error` (rendered as a banner in `App.tsx`). `handleAdd` generates the new todo's id itself via `crypto.randomUUID()` (see the backend note above) specifically so the optimistic row exists under its final id from the start — no id-swap-driven remount to interrupt the auto-focus-into-edit-mode flow described below.

**`TodoList` is one component reused everywhere** — `/all`'s flat list, the day view, each of the 3-day view's day columns, each of the month grid's 21 cells, and every "Unscheduled" list — parameterized by `listId`, `title`, `todos` (pre-filtered/ordered by the caller via `lib/todos.ts`'s `orderAll`/`todosForDate`), `onAdd`, `compact`, and `highlighted`. It does not own a text-input add form: its header is a `flex justify-between` row with the title and a small "+" icon button that creates a todo titled `"new task"`, then passes `autoFocus`/`onAutoFocused` down through `TodoCard` to `TodoTitle`, which drops straight into its rename-edit-mode (auto-focused, text pre-selected) so the placeholder title can be typed over immediately; `TodoList` also scrolls the new row into view via a `data-todo-id` attribute + `scrollIntoView`. `TodoCard` (renamed from `TodoItem`) takes a `showDoDate` prop — `TodoList` only passes `true` for the `/all` list, since every other list's membership (a specific date, or "Unscheduled") already implies the todo's date, so showing the date picker there would be redundant. `compact` (used for month-grid cells) shrinks text/icon/padding sizes throughout `TodoCard`/`TodoTitle`/`TodoDoDate` — see the style guide below. There is no standalone add-todo component anymore (the old `AddTodo.tsx` was removed) — the "+" affordance lives directly in `TodoList`'s header.

**Cross-list drag-and-drop**: `TodoList` doesn't own a `DndContext` itself (just a `SortableContext` + one `useDroppable` container as an empty-space/empty-list fallback target) — `frontend/src/components/MultiListDndProvider.tsx` is a page-level wrapper (used once per route, wrapping however many `TodoList`s that page renders) that owns the single shared `DndContext`, resolves drops (same-list reorder vs. cross-list move, by inspecting `data.current` on the dnd-kit `active`/`over` — see `TodoDragData`/`ContainerDragData` in `frontend/src/lib/dnd.ts`), and tracks which list is currently hovered so every list can show a `highlighted` (`bg-slate-600`) affordance while something's dragged over it. Same-list reorders call `commitOrder` with `lib/todos.ts`'s `reorderSubset` (reshuffles only the touched list's ids within the full `orderedIds` array); cross-list moves call `handleMoveTodo` with `moveBetweenLists` (removes the id, re-splices it at the exact drop index in the target list's run, and changes `doDate` to match — `null` for the `unscheduled` list id). `frontend/src/lib/date.ts` holds the pure date helpers this all depends on (`todayISO`, `addDays`, `consecutiveDates`, `startOfWeek` — **Monday-aligned**, `threeWeekWindow` for the month view's 3-week/21-cell grid, `isValidDateParam`).

**`SlideSwitcher`** (`frontend/src/components/SlideSwitcher.tsx`) is a generic axis-aware (`x`/`y`) animated transition wrapper, used by `ThreeDayView` (horizontal, ±1 day per arrow click) and `MonthView` (vertical, ±1 week per arrow click — the month view is a rolling 3-week window, not a padded calendar month). It freezes only the *outgoing* snapshot on a `transitionKey` change and slides it out while the live `children` slides in — deliberately never freezes the live content, so data updates that happen without a navigation (e.g. a todo added mid-view) still show up immediately.

Inline editing fields (`TodoTitle`, `TodoDoDate`) each manage their own local edit-mode state and call back up to `TodoList`'s handlers on save — they don't touch the API directly. `TodoDoDate` triggers the native `<input type="date">` picker programmatically via `showPicker()`/`blur()` rather than rendering a visible input, since only a compact label or a calendar icon is ever shown.

UI components come from shadcn (`style: new-york`, `baseColor: zinc`, config in `frontend/components.json`) under `frontend/src/components/ui/`, aliased as `@/*` → `frontend/src/*` (see `vite.config.ts` and `components.json`).

### UI style guide
The app's theme is slate, layered on top of the shadcn/zinc tokens rather than replacing them:
- Page background: `bg-slate-700`.
- Hover effect for interactive controls (title, do-date, drag handle, delete button, checkbox hit-area): `hover:bg-slate-200` — same hue as the page background, but light enough to read against the near-white `Card` rows.
- Drag-hover affordance on a whole `TodoList` (something being dragged over it, not just a plain hover): `bg-slate-600` — a background tint, not a border/ring.
- Checkbox checked state is a green accent (`green-700`), overriding the shadcn default `primary` color for that one state.
- Today's cell in the month grid gets a `border-2 border-slate-500` from its wrapper `div` — still no new color, just the existing slate palette.
- `compact` mode (month-grid cells) scales everything down rather than introducing new tokens: `text-xs` (from `text-sm`), smaller icon-button sizes (`icon-xs` from `icon-sm`, `size-3`/`size-6` from `size-4`/`size-8`), and `TodoDoDate` drops its date-text label entirely (icon-only), since the cell's own day-label header already shows the date.
