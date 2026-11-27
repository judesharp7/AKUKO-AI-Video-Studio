# AKUKO AI Video Studio - Deployment Plan

## Overview

This deployment plan outlines the strategy for deploying AKUKO AI Video Studio from development through production, ensuring reliable, scalable, and secure operations.

---

## Architecture Overview

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Vercel     │  │ Trigger.dev  │  │  CloudRun/   │          │
│  │   (Web App)  │  │   (Jobs)     │  │   Fly.io     │          │
│  │              │  │              │  │  (FFmpeg)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Supabase    │  │ Cloudflare   │  │   External   │          │
│  │  (Database,  │  │     R2       │  │   Services   │          │
│  │   Auth, RT)  │  │  (Storage)   │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

External Services:
- Anthropic API (LLM)
- ElevenLabs (Voice)
- fal/Higgsfield (Video models)
- Paystack/Stripe (Payments)
- Sentry (Errors)
- PostHog (Analytics)
```

---

## Environment Strategy

### Development Environment
- **Purpose**: Local development and testing
- **Hosting**: Local machine with ngrok for webhooks
- **Database**: Local Supabase instance or development project
- **Storage**: Development R2 bucket
- **URL**: `http://localhost:3000`

### Staging Environment
- **Purpose**: Pre-production testing, QA, UAT
- **Hosting**: Vercel preview deployments
- **Database**: Staging Supabase project
- **Storage**: Staging R2 bucket
- **URL**: `https://akuko-staging.vercel.app`

### Production Environment
- **Purpose**: Live application serving real users
- **Hosting**: Vercel production deployment
- **Database**: Production Supabase project
- **Storage**: Production R2 bucket
- **URL**: `https://akuko.ai` (or configured domain)

---

## Prerequisites

### Required Accounts & Services

- [ ] GitHub account with repository access
- [ ] Vercel account (Pro plan recommended for team features)
- [ ] Supabase account (Pro plan for production)
- [ ] Cloudflare account with R2 access
- [ ] Trigger.dev account
- [ ] Anthropic API account
- [ ] ElevenLabs account
- [ ] fal.ai or Higgsfield account
- [ ] Paystack account (for Nigeria)
- [ ] Stripe account (for international)
- [ ] Sentry account
- [ ] PostHog account
- [ ] Google Cloud Console (for OAuth)
- [ ] Domain name (optional, can use vercel.app subdomain)

### Required Tools

- [ ] Node.js 20+ LTS
- [ ] npm or yarn
- [ ] Git
- [ ] Vercel CLI (`npm i -g vercel`)
- [ ] Supabase CLI (`npm i -g supabase`)
- [ ] Docker (for FFmpeg worker)

---

## Step-by-Step Deployment Guide

### Phase 1: Repository Setup

#### 1.1 Initialize Repository

```bash
# Repository already initialized
# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: AKUKO AI Video Studio setup"

# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/akuko-ai-video-studio.git

# Push to GitHub
git push -u origin main
```

#### 1.2 Branch Strategy

```
main          → Production deployments
├── develop   → Staging deployments
│   ├── feature/character-studio
│   ├── feature/story-generation
│   ├── feature/scene-builder
│   └── feature/video-editor
```

**Branch Protection Rules (main)**:
- Require pull request before merging
- Require 1 approval
- Require status checks to pass
- Require branches to be up to date

---

### Phase 2: Supabase Setup

#### 2.1 Create Supabase Projects

**Development Project**:
1. Go to https://supabase.com
2. Create new project: `akuko-dev`
3. Note: Project URL, anon key, service role key

**Staging Project**:
1. Create new project: `akuko-staging`
2. Note: Project URL, anon key, service role key

**Production Project**:
1. Create new project: `akuko-production`
2. Note: Project URL, anon key, service role key

#### 2.2 Database Schema Deployment

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Push database migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts
```

#### 2.3 Configure Authentication

**Enable Providers**:
1. Go to Authentication → Providers
2. Enable Email provider
   - Enable email confirmations
   - Set email templates
3. Enable Google provider
   - Create OAuth credentials in Google Cloud Console
   - Add authorized redirect URLs

**Configure Settings**:
- Set site URL
- Add additional redirect URLs
- Configure email templates

#### 2.4 Row-Level Security (RLS) Policies

Execute the following SQL in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- User can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Repeat for all entities...
```

---

### Phase 3: Cloudflare R2 Setup

#### 3.1 Create R2 Buckets

**Development**:
1. Go to R2 in Cloudflare dashboard
2. Create bucket: `akuko-dev-assets`
3. Note: Bucket name, account ID

