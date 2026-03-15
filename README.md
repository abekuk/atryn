# ATRYN

*All the Research You Need*

**ATRYN** is an AI-powered research discovery platform for the University of Toronto. Students can chat with an AI assistant to find research opportunities, connect with professors, and submit video introductions.

[**CHECK IT OUT**](https://devpost.com/software/atryn)

## Architecture

<div align="center">

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />

&darr;

<img src="https://img.shields.io/badge/AWS_Amplify-FF9900?style=for-the-badge&logo=awsamplify&logoColor=white" alt="AWS Amplify" />

&darr;

<img src="https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=awslambda&logoColor=white" alt="AWS Lambda" />

&darr;

<img src="https://img.shields.io/badge/Amazon_Bedrock_(Claude_Opus_4.6)-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white" alt="Amazon Bedrock" />
&nbsp;&nbsp;
<img src="https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white" alt="Amazon S3" />
&nbsp;&nbsp;
<img src="https://img.shields.io/badge/Amazon_DynamoDB-4053D6?style=for-the-badge&logo=amazondynamodb&logoColor=white" alt="Amazon DynamoDB" />

</div>

| Layer | Service | Purpose |
|-------|---------|---------|
| **Frontend** | Next.js 16, Tailwind CSS, Framer Motion | Chat interface, lab browsing, video recording |
| **Hosting** | AWS Amplify | Production deployment |
| **Compute** | AWS Lambda | Serverless API handlers |
| **AI** | Amazon Bedrock (Claude Opus 4.6) | Conversational research discovery via Converse API |
| **Storage** | Amazon S3 | Video introduction uploads |
| **Database** | Amazon DynamoDB | Labs, users, submissions |

## Tech Stack

| Technology | Usage |
|------------|-------|
| **Next.js 16** | App Router, TypeScript, API routes |
| **Tailwind CSS** | Styling with `#1E3765` primary color |
| **Framer Motion** | Page transitions and animations |
| **shadcn/ui** | UI component library (Radix + CVA) |
| **Amazon Bedrock** | Claude Opus 4.6 via Converse API |
| **Amazon S3** | Video file storage with public read |
| **Amazon DynamoDB** | Managed NoSQL database |
| **Lucide React** | Icons |

## Getting Started

### Prerequisites

- **Node.js 18+**
- **npm**
- **AWS CLI v2** (for Bedrock and S3)

### 1. Clone and install

```bash
git clone https://github.com/pierceluu10/research.git
cd research/frontend
npm install
```

### 2. Set up AWS credentials

Create `frontend/.env.local` with your AWS credentials. To run without AWS, set `MOCK_AI=true`.

### 3. Enable Bedrock model access

1. Open **AWS Console > Amazon Bedrock > Model access**
2. Enable **Anthropic Claude Opus 4.6**
3. If your IAM role lacks permissions, attach the policy in `bedrock-policy.json`

### 4. Create S3 bucket (for video uploads)

```bash
aws s3 mb s3://atryn-videos --region us-west-2
```

See `infrastructure/` for CORS and bucket policy configs.

### 5. Run the app

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

