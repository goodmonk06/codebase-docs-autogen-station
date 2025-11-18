# Codebase Documentation Auto-Generator

Automatically scan Git repositories and generate comprehensive documentation including architecture overviews, API docs, README drafts, and visual diagrams using AI.

## Overview

This system analyzes code repositories (from GitHub or local paths) and uses OpenAI to generate:
- **Architecture Documentation** - High-level system design and component breakdown
- **API Documentation** - Endpoint descriptions and service documentation
- **README Drafts** - Professional README files with setup instructions
- **Architecture Diagrams** - PlantUML and Graphviz visualizations

The analysis extracts project structure, dependencies, module relationships, and uses LLMs to create human-readable documentation.

## Tech Stack

**Backend:**
- Fastify (Node.js REST API)
- TypeScript
- Prisma ORM
- PostgreSQL / SQLite
- OpenAI API (GPT-4)
- simple-git (Git operations)

**Frontend:**
- Next.js 14
- React 18
- Tailwind CSS
- SWR (data fetching)

**Infrastructure:**
- Docker & Docker Compose
- Vitest (testing)
- ESLint (linting)

## Domain Model

```
RepoConfig (repositories to analyze)
  ├── id: UUID
  ├── name: string (unique)
  ├── githubUrl: string (optional)
  ├── localPath: string (optional)
  └── mainLanguage: string (optional)

AnalysisRun (analysis executions)
  ├── id: UUID
  ├── repoId: UUID (FK)
  ├── refName: string (branch/tag)
  ├── status: pending | running | completed | failed
  ├── startedAt: DateTime
  ├── finishedAt: DateTime (optional)
  ├── errorMessage: string (optional)
  └── artifactsJson: JSON

GeneratedArtifact (generated documents)
  ├── id: UUID
  ├── runId: UUID (FK)
  ├── type: arch_doc | api_doc | readme | diagram_puml | diagram_dot
  ├── path: string
  ├── content: string (the generated document)
  └── createdAt: DateTime
```

## Getting Started

### Requirements

- Node.js 18+
- Docker & Docker Compose (for full setup)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Git

### Setup Steps

#### Option A: Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd codebase-docs-autogen-station
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Start with Docker Compose**
   ```bash
   docker compose up --build
   ```

   This starts:
   - PostgreSQL database on port 5432
   - Backend API on port 3001
   - Frontend UI on port 3000

4. **Initialize database (first time only)**
   ```bash
   # In another terminal
   docker compose exec backend npx prisma db push
   docker compose exec backend npx prisma db seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

#### Option B: Local Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd codebase-docs-autogen-station
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   # For local dev, you can use SQLite:
   # DATABASE_URL="file:./dev.db"
   ```

3. **Setup database**
   ```bash
   npm run db:generate    # Generate Prisma Client
   npm run db:push        # Create database schema
   npm run db:seed        # Load demo data
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend: http://localhost:3001
   - Frontend: http://localhost:3000

### Demo Credentials

After seeding, you'll have 3 demo repositories:
- `demo-react-app` - Completed analysis with full artifacts
- `demo-fastify-api` - Pending analysis
- `demo-local-project` - Local repository example

## Example Flow (Vertical Slice)

Here's how the complete end-to-end flow works:

### 1. Add a Repository

**Via UI:**
- Navigate to http://localhost:3000
- Click "Add Repository"
- Enter:
  - Name: `my-awesome-project`
  - GitHub URL: `https://github.com/username/my-awesome-project.git`
  - Main Language: `TypeScript`
- Click "Create Repository"

**Via API:**
```bash
curl -X POST http://localhost:3001/api/repos \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-awesome-project",
    "githubUrl": "https://github.com/username/my-awesome-project.git",
    "mainLanguage": "TypeScript"
  }'
```

### 2. Trigger Analysis

**Via UI:**
- Click "Analyze" button next to the repository

**Via API:**
```bash
curl -X POST http://localhost:3001/api/repos/{repoId}/analyze \
  -H "Content-Type: application/json" \
  -d '{"refName": "main"}'
```

