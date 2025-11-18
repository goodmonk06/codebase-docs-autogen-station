import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with Phase 3 features...');

  // Clear existing data (including Phase 3 entities)
  await prisma.analysisMetrics.deleteMany();
  await prisma.analysisComparison.deleteMany();
  await prisma.notificationConfig.deleteMany();
  await prisma.repoTag.deleteMany();
  await prisma.scheduledAnalysis.deleteMany();
  await prisma.generatedArtifact.deleteMany();
  await prisma.analysisRun.deleteMany();
  await prisma.analysisTemplate.deleteMany();
  await prisma.repoConfig.deleteMany();

  console.log('✅ Cleared existing data');

  // Create Analysis Templates
  const standardTemplate = await prisma.analysisTemplate.create({
    data: {
      name: 'Standard Analysis',
      description: 'Comprehensive analysis covering architecture, APIs, and general documentation',
      focusAreas: ['architecture', 'api', 'dependencies', 'testing'],
      diagramStyle: 'standard',
      includeMetrics: true,
      isPublic: true,
      createdBy: 'system',
    },
  });

  const microservicesTemplate = await prisma.analysisTemplate.create({
    data: {
      name: 'Microservices Deep Dive',
      description: 'Focused analysis for microservices architecture with emphasis on service boundaries',
      focusAreas: ['services', 'communication', 'data-flow', 'deployment'],
      architecturePrompt: `Analyze this codebase as a microservices system. Focus on:
1. Service boundaries and responsibilities
2. Inter-service communication patterns (REST, gRPC, message queues)
3. Data ownership and consistency patterns
4. Service discovery and configuration
5. Deployment and orchestration approach
Create a detailed architecture document with service diagrams.`,
      apiPrompt: `Document the APIs for this microservices system, including:
1. Service endpoints and their purposes
2. Request/response schemas
3. Authentication and authorization between services
4. API versioning strategy
5. Error handling and circuit breakers`,
      diagramStyle: 'detailed',
      includeMetrics: true,
      isPublic: true,
      createdBy: 'system',
    },
  });

  const securityTemplate = await prisma.analysisTemplate.create({
    data: {
      name: 'Security Audit',
      description: 'Security-focused analysis identifying potential vulnerabilities and security patterns',
      focusAreas: ['authentication', 'authorization', 'data-protection', 'vulnerabilities'],
      architecturePrompt: `Analyze this codebase from a security perspective:
1. Authentication and authorization mechanisms
2. Data encryption (at rest and in transit)
3. Input validation and sanitization
4. OWASP Top 10 considerations
5. Security dependencies and known vulnerabilities
6. Secrets management approach`,
      diagramStyle: 'standard',
      includeMetrics: true,
      isPublic: true,
      createdBy: 'security-team',
    },
  });

  const quickStartTemplate = await prisma.analysisTemplate.create({
    data: {
      name: 'Quick Start Guide',
      description: 'Lightweight analysis focused on getting developers up and running quickly',
      focusAreas: ['setup', 'configuration', 'common-tasks'],
      readmePrompt: `Create a developer-focused Quick Start guide including:
1. Prerequisites and system requirements
2. Quick installation (under 5 minutes)
3. Running the project locally
4. Common development tasks
5. Troubleshooting common issues
6. Where to get help
Keep it concise and action-oriented.`,
      diagramStyle: 'minimal',
      includeMetrics: false,
      isPublic: true,
      createdBy: 'devex-team',
    },
  });

  console.log('✅ Created 4 analysis templates');

  // Create Scheduled Analyses
  const dailySchedule = await prisma.scheduledAnalysis.create({
    data: {
      cronExpression: '0 2 * * *', // 2 AM daily
      enabled: true,
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
      timezone: 'UTC',
      notifyOn: 'failure',
    },
  });

  const weeklySchedule = await prisma.scheduledAnalysis.create({
    data: {
      cronExpression: '0 0 * * 0', // Sunday midnight
      enabled: true,
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // Next week
      timezone: 'America/New_York',
      notifyOn: 'all',
    },
  });

  console.log('✅ Created 2 scheduled analyses');

  // Create Notification Configs
  await prisma.notificationConfig.create({
    data: {
      userId: 'admin@example.com',
      channel: 'slack',
      enabled: true,
      events: ['analysis.completed', 'analysis.failed'],
      destination: 'https://hooks.slack.com/services/EXAMPLE',
      metadata: JSON.stringify({ channel: '#engineering' }),
    },
  });

  await prisma.notificationConfig.create({
    data: {
      channel: 'email',
      enabled: true,
      events: ['analysis.failed'],
      destination: 'devops@example.com',
    },
  });

  console.log('✅ Created 2 notification configs');

  // Create demo repositories with Phase 3 fields
  const demoRepos = [
    {
      name: 'microservices-platform',
      githubUrl: 'https://github.com/example/microservices-platform.git',
      mainLanguage: 'TypeScript',
      description: 'Enterprise microservices platform with multiple services',
      isArchived: false,
      lastAnalyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      templateId: microservicesTemplate.id,
      scheduleId: dailySchedule.id,
    },
    {
      name: 'react-dashboard',
      githubUrl: 'https://github.com/example/react-dashboard.git',
      mainLanguage: 'JavaScript',
      description: 'Modern React admin dashboard with real-time analytics',
      isArchived: false,
      lastAnalyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      templateId: standardTemplate.id,
      scheduleId: weeklySchedule.id,
    },
    {
      name: 'fastify-rest-api',
      githubUrl: 'https://github.com/fastify/fastify.git',
      mainLanguage: 'TypeScript',
      description: 'High-performance REST API built with Fastify',
      isArchived: false,
      lastAnalyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      templateId: securityTemplate.id,
    },
    {
      name: 'python-ml-pipeline',
      localPath: '/workspace/ml-projects/recommendation-engine',
      mainLanguage: 'Python',
      description: 'Machine learning pipeline for recommendation system',
      isArchived: false,
      lastAnalyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      templateId: standardTemplate.id,
    },
    {
      name: 'legacy-monolith',
      githubUrl: 'https://github.com/example/legacy-app.git',
      mainLanguage: 'Java',
      description: 'Legacy monolithic application (archived for reference)',
      isArchived: true,
      lastAnalyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    },
  ];

  const createdRepos: any[] = [];

  for (const repoData of demoRepos) {
    const repo = await prisma.repoConfig.create({
      data: repoData,
    });

    createdRepos.push(repo);
    console.log(`✅ Created repo: ${repo.name}`);

    // Add tags to repositories
    const tagsByRepo: Record<string, Array<{ tag: string; category: string; color: string }>> = {
      'microservices-platform': [
        { tag: 'backend', category: 'domain', color: '#3B82F6' },
        { tag: 'production', category: 'team', color: '#10B981' },
        { tag: 'high-priority', category: 'general', color: '#EF4444' },
        { tag: 'typescript', category: 'language', color: '#3178C6' },
      ],
      'react-dashboard': [
        { tag: 'frontend', category: 'domain', color: '#8B5CF6' },
        { tag: 'design-system', category: 'project', color: '#F59E0B' },
        { tag: 'javascript', category: 'language', color: '#F7DF1E' },
      ],
      'fastify-rest-api': [
        { tag: 'backend', category: 'domain', color: '#3B82F6' },
        { tag: 'api', category: 'domain', color: '#06B6D4' },
        { tag: 'security-reviewed', category: 'general', color: '#10B981' },
        { tag: 'typescript', category: 'language', color: '#3178C6' },
      ],
      'python-ml-pipeline': [
        { tag: 'ml', category: 'domain', color: '#EC4899' },
        { tag: 'data-science', category: 'team', color: '#8B5CF6' },
        { tag: 'python', category: 'language', color: '#3776AB' },
      ],
      'legacy-monolith': [
        { tag: 'archived', category: 'general', color: '#6B7280' },
        { tag: 'java', category: 'language', color: '#007396' },
      ],
    };

    const repoTags = tagsByRepo[repo.name] || [];
    for (const tagData of repoTags) {
      await prisma.repoTag.create({
        data: {
          repoId: repo.id,
          ...tagData,
        },
      });
    }

    if (repoTags.length > 0) {
      console.log(`  ✅ Added ${repoTags.length} tags to ${repo.name}`);
    }
  }

  // Create comprehensive analysis runs with Phase 3 features
  const microservicesRepo = createdRepos[0];
  const reactRepo = createdRepos[1];
  const fastifyRepo = createdRepos[2];

  // Run 1: Completed run for microservices-platform (current)
  const run1StartTime = Date.now() - 1000 * 60 * 8; // Started 8 minutes ago
  const run1EndTime = Date.now() - 1000 * 60 * 3; // Ended 3 minutes ago
  const run1Duration = run1EndTime - run1StartTime;

  const run1 = await prisma.analysisRun.create({
    data: {
      repoId: microservicesRepo.id,
      refName: 'main',
      status: 'completed',
      templateId: microservicesTemplate.id,
      startedAt: new Date(run1StartTime),
      finishedAt: new Date(run1EndTime),
      durationMs: run1Duration,
      filesScanned: 342,
      linesScanned: 45230,
      triggeredBy: 'schedule',
      retryCount: 0,
      artifactsJson: JSON.stringify({
        modules: 28,
        services: 8,
        dependencies: { production: 42, development: 28 },
      }),
    },
  });

  console.log(`✅ Created completed run for ${microservicesRepo.name}`);

  // Create metrics for run1
  const run1Metrics = [
    { metricName: 'scan_duration_ms', metricValue: 45000, unit: 'ms' },
    { metricName: 'llm_duration_ms', metricValue: 180000, unit: 'ms' },
    { metricName: 'total_duration_ms', metricValue: run1Duration, unit: 'ms' },
    { metricName: 'files_scanned', metricValue: 342, unit: 'count' },
    { metricName: 'lines_scanned', metricValue: 45230, unit: 'count' },
    { metricName: 'modules_found', metricValue: 28, unit: 'count' },
    { metricName: 'services_found', metricValue: 8, unit: 'count' },
    { metricName: 'dependencies_total', metricValue: 70, unit: 'count' },
  ];

  for (const metric of run1Metrics) {
    await prisma.analysisMetrics.create({
      data: {
        runId: run1.id,
        ...metric,
      },
    });
  }

  console.log(`  ✅ Created ${run1Metrics.length} metrics for run`);

  // Create artifacts for run1
  const run1Artifacts = [
    {
      type: 'arch_doc',
      path: 'architecture.md',
      version: 2,
      wordCount: 1850,
      changesSummary: 'Added service boundary details and communication patterns',
      content: `# Microservices Platform - Architecture Overview

## System Overview

This is an enterprise-grade microservices platform built with Node.js and TypeScript, designed to handle high-throughput e-commerce operations.

## Architecture Pattern

**Pattern**: Microservices Architecture with Event-Driven Communication

The system follows a distributed microservices pattern with 8 independent services, each owning its data and communicating through both synchronous REST APIs and asynchronous message queues.

## Core Services

### 1. **API Gateway Service**
- **Responsibility**: Request routing, authentication, rate limiting
- **Technology**: Express.js with JWT authentication
- **Endpoints**: Routes traffic to appropriate backend services

### 2. **User Service**
- **Responsibility**: User management, authentication, profiles
- **Database**: PostgreSQL
- **Events Emitted**: user.created, user.updated, user.deleted

### 3. **Product Catalog Service**
- **Responsibility**: Product information, inventory, categories
- **Database**: PostgreSQL with Redis cache
- **Events Emitted**: product.created, product.updated, inventory.changed

### 4. **Order Service**
- **Responsibility**: Order processing, order history
- **Database**: PostgreSQL
- **Events Consumed**: payment.completed, inventory.reserved
- **Events Emitted**: order.created, order.completed, order.cancelled

### 5. **Payment Service**
- **Responsibility**: Payment processing, transaction records
- **Integrations**: Stripe, PayPal
- **Events Emitted**: payment.initiated, payment.completed, payment.failed

### 6. **Notification Service**
- **Responsibility**: Email, SMS, push notifications
- **Integrations**: SendGrid, Twilio, Firebase
- **Events Consumed**: order.*, user.*, payment.*

### 7. **Analytics Service**
- **Responsibility**: Metrics collection, reporting
- **Database**: ClickHouse (time-series data)
- **Events Consumed**: All domain events

### 8. **Search Service**
- **Responsibility**: Full-text search, recommendations
- **Database**: Elasticsearch
- **Events Consumed**: product.*, order.*

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5.x
- **Framework**: Fastify (high-performance HTTP)
- **Message Queue**: RabbitMQ
- **Databases**: PostgreSQL, Redis, Elasticsearch, ClickHouse
- **Observability**: Prometheus, Grafana, Jaeger
- **Deployment**: Docker, Kubernetes

## Data Flow

### Synchronous Flow (REST)
\`\`\`
Client → API Gateway → Service → Database → Response
\`\`\`

### Asynchronous Flow (Events)
\`\`\`
Service A → RabbitMQ → Service B
          → Service C (fan-out pattern)
          → Service D
\`\`\`

### Order Processing Flow
1. Client places order via API Gateway
2. Order Service validates and creates order record
3. Order Service publishes \`order.created\` event
4. Inventory Service reserves stock
5. Payment Service processes payment
6. Payment Service publishes \`payment.completed\` event
7. Order Service marks order as paid
8. Notification Service sends confirmation email
9. Analytics Service records transaction

## Key Design Decisions

### 1. **Database per Service**
Each service owns its data schema to ensure loose coupling and independent deployment.

### 2. **Event Sourcing for Orders**
Order state changes are tracked as events for audit trail and recovery.

### 3. **CQRS for Product Catalog**
Write operations go to PostgreSQL, reads served from Elasticsearch for performance.

### 4. **Circuit Breakers**
All inter-service calls use circuit breakers (Opossum library) to prevent cascade failures.

### 5. **API Versioning**
URL-based versioning (e.g., /v1/products, /v2/products) for backward compatibility.

### 6. **Distributed Tracing**
All requests carry correlation IDs and are traced through Jaeger.

## Deployment Architecture

\`\`\`
[Internet] → [Load Balancer] → [Kubernetes Cluster]
                                  ├─ API Gateway (3 replicas)
                                  ├─ User Service (2 replicas)
                                  ├─ Product Service (3 replicas)
                                  ├─ Order Service (3 replicas)
                                  ├─ Payment Service (2 replicas)
                                  ├─ Notification Service (2 replicas)
                                  ├─ Analytics Service (1 replica)
                                  └─ Search Service (2 replicas)
\`\`\`

## Security

- **Authentication**: JWT tokens issued by API Gateway
- **Authorization**: Role-based access control (RBAC)
- **Service-to-Service**: mTLS with service mesh (Istio)
- **Data Encryption**: TLS in transit, AES-256 at rest
- **Secrets**: Managed by Kubernetes Secrets + HashiCorp Vault
`,
    },
    {
      type: 'api_doc',
      path: 'api-docs.md',
      version: 2,
      wordCount: 1200,
      changesSummary: 'Added authentication details and error response examples',
      content: `# Microservices Platform - API Documentation

## API Overview

This platform exposes RESTful APIs through an API Gateway at \`https://api.example.com/v1\`.

## Authentication

All API requests require a JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <jwt-token>
\`\`\`

To obtain a token:

\`\`\`bash
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
\`\`\`

Response:
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
\`\`\`

## User Service API

### Create User
\`\`\`bash
POST /v1/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
\`\`\`

### Get User Profile
\`\`\`bash
GET /v1/users/:userId
\`\`\`

### Update User
\`\`\`bash
PATCH /v1/users/:userId
Content-Type: application/json

{
  "firstName": "Jane"
}
\`\`\`

## Product Catalog API

### List Products
\`\`\`bash
GET /v1/products?page=1&limit=20&category=electronics
\`\`\`

### Get Product Details
\`\`\`bash
GET /v1/products/:productId
\`\`\`

### Create Product (Admin)
\`\`\`bash
POST /v1/products
Content-Type: application/json

{
  "name": "Wireless Headphones",
  "description": "Premium noise-canceling headphones",
  "price": 299.99,
  "category": "electronics",
  "inventory": 50
}
\`\`\`

## Order Service API

### Create Order
\`\`\`bash
POST /v1/orders
Content-Type: application/json

{
  "items": [
    { "productId": "prod_123", "quantity": 2 },
    { "productId": "prod_456", "quantity": 1 }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105"
  }
}
\`\`\`

### Get Order Status
\`\`\`bash
GET /v1/orders/:orderId
\`\`\`

### List User Orders
\`\`\`bash
GET /v1/users/:userId/orders
\`\`\`

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
\`\`\`

### Common HTTP Status Codes

- \`200 OK\`: Successful request
- \`201 Created\`: Resource created successfully
- \`400 Bad Request\`: Invalid input
- \`401 Unauthorized\`: Missing or invalid authentication
- \`403 Forbidden\`: Insufficient permissions
- \`404 Not Found\`: Resource not found
- \`429 Too Many Requests\`: Rate limit exceeded
- \`500 Internal Server Error\`: Server error

## Rate Limiting

API requests are rate-limited to:
- **Authenticated users**: 1000 requests/hour
- **Anonymous users**: 100 requests/hour

Rate limit headers are included in responses:
\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 842
X-RateLimit-Reset: 1625097600
\`\`\`
`,
    },
    {
      type: 'readme',
      path: 'README.md',
      version: 1,
      wordCount: 650,
      content: `# Microservices Platform

Enterprise-grade microservices platform for e-commerce operations, built with Node.js and TypeScript.

## Features

- 🏗️ **Microservices Architecture**: 8 independent services with clear boundaries
- 🔄 **Event-Driven**: Asynchronous communication via RabbitMQ
- 🚀 **High Performance**: Fastify framework with Redis caching
- 🔐 **Secure**: JWT authentication, mTLS between services
- 📊 **Observable**: Prometheus metrics, Jaeger tracing
- 🐳 **Containerized**: Docker + Kubernetes deployment

## Prerequisites

- Node.js 20 LTS
- Docker Desktop
- Kubernetes (minikube or Docker Desktop)
- RabbitMQ
- PostgreSQL 15

## Quick Start

### 1. Clone and Install
\`\`\`bash
git clone https://github.com/example/microservices-platform.git
cd microservices-platform
npm install
\`\`\`

### 2. Start Infrastructure
\`\`\`bash
docker-compose up -d postgres redis rabbitmq elasticsearch
\`\`\`

### 3. Run Migrations
\`\`\`bash
npm run db:migrate
npm run db:seed
\`\`\`

### 4. Start Services
\`\`\`bash
# Development mode (all services)
npm run dev

# Or start individual services
npm run dev:gateway
npm run dev:users
npm run dev:products
\`\`\`

## Project Structure

\`\`\`
microservices-platform/
├── services/
│   ├── api-gateway/
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── notification-service/
│   ├── analytics-service/
│   └── search-service/
├── shared/
│   ├── types/
│   ├── utils/
│   └── events/
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
└── docs/
\`\`\`

## Testing

\`\`\`bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
\`\`\`

## License

MIT
`,
    },
  ];

  for (const artifact of run1Artifacts) {
    await prisma.generatedArtifact.create({
      data: {
        runId: run1.id,
        ...artifact,
      },
    });
  }

  console.log(`  ✅ Created ${run1Artifacts.length} artifacts`);

  // Run 2: Previous run for microservices-platform (for comparison)
  const run2StartTime = Date.now() - 1000 * 60 * 60 * 24 * 7; // 1 week ago
  const run2EndTime = run2StartTime + 1000 * 60 * 6; // 6 minutes duration
  const run2Duration = run2EndTime - run2StartTime;

  const run2 = await prisma.analysisRun.create({
    data: {
      repoId: microservicesRepo.id,
      refName: 'main',
      status: 'completed',
      templateId: microservicesTemplate.id,
      startedAt: new Date(run2StartTime),
      finishedAt: new Date(run2EndTime),
      durationMs: run2Duration,
      filesScanned: 320,
      linesScanned: 42100,
      triggeredBy: 'manual',
      retryCount: 0,
      artifactsJson: JSON.stringify({
        modules: 26,
        services: 7,
        dependencies: { production: 38, development: 25 },
      }),
    },
  });

  // Create comparison between run1 and run2
  await prisma.analysisComparison.create({
    data: {
      currentRunId: run1.id,
      previousRunId: run2.id,
      changesSummary: 'Added new Search Service, updated 3 existing services, added 4 production dependencies',
      addedModules: 5,
      removedModules: 3,
      modifiedModules: 8,
      addedDeps: 7,
      removedDeps: 3,
      diffJson: JSON.stringify({
        services: {
          added: ['search-service'],
          modified: ['product-service', 'order-service', 'analytics-service'],
        },
        dependencies: {
          added: ['elasticsearch', '@elastic/elasticsearch', 'ioredis', 'bull'],
          removed: ['node-cache', 'simple-cache'],
        },
      }),
    },
  });

  console.log(`  ✅ Created comparison between current and previous run`);

  // Run 3: Completed run for React Dashboard
  const run3 = await prisma.analysisRun.create({
    data: {
      repoId: reactRepo.id,
      refName: 'main',
      status: 'completed',
      templateId: standardTemplate.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 4),
      durationMs: 1000 * 60 * 4,
      filesScanned: 156,
      linesScanned: 18920,
      triggeredBy: 'schedule',
      retryCount: 0,
      artifactsJson: JSON.stringify({
        modules: 45,
        dependencies: { production: 28, development: 35 },
      }),
    },
  });

  console.log(`✅ Created completed run for ${reactRepo.name}`);

  // Run 4: Failed run with retry for Fastify API
  const run4 = await prisma.analysisRun.create({
    data: {
      repoId: fastifyRepo.id,
      refName: 'main',
      status: 'failed',
      templateId: securityTemplate.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6 + 1000 * 60 * 2),
      durationMs: 1000 * 60 * 2,
      filesScanned: 89,
      linesScanned: 12450,
      triggeredBy: 'manual',
      retryCount: 2,
      errorMessage: 'LLM rate limit exceeded',
      artifactsJson: JSON.stringify({}),
    },
  });

  console.log(`✅ Created failed run for ${fastifyRepo.name}`);

  // Run 5: In-progress run
  const run5 = await prisma.analysisRun.create({
    data: {
      repoId: fastifyRepo.id,
      refName: 'develop',
      status: 'in_progress',
      templateId: securityTemplate.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 2),
      filesScanned: 89,
      linesScanned: 0,
      triggeredBy: 'webhook',
      retryCount: 0,
    },
  });

  console.log(`✅ Created in-progress run for ${fastifyRepo.name}`);

  console.log('\n✨ Phase 3 seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${demoRepos.length} repositories created`);
  console.log(`   - 4 analysis templates created`);
  console.log(`   - 2 scheduled analyses created`);
  console.log(`   - 2 notification configs created`);
  console.log(`   - 14 tags created across repositories`);
  console.log(`   - 5 analysis runs created (3 completed, 1 failed, 1 in-progress)`);
  console.log(`   - ${run1Artifacts.length} artifacts for microservices-platform`);
  console.log(`   - ${run1Metrics.length} metrics tracked`);
  console.log(`   - 1 analysis comparison generated`);
  console.log('\n🎯 Phase 3 Features Demonstrated:');
  console.log(`   ✅ Template System: Multiple templates with custom prompts`);
  console.log(`   ✅ Tag System: Repositories tagged by domain, team, language`);
  console.log(`   ✅ Scheduling: Cron-based recurring analyses configured`);
  console.log(`   ✅ Metrics: Performance and analysis metrics tracked`);
  console.log(`   ✅ Comparisons: Version-over-version change tracking`);
  console.log(`   ✅ Notifications: Multi-channel notification configs`);
  console.log(`   ✅ Retry Logic: Failed runs with retry tracking`);
  console.log(`   ✅ Triggered By: Manual, schedule, and webhook triggers`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
