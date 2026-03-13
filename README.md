# ATRYN

An AI-powered chatbot that helps university students discover relevant labs, professors, campus services, and opportunities based on their interests. Built with Next.js, Tailwind CSS, and AWS.

## Architecture

**Frontend:** Next.js 14 (App Router, TypeScript) with Tailwind CSS, deployed on AWS Amplify
**Backend:** AWS Lambda functions behind Amazon API Gateway
**Database:** Amazon DynamoDB (with local seed data fallback)
**AI:** Amazon Bedrock (Claude) for personalized summaries, Q&A, and email drafting
**Auth:** Amazon Cognito (scaffolded — guest mode for MVP)
**Monitoring:** Amazon CloudWatch

## Quick Start (Local Development)

The app runs fully locally in **mock mode** — no AWS account needed.

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Install frontend dependencies
cd frontend
npm install

# Copy environment template
cp .env.local.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Mock mode is on by default — the app uses the seed dataset in `data/seed-resources.json` and stubs AI responses.

## Project Structure

```
├── frontend/                 # Next.js app
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── chat/page.tsx     # Chat interface
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles + fonts
│   ├── components/
│   │   ├── ChatMessage.tsx   # Chat bubble component
│   │   ├── ResourceCard.tsx  # Result card component
│   │   ├── ResourceDetail.tsx# Detail panel with Q&A + email drafting
│   │   └── SuggestionChips.tsx
│   ├── lib/
│   │   └── api.ts            # API client (mock + real modes)
│   └── types/
│       └── index.ts          # Shared TypeScript types
├── backend/
│   ├── lambdas/
│   │   ├── chat/             # POST /chat
│   │   ├── search/           # POST /search
│   │   ├── detail/           # GET /resource/{id}
│   │   ├── ask/              # POST /resource/{id}/ask
│   │   └── email-draft/      # POST /resource/{id}/draft-email
│   └── shared/
│       ├── types.ts          # Backend types
│       ├── search.ts         # Keyword-based search/ranking
│       ├── bedrock.ts        # Bedrock integration + mock fallback
│       ├── data.ts           # DynamoDB + seed data access
│       └── prompts.ts        # Prompt templates
├── data/
│   └── seed-resources.json   # 25 curated sample records
├── infrastructure/
│   ├── dynamodb-schema.json  # DynamoDB table definition
│   └── api-contract.json     # API request/response examples
├── external.md               # AWS deployment instructions (manual steps)
└── README.md
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/chat` | Send a message, get response + result cards |
| POST | `/search` | Search resources by query and category |
| GET | `/resource/{id}` | Get full resource details |
| POST | `/resource/{id}/ask` | Ask a question about a resource |
| POST | `/resource/{id}/draft-email` | Generate outreach email draft |

See `infrastructure/api-contract.json` for request/response examples.

## Seed Data

25 curated records across categories:
- **Campus Services:** Academic advising, counseling, career office, accessibility, writing center, international services
- **Labs:** Machine learning, robotics, HCI, biomedical computing, cybersecurity
- **Professors:** Dr. Chen (ML), Dr. Park (Robotics), Dr. Patel (HCI), Dr. Torres (Biomedical), Dr. Vasquez (Security)
- **Opportunities:** Research fellowships, startup incubator, hackathon, TA positions, summer REU
- **Student Groups:** ACM, WiCS, Robotics Club, Data Science Society, Enactus

All records are sample data for demo purposes.

## Environment Variables

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | (empty) | API Gateway URL. Empty = mock mode |

### Backend (Lambda env vars)
| Variable | Default | Description |
|----------|---------|-------------|
| `MOCK_AI` | `true` | Stub Bedrock responses |
| `USE_DYNAMO` | `false` | Read from DynamoDB vs seed JSON |
| `AWS_REGION` | `us-east-1` | AWS region |
| `DYNAMO_TABLE` | `CampusResources` | DynamoDB table name |
| `BEDROCK_MODEL_ID` | `anthropic.claude-opus-4-6-v1` | Bedrock model |

## AWS Deployment

See **[external.md](./external.md)** for step-by-step AWS setup instructions covering:
- DynamoDB table creation and seeding
- Bedrock model access
- Lambda deployment
- API Gateway configuration
- Amplify frontend hosting
- CloudWatch monitoring

## What's Implemented vs Scaffolded

### Fully Implemented
- Landing page with hero, features, and how-it-works sections
- Chat interface with message history, suggestion chips, and loading states
- Resource cards rendered inline in chat
- Resource detail panel with info grid, topics, Q&A, and email drafting
- Keyword search and ranking algorithm
- Mock mode for all API calls (works offline)
- Seed dataset with 25 records
- All 5 Lambda handlers
- Bedrock integration with mock fallback
- Prompt templates for all AI modes
- DynamoDB schema and data access layer

### Scaffolded / Future Work
- Cognito authentication (guest mode active)
- Real Bedrock calls (mock mode by default)
- DynamoDB read path (seed JSON fallback active)
- CloudWatch dashboard setup
- Conversation persistence across sessions
- Embedding-based semantic search

## Tech Stack

- **Next.js 14** — App Router, TypeScript
- **Tailwind CSS** — Styling with #1E3765 primary color, DM Serif Display font
- **AWS Lambda** — Serverless backend
- **Amazon API Gateway** — REST API
- **Amazon DynamoDB** — NoSQL database
- **Amazon Bedrock** — AI/LLM layer (Claude via Converse API)
- **AWS Amplify** — Frontend hosting
- **Amazon CloudWatch** — Monitoring