### 3. Analysis Process

The system will:
1. **Clone/Pull** the repository to the workspace
2. **Scan** the codebase:
   - Detect package manager (npm, pnpm, yarn, pip, cargo, maven, gradle)
   - Identify framework (Next.js, React, Fastify, Express, etc.)
   - Find entry points
   - Map module structure (controllers, services, models, etc.)
   - Extract dependencies
3. **Generate** documentation using OpenAI:
   - Architecture overview
   - API documentation
   - README draft
4. **Create** diagrams:
   - PlantUML component diagram
   - Graphviz dependency graph
5. **Save** all artifacts to database

### 4. View Results

**Via UI:**
- Click on the repository name
- View all analysis runs
- Click on a completed run to see:
  - Architecture tab - System design and components
  - API Docs tab - Endpoints and services
  - README tab - Generated README
  - PlantUML tab - Component diagram
  - GraphViz tab - Dependency graph

**Via API:**
```bash
# Get run details
curl http://localhost:3001/api/runs/{runId}

# Get specific artifact
curl http://localhost:3001/api/runs/{runId}/artifacts?type=arch_doc
```

### 5. Use the Output

- Copy generated README to your project
- Use architecture docs for team onboarding
- Share API docs with frontend developers
- Include diagrams in technical presentations
- Iterate by re-running analysis after code changes

## API Endpoints

### Repositories

```
GET    /api/repos              # List all repositories
GET    /api/repos/:id          # Get repository with runs
POST   /api/repos              # Create new repository
PUT    /api/repos/:id          # Update repository
DELETE /api/repos/:id          # Delete repository
POST   /api/repos/:id/analyze  # Trigger analysis run
```

### Analysis Runs

```
GET    /api/runs                        # List all runs
GET    /api/runs/:id                    # Get run with artifacts
GET    /api/runs/:id/artifacts          # Get all artifacts
GET    /api/runs/:id/artifacts/:artId   # Get specific artifact
```

### Health Check

```
GET    /health                 # Service health status
```

## Development

### Available Scripts

**Root (monorepo):**
```bash
npm run dev            # Start both backend and frontend
npm run build          # Build both workspaces
npm run test           # Run all tests
npm run lint           # Lint all workspaces
npm run db:setup       # Initialize database with seed data
```

**Backend:**
```bash
npm run dev --workspace=backend          # Start backend dev server
npm run build --workspace=backend        # Build backend
npm run test --workspace=backend         # Run backend tests
npm run test:coverage --workspace=backend # Test coverage
npm run lint --workspace=backend         # Lint backend code
npm run db:push --workspace=backend      # Push schema to database
npm run db:seed --workspace=backend      # Seed demo data
npm run db:studio --workspace=backend    # Open Prisma Studio
```

**Frontend:**
```bash
npm run dev --workspace=frontend    # Start frontend dev server
npm run build --workspace=frontend  # Build frontend
npm run lint --workspace=frontend   # Lint frontend code
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch --workspace=backend

# Generate coverage report
npm run test:coverage --workspace=backend
```

### Database Management

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database (for development)
npm run db:push

# Create and apply migrations (for production)
npm run db:migrate

# Seed database with demo data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset --workspace=backend
```

### Docker Commands

```bash
# Start all services
docker compose up

# Build and start
docker compose up --build

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v

# Execute command in container
docker compose exec backend npm run db:seed
```

## Environment Variables

See `.env.example` for full configuration. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string | `postgresql://...` |
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend | `http://localhost:3001` |
| `WORKSPACE_DIR` | Directory for cloned repos | `./workspace` |

## Project Structure

