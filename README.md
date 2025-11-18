# Codebase Documentation Auto-Generator

Automatically generate comprehensive documentation for your Git repositories, including:
- **Architecture overviews** - High-level system design and component breakdown
- **API documentation** - Endpoint descriptions and service documentation
- **README drafts** - Professional README files with setup instructions
- **Architecture diagrams** - PlantUML and Graphviz visualizations

## Features

- 🔍 **Intelligent Code Scanning** - Analyzes project structure, dependencies, and module relationships
- 🤖 **LLM-Powered Documentation** - Uses OpenAI to generate human-readable docs from code analysis
- 📊 **Diagram Generation** - Creates PlantUML and Graphviz diagrams for architecture visualization
- 🔄 **Multi-Source Support** - Works with GitHub repositories or local Git projects
- 🎨 **Modern UI** - Clean Next.js dashboard to manage repositories and view generated docs
- 📦 **Framework Detection** - Automatically identifies frameworks (React, Next.js, Fastify, Express, etc.)
- 🗄️ **Run History** - Tracks all analysis runs with version control

## Tech Stack

- **Backend**: Fastify + TypeScript
- **Frontend**: Next.js + React + Tailwind CSS
- **Database**: Prisma + SQLite (easily switchable to PostgreSQL/MySQL)
- **LLM**: OpenAI API (GPT-4 Turbo)
- **Diagrams**: PlantUML & Graphviz DOT
- **Git Operations**: simple-git

## Project Structure

```
codebase-docs-autogen-station/
├── backend/                 # Fastify API server
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── src/
│       ├── config/         # Configuration
│       ├── routes/         # API endpoints
│       ├── services/       # Core business logic
│       │   ├── repoSource.ts        # Git clone/pull abstraction
│       │   ├── scanner.ts           # Code analysis
│       │   ├── llmService.ts        # OpenAI integration
│       │   ├── diagramGenerator.ts  # PlantUML/Graphviz
│       │   └── analysisOrchestrator.ts  # Main workflow
│       ├── types/          # TypeScript types
│       └── index.ts        # Server entry point
├── frontend/               # Next.js dashboard
│   └── src/
│       ├── pages/          # Next.js pages
│       │   ├── index.tsx           # Repository list
│       │   ├── repos/[id].tsx      # Repository detail
│       │   └── runs/[id].tsx       # Analysis run results
│       └── lib/
│           └── api.ts      # API client
└── workspace/              # Generated repos are cloned here
```

## Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Git installed on your system
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/codebase-docs-autogen-station.git
cd codebase-docs-autogen-station
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for both backend and frontend workspaces.

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
# Database
DATABASE_URL="file:./dev.db"

# OpenAI - REQUIRED
OPENAI_API_KEY="sk-your-api-key-here"

# Server
PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Workspace (where repos are cloned)
WORKSPACE_DIR="./workspace"
```

### 4. Initialize the database

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 5. Start the development servers

```bash
npm run dev
```

This starts:
- Backend API: http://localhost:3001
- Frontend UI: http://localhost:3000

## Usage

### Via Web UI

1. **Open the dashboard** at http://localhost:3000

2. **Add a repository**:
   - Click "Add Repository"
   - Enter repository name
   - Choose source type:
     - **GitHub URL**: `https://github.com/username/repo.git`
     - **Local Path**: `/path/to/your/local/repo`
   - Optionally specify the main language

3. **Trigger analysis**:
   - Click "Analyze" on any repository
   - The system will:
     - Clone/pull the repository
     - Scan the codebase structure
     - Generate documentation with AI
     - Create architecture diagrams

4. **View results**:
   - Click on the repository to see all analysis runs
   - Click on a run to view generated artifacts:
     - Architecture documentation
     - API documentation
     - README draft
     - PlantUML diagram
     - Graphviz diagram

### Via API

#### Create a repository

```bash
curl -X POST http://localhost:3001/api/repos \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-project",
    "githubUrl": "https://github.com/username/my-project.git",
    "mainLanguage": "TypeScript"
  }'
```

#### Trigger analysis

```bash
curl -X POST http://localhost:3001/api/repos/{repoId}/analyze \
  -H "Content-Type: application/json" \
  -d '{"refName": "main"}'
```

#### Get analysis results

```bash
curl http://localhost:3001/api/runs/{runId}
```

## API Endpoints

### Repositories

- `GET /api/repos` - List all repositories
- `GET /api/repos/:id` - Get repository details
- `POST /api/repos` - Create new repository
- `PUT /api/repos/:id` - Update repository
- `DELETE /api/repos/:id` - Delete repository
- `POST /api/repos/:id/analyze` - Trigger analysis run

### Analysis Runs

- `GET /api/runs` - List all runs
- `GET /api/runs/:id` - Get run details with artifacts
- `GET /api/runs/:id/artifacts` - Get artifacts for a run
- `GET /api/runs/:id/artifacts/:artifactId` - Get specific artifact

