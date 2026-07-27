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
`backend/src/handlers/*.ts` are thin, independent `APIGatewayProxyHandlerV2` functions (`getTodos`, `createTodo`, `updateTodo`, `deleteTodo`, `getOrder`, `updateOrder`), each importing the shared DynamoDB Document Client from `backend/src/db.ts` and the key helpers/constants from `backend/src/types.ts`. `updateTodo` builds its `UpdateExpression` dynamically from whichever of `title` / `completed` / `doDate` are present in the body (`doDate: null` triggers a `REMOVE` instead of `SET`). Existence checks use `ConditionExpression: 'attribute_exists(PK)'` and catch `ConditionalCheckFailedException` to return 404 on update/delete.

### Infra — `infra/lib/todos-stack.ts`
One CDK stack (`Todos2Stack`) wires: DynamoDB table (single-table, pay-per-request) → 6 `NodejsFunction` Lambdas (one per handler, minified esbuild bundling, least-privilege `grantReadData`/`grantWriteData`/`grantReadWriteData` per handler) → HTTP API Gateway routes → S3 bucket + CloudFront distribution serving `frontend/dist` via `BucketDeployment` (which also invalidates CloudFront on deploy). SPA routing is handled by mapping 403/404 back to `/index.html`.

### Frontend — state lives in `TodoList`, editing is inline per-field
`TodoList.tsx` is the only component that talks to the API (`frontend/src/api.ts`) or holds the `todos`/`orderedIds` state; it passes callbacks (`onToggle`, `onRename`, `onSetDoDate`, `onDelete`) down to `TodoItem`, which is purely presentational plus drag handle (`@dnd-kit/sortable`). Todos and their order are fetched in parallel on mount and merged client-side via `applyOrder`; any add/delete/reorder writes both the todo mutation and a full `PUT /order` to keep the order list in sync.

Inline editing fields (`TodoTitle`, `TodoDoDate`) each manage their own local edit-mode state and call back up to `TodoList`'s handlers on save — they don't touch the API directly. `TodoDoDate` triggers the native `<input type="date">` picker programmatically via `showPicker()`/`blur()` rather than rendering a visible input, since only a compact label or a calendar icon is ever shown.

UI components come from shadcn (`style: new-york`, `baseColor: zinc`, config in `frontend/components.json`) under `frontend/src/components/ui/`, aliased as `@/*` → `frontend/src/*` (see `vite.config.ts` and `components.json`).