```
codebase-docs-autogen-station/
├── backend/                          # Fastify API server
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   └── seed.ts                  # Demo data seeder
│   ├── src/
│   │   ├── config/                  # Configuration
│   │   ├── lib/
│   │   │   ├── errors.ts           # Error handling
│   │   │   └── prisma.ts           # Prisma client
│   │   ├── routes/
│   │   │   ├── repos.ts            # Repository endpoints
│   │   │   └── runs.ts             # Analysis run endpoints
│   │   ├── services/
│   │   │   ├── repoSource.ts       # Git operations
│   │   │   ├── scanner.ts          # Code analysis
│   │   │   ├── llmService.ts       # OpenAI integration
│   │   │   ├── diagramGenerator.ts # Diagram creation
│   │   │   └── analysisOrchestrator.ts # Main workflow
│   │   ├── types/                   # TypeScript types
│   │   └── index.ts                # Server entry point
│   ├── Dockerfile
│   ├── vitest.config.ts
│   └── package.json
├── frontend/                         # Next.js dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx           # Repository list
│   │   │   ├── repos/[id].tsx      # Repository detail
│   │   │   └── runs/[id].tsx       # Run results
│   │   ├── lib/
│   │   │   └── api.ts              # API client
│   │   └── styles/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml               # Docker orchestration
├── .env.example                     # Environment template
└── README.md                        # This file
```

## Architecture

### Core Components

1. **RepoSource Interface** - Abstracts GitHub vs local repository access
   - `GitHubRepoSource` - Clones/pulls from GitHub
   - `LocalRepoSource` - Reads from local filesystem

2. **RepositoryScanner** - Analyzes codebase structure
   - Detects language, framework, package manager
   - Discovers modules (controllers, services, models, etc.)
   - Extracts imports/exports
   - Builds dependency graph

3. **LLMService** - Generates documentation with OpenAI
   - Architecture documentation with design patterns
   - API documentation with endpoints
   - README with setup instructions

4. **DiagramGenerator** - Creates visual representations
   - PlantUML component diagrams
   - Graphviz dependency graphs

5. **AnalysisOrchestrator** - Coordinates the workflow
   - Manages async analysis execution
   - Handles errors and status updates
   - Saves artifacts to database

### Data Flow

```
User Request → API → Orchestrator
                        ↓
                    RepoSource (clone/pull)
                        ↓
                    Scanner (analyze code)
                        ↓
                    LLMService (generate docs)
                        ↓
                    DiagramGenerator (create diagrams)
                        ↓
                    Database (save artifacts)
                        ↓
                    API Response ← Frontend
```

## Troubleshooting

### "Failed to clone repository"
- Verify GitHub URL is correct and public
- For private repos, configure SSH keys
- Check Git is installed: `git --version`

### "OpenAI API error"
- Verify API key in `.env` is correct
- Check OpenAI account has credits
- Ensure you're not hitting rate limits

### "Database connection error"
- For Docker: Ensure PostgreSQL container is healthy
- For local: Check DATABASE_URL is correct
- Run `npm run db:push` to sync schema

### "Port already in use"
- Change PORT in `.env`
- Or stop conflicting service: `lsof -ti:3001 | xargs kill`

### Tests failing
- Run `npm install` to ensure all dependencies are installed
- Run `npm run db:generate` to regenerate Prisma Client
- Check Node version: `node --version` (requires 18+)

## Future Extensions

- [ ] Support for more languages (Go, Rust, Java, Python analysis)
- [ ] Sequence diagrams for key user flows
- [ ] PDF export for documentation
- [ ] GitHub Actions integration for automated docs
- [ ] Authentication for private repository access
- [ ] Diff view between documentation versions
- [ ] Custom LLM prompts and templates
- [ ] Webhook support for CI/CD integration
- [ ] Slack/Discord notifications
- [ ] Multi-model support (Anthropic Claude, local LLMs)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass: `npm test`
5. Lint your code: `npm run lint`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [Fastify](https://www.fastify.io/) - Fast web framework
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Modern database toolkit
- [OpenAI](https://openai.com/) - LLM API
- [PlantUML](https://plantuml.com/) - Diagram generation
- [Graphviz](https://graphviz.org/) - Graph visualization