## Example Use Case

Let's say you want to document an existing Express.js API:

1. **Add the repository**:
   ```json
   {
     "name": "my-express-api",
     "localPath": "/Users/me/projects/my-express-api",
     "mainLanguage": "JavaScript"
   }
   ```

2. **Trigger analysis** - The system will:
   - Detect Express.js framework
   - Identify routes, controllers, and middleware
   - Map out API endpoints
   - Analyze dependencies

3. **Get generated documentation**:
   - **Architecture doc**: Explains the layered architecture, how routes connect to controllers and services
   - **API docs**: Lists all endpoints with descriptions
   - **README**: Complete setup instructions and usage guide
   - **Diagrams**: Visual representation of component relationships

4. **Use the output**:
   - Copy the README to your project
   - Use the architecture doc for onboarding new developers
   - Share API docs with frontend team
   - Include diagrams in technical presentations

## Generated Artifacts

### Architecture Documentation
- System overview
- Architecture pattern identification
- Core components and responsibilities
- Technology stack summary
- Data flow description

### API Documentation
- API overview
- Endpoint listing
- Request/response formats
- Authentication patterns
- Error handling

### README Draft
- Project title and description
- Features list
- Prerequisites
- Installation steps
- Usage instructions
- Project structure
- Development setup

### Diagrams

**PlantUML** - Component-based architecture diagram:
```plantuml
@startuml
package "Controllers" {
  [UserController]
  [ProductController]
}
package "Services" {
  [UserService]
  [ProductService]
}
[UserController] --> [UserService]
@enduml
```

**Graphviz DOT** - Dependency graph:
```dot
digraph Dependencies {
  "my-app" -> "express";
  "my-app" -> "prisma";
}
```

## Architecture

### Core Components

1. **RepoSource Interface** (`backend/src/services/repoSource.ts`)
   - Abstracts GitHub vs local repository access
   - Handles git clone/pull operations

2. **Repository Scanner** (`backend/src/services/scanner.ts`)
   - Analyzes file structure
   - Detects framework and package manager
   - Extracts module information
   - Builds dependency graph

3. **LLM Service** (`backend/src/services/llmService.ts`)
   - Generates architecture documentation
   - Creates API documentation
   - Drafts README files

4. **Diagram Generator** (`backend/src/services/diagramGenerator.ts`)
   - Produces PlantUML diagrams
   - Creates Graphviz DOT files

5. **Analysis Orchestrator** (`backend/src/services/analysisOrchestrator.ts`)
   - Coordinates the entire analysis workflow
   - Manages run status and error handling

### Data Model

```
RepoConfig (repositories)
  ├── id
  ├── name
  ├── githubUrl or localPath
  └── runs (1:many)
       └── AnalysisRun
            ├── id
            ├── refName (branch)
            ├── status
            └── artifacts (1:many)
                 └── GeneratedArtifact
                      ├── type
                      ├── content
                      └── path
```

## Configuration

### Using PostgreSQL instead of SQLite

1. Update `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/docsgen"
```

3. Run migrations:
```bash
npm run prisma:migrate
```

### Changing the OpenAI model

Edit `backend/src/config/index.ts`:
```typescript
openai: {
  model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo'
}
```

Or set via environment:
```env
OPENAI_MODEL=gpt-4-turbo-preview
```

## Development

### Run backend only

```bash
npm run dev:backend
```

### Run frontend only

```bash
npm run dev:frontend
```

### Access Prisma Studio (database GUI)

```bash
npm run prisma:studio
```

### Build for production

```bash
npm run build
```

## Troubleshooting

### "Failed to clone repository"

- Ensure the GitHub URL is correct and publicly accessible
- For private repos, configure SSH keys or use personal access tokens
- Check that Git is installed: `git --version`

### "OpenAI API error"

- Verify your API key is correct in `.env`
- Check your OpenAI account has credits
- Ensure you're not hitting rate limits

### "Module not found" errors

- Run `npm install` in the root directory
- Run `npm run prisma:generate` to regenerate Prisma client

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Future Enhancements

- [ ] Support for more languages (Go, Rust, Java, Python)
- [ ] Generate sequence diagrams for key flows
- [ ] Export documentation as PDF
- [ ] Integrate with GitHub Actions for automated docs
- [ ] Support for private repositories with authentication
- [ ] Diff view between documentation versions
- [ ] Custom LLM prompts and templates
- [ ] Plugin system for custom analyzers

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Built with [Fastify](https://www.fastify.io/)
- UI powered by [Next.js](https://nextjs.org/)
- Database with [Prisma](https://www.prisma.io/)
- AI by [OpenAI](https://openai.com/)
- Diagrams with [PlantUML](https://plantuml.com/) and [Graphviz](https://graphviz.org/)