**Staging**:
1. Create bucket: `akuko-staging-assets`

**Production**:
1. Create bucket: `akuko-production-assets`

#### 3.2 Generate API Tokens

1. Go to My Profile → API Tokens
2. Create custom token with R2 permissions
3. Note: Access Key ID, Secret Access Key

#### 3.3 Configure CORS

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://akuko-staging.vercel.app", "https://akuko.ai"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

### Phase 4: Trigger.dev Setup

#### 4.1 Create Trigger.dev Projects

1. Go to https://cloud.trigger.dev
2. Create organization: `AKUKO`
3. Create projects for each environment:
   - `akuko-dev`
   - `akuko-staging`
   - `akuko-production`

#### 4.2 Configure Environment Variables

Add the following in Trigger.dev dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ELEVENLABS_API_KEY`
- `FAL_API_KEY` or `HIGGSFIELD_API_KEY`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ACCOUNT_ID`

---

### Phase 5: External Services Setup

#### 5.1 Anthropic API

1. Go to https://console.anthropic.com
2. Create API key
3. Set usage limits and alerts

#### 5.2 ElevenLabs

1. Go to https://elevenlabs.io
2. Create API key
3. Configure voice cloning if needed
4. Test Nigerian English voices

#### 5.3 fal.ai / Higgsfield

**fal.ai**:
1. Go to https://fal.ai
2. Create account and API key
3. Test video model endpoints

**Higgsfield** (alternative):
1. Go to https://higgsfield.ai
2. Create account and API key
3. Configure webhook endpoints

#### 5.4 Payment Providers

**Paystack** (Nigeria):
1. Go to https://paystack.com
2. Create business account
3. Get public and secret keys
4. Configure webhook URL

**Stripe** (International):
1. Go to https://stripe.com
2. Create account
3. Get API keys
4. Configure webhook URL

#### 5.5 Observability

**Sentry**:
1. Go to https://sentry.io
2. Create projects for each environment
3. Note DSN for each project

**PostHog**:
1. Go to https://posthog.com
2. Create project
3. Note API key and host

---

### Phase 6: Vercel Deployment

#### 6.1 Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

#### 6.2 Configure Environment Variables

In Vercel dashboard, add environment variables:

```bash
# Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Storage
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=akuko-production-assets
R2_ACCOUNT_ID=xxx
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# AI Providers
ANTHROPIC_API_KEY=xxx
ELEVENLABS_API_KEY=xxx
FAL_API_KEY=xxx

# Payments
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=xxx
PAYSTACK_SECRET_KEY=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx

# Observability
NEXT_PUBLIC_SENTRY_DSN=xxx
SENTRY_AUTH_TOKEN=xxx
NEXT_PUBLIC_POSTHOG_KEY=xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Trigger.dev
TRIGGER_SECRET_KEY=xxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://akuko.ai
NEXT_PUBLIC_APP_NAME=AKUKO AI Video Studio
```

#### 6.3 Configure Domain (Optional)

1. Go to Settings → Domains in Vercel
2. Add your domain (e.g., `akuko.ai`)
3. Configure DNS records
4. Enable HTTPS (automatic with Vercel)

#### 6.4 Configure Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  }
}
```

---

### Phase 7: FFmpeg Worker Deployment

#### 7.1 Build Docker Image

```dockerfile
# Dockerfile
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["npm", "start"]
```

```bash
# Build image
docker build -t akuko-ffmpeg-worker .

# Test locally
docker run -p 3001:3001 akuko-ffmpeg-worker
```

#### 7.2 Deploy to CloudRun (Google Cloud)

```bash
# Set project
gcloud config set project akuko-production

# Submit build
gcloud builds submit --tag gcr.io/akuko-production/ffmpeg-worker

# Deploy to CloudRun
gcloud run deploy ffmpeg-worker \
  --image gcr.io/akuko-production/ffmpeg-worker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "R2_ACCESS_KEY_ID=xxx,R2_SECRET_ACCESS_KEY=xxx,..."
```

#### 7.3 Alternative: Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly apps create akuko-ffmpeg-worker

# Deploy
fly deploy

# Set secrets
fly secrets set R2_ACCESS_KEY_ID=xxx
fly secrets set R2_SECRET_ACCESS_KEY=xxx
# ... etc
```

---

### Phase 8: CI/CD Pipeline Setup

#### 8.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    types: [opened, synchronize, reopened]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test

  deploy-staging:
    needs: lint-and-test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

#### 8.2 Database Migration Workflow

Create `.github/workflows/migrate.yml`:

```yaml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to migrate'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        run: npm install -g supabase
      
      - name: Link project
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Push migrations
        run: supabase db push
```

---

### Phase 9: Monitoring & Alerting

#### 9.1 Sentry Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### 9.2 PostHog Configuration

```typescript
// lib/posthog.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}
```

#### 9.3 Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  };

  return NextResponse.json(health);
}
```

#### 9.4 Set Up Alerts

**Sentry Alerts**:
- New error detected
- Error rate above threshold

**Vercel Alerts**:
- Deployment failed
- Function error rate high

**Custom Monitoring**:
- Credit balance low alert
- Failed scene generation rate
- Provider API errors

---

### Phase 10: Backup & Disaster Recovery

#### 10.1 Database Backups

**Automated Backups** (Supabase Pro):
- Daily backups retained for 7 days
- Point-in-time recovery enabled

**Manual Backup Procedure**:
```bash
# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Store in R2
aws s3 cp backup_$(date +%Y%m%d).sql s3://akuko-backups/
```

#### 10.2 Asset Backup Strategy

R2 bucket replication:
1. Enable cross-region replication
2. Configure lifecycle policies
3. Set up backup bucket

#### 10.3 Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 1 hour
**RPO (Recovery Point Objective)**: 1 hour

**Recovery Steps**:
1. Restore database from backup
2. Reconfigure environment variables
3. Redeploy application
4. Verify integrations
5. Test critical flows

---

### Phase 11: Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Configure CSP headers
- [ ] Set up rate limiting
- [ ] Enable CSRF protection
- [ ] Configure CORS properly
- [ ] Enable Supabase RLS
- [ ] Rotate API keys regularly
- [ ] Set up secrets scanning
- [ ] Enable 2FA on all accounts
- [ ] Configure webhook signature verification
- [ ] Set up content moderation
- [ ] Enable abuse prevention measures

---

### Phase 12: Launch Checklist

#### Pre-Launch

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Authentication tested
- [ ] Payment flows tested
- [ ] Video generation tested end-to-end
- [ ] Export functionality verified
- [ ] Error tracking active
- [ ] Analytics tracking active
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Accessibility audit passed
- [ ] Mobile responsiveness verified
- [ ] Load testing completed
- [ ] Backup procedures tested
- [ ] Team trained on monitoring

#### Launch Day

- [ ] Final deployment to production
- [ ] DNS propagated
- [ ] SSL certificate active
- [ ] All services accessible
- [ ] Test user sign-up flow
- [ ] Test video creation flow
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Team on standby

#### Post-Launch

- [ ] Monitor user activity
- [ ] Track key metrics
- [ ] Gather user feedback
- [ ] Address critical issues
- [ ] Plan iteration based on feedback

---

## Cost Estimates

### Monthly Infrastructure Costs (Production)

| Service | Plan | Estimated Cost |
|---------|------|----------------|
| Vercel | Pro | $20/month |
| Supabase | Pro | $25/month |
| Cloudflare R2 | Usage-based | ~$15/month |
| Trigger.dev | Team | $29/month |
| CloudRun/Fly.io | Usage-based | ~$50/month |
| Sentry | Team | $26/month |
| PostHog | Open Source (self-host) | $0 |
| Domain | - | $12/year |
| **Total** | - | **~$165/month** |

### AI Provider Costs (Variable)

Based on usage:
- Anthropic API: ~$0.003 per 1K tokens
- ElevenLabs: ~$0.30 per 1K characters
- Video models: $0.02-$0.40 per second

---

## Support & Escalation

### Monitoring Responsibilities

**Level 1 (Automated)**:
- Error alerts → Sentry
- Performance alerts → Vercel
- Uptime monitoring → Better Uptime

**Level 2 (On-call Engineer)**:
- Investigate alerts
- Respond to incidents
- Escalate if needed

**Level 3 (Team Lead)**:
- Architecture decisions
- Major incidents
- Vendor relationships

### Incident Response

1. **Identify**: Alert triggered
2. **Investigate**: Check logs, metrics
3. **Mitigate**: Apply fix or rollback
4. **Resolve**: Confirm issue resolved
5. **Post-mortem**: Document learnings

---

## Contact Information

- **Project Lead**: Ani Jude Uchenna (aniuchennajude@gmail.com)
- **GitHub Repository**: https://github.com/YOUR_USERNAME/akuko-ai-video-studio

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-11-24 | Ani Jude Uchenna | Initial deployment plan |

---

**Next Steps**: Follow the step-by-step guide above to deploy AKUKO AI Video Studio to production.
