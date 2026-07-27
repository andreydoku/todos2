# Todos2

Full-stack todo list app. React + TypeScript + Shadcn + Tailwind on the frontend, TypeScript Lambda functions behind API Gateway on the backend, DynamoDB for storage, all deployed to AWS via CDK.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Shadcn UI, Tailwind CSS v4 |
| Backend | AWS Lambda (TypeScript, Node.js 22) |
| API | AWS API Gateway HTTP API |
| Database | AWS DynamoDB |
| Hosting | AWS S3 + CloudFront |
| Infrastructure | AWS CDK v2 (TypeScript) |

## Project structure

```
todos2/
├── frontend/   # React app
├── backend/    # Lambda handlers
└── infra/      # CDK stack
```

## Environments

Two environments share the same AWS account, each with fully isolated resources:

| Resource | dev | prod |
|---|---|---|
| CloudFormation stack | `Todos2Stack-dev` | `Todos2Stack-prod` |
| DynamoDB table | `Todos2-dev-table` | `Todos2-prod-table` |
| Lambda functions | `Todos2-dev-{name}` | `Todos2-prod-{name}` |
| API Gateway | `Todos2-dev-api` | `Todos2-prod-api` |
| S3 bucket | `todos2-dev-site` | `todos2-prod-site` |

All resources are tagged `Project=Todos2` and `Environment=dev|prod`.

## Prerequisites

- Node.js 22+
- AWS CLI configured with the `todos2-deployer` profile
- CDK bootstrapped in the target account/region (one-time, requires admin credentials)

## Local development

1. Install dependencies:
   ```powershell
   npm install
   ```

2. Configure the local dev proxy by creating `frontend/.env.local`:
   ```
   DEV_API_URL=https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com
   ```
   This file is gitignored. The URL comes from the `Todos2Stack-dev.ApiUrl` CDK output.
   Retrieve it anytime with:
   ```powershell
   aws cloudformation describe-stacks --stack-name Todos2Stack-dev --profile todos2-deployer --query "Stacks[0].Outputs"
   ```

3. Start the dev server:
   ```powershell
   cd frontend
   npm run dev
   ```
   API requests are proxied to the deployed dev environment — no local backend needed.

## Deploying

### First-time deploy (three passes)

Pass 1 — build a placeholder frontend so CDK has a `dist/` folder to upload:
```powershell
cd frontend
npm run build
```

Pass 2 — deploy the stack and capture the API URL from the outputs:
```powershell
cd infra
npx cdk deploy Todos2Stack-dev --profile todos2-deployer
```

Pass 3 — rebuild frontend with the real API URL, then redeploy to sync S3:
```powershell
cd frontend
$env:VITE_API_URL = "https://<ApiUrl from output>"
npm run build

cd infra
npx cdk deploy Todos2Stack-dev --profile todos2-deployer
```

### Subsequent deploys

```powershell
cd frontend
$env:VITE_API_URL = "https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com"
npm run build

cd infra
npx cdk deploy Todos2Stack-dev --profile todos2-deployer
```

### Deploy to prod

```powershell
cd frontend
$env:VITE_API_URL = "https://<prod ApiUrl>"
npm run build

cd infra
npx cdk deploy Todos2Stack-prod --profile todos2-deployer
```

## Tearing down

```powershell
cd infra
npx cdk destroy Todos2Stack-dev --profile todos2-deployer
```
