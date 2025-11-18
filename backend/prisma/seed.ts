import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.generatedArtifact.deleteMany();
  await prisma.analysisRun.deleteMany();
  await prisma.repoConfig.deleteMany();

  // Create demo repositories
  const demoRepos = [
    {
      name: 'demo-react-app',
      githubUrl: 'https://github.com/facebook/create-react-app.git',
      mainLanguage: 'JavaScript',
    },
    {
      name: 'demo-fastify-api',
      githubUrl: 'https://github.com/fastify/fastify.git',
      mainLanguage: 'TypeScript',
    },
    {
      name: 'demo-local-project',
      localPath: '/path/to/local/project',
      mainLanguage: 'TypeScript',
    },
  ];

  for (const repoData of demoRepos) {
    const repo = await prisma.repoConfig.create({
      data: repoData,
    });

    console.log(`✅ Created repo: ${repo.name}`);

    // Create a completed analysis run for the first repo
    if (repo.name === 'demo-react-app') {
      const run = await prisma.analysisRun.create({
        data: {
          repoId: repo.id,
          refName: 'main',
          status: 'completed',
          startedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
          finishedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          artifactsJson: JSON.stringify({
            modules: 42,
            dependencies: { production: 15, development: 25 },
          }),
        },
      });

      console.log(`  ✅ Created completed run for ${repo.name}`);

      // Create artifacts
      const artifacts = [
        {
          type: 'arch_doc',
          path: 'architecture.md',
          content: `# Architecture Overview - ${repo.name}

## System Architecture

This is a React-based single-page application following modern best practices.

### Key Components

1. **UI Layer**: React components with Hooks
2. **State Management**: Context API and local state
3. **Build System**: Webpack with optimized production builds
4. **Testing**: Jest and React Testing Library

### Design Patterns

- Component-based architecture
- Container/Presentational pattern
- Custom hooks for reusable logic

### Technology Stack

- React 18
- Webpack 5
- Babel
- ESLint + Prettier
`,
        },
        {
          type: 'api_doc',
          path: 'api-docs.md',
          content: `# API Documentation - ${repo.name}

## Overview

This project is primarily a frontend application with no backend API.

### Build Scripts

\`\`\`bash
npm start     # Development server
npm build     # Production build
npm test      # Run tests
\`\`\`

### Configuration

Configuration is managed through environment variables and webpack config.
`,
        },
        {
          type: 'readme',
          path: 'README.md',
          content: `# ${repo.name}

A modern React application starter template.

## Features

- ⚡ Fast refresh with HMR
- 📦 Optimized production builds
- 🧪 Comprehensive test setup
- 🎨 CSS modules support

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
# Development
npm start

# Build
npm run build

# Test
npm test
\`\`\`

## Project Structure

\`\`\`
src/
  ├── components/
  ├── hooks/
  ├── utils/
  └── App.tsx
\`\`\`

## License

MIT
`,
        },
        {
          type: 'diagram_puml',
          path: 'architecture.puml',
          content: `@startuml
title ${repo.name} - Architecture Diagram

package "UI Components" {
  [App]
  [Header]
  [MainContent]
  [Footer]
}

package "State Management" {
  [Context]
  [Hooks]
}

package "Build System" {
  [Webpack]
  [Babel]
}

[App] --> [Header]
[App] --> [MainContent]
[App] --> [Footer]
[App] --> [Context]
[Hooks] --> [Context]

@enduml`,
        },
        {
          type: 'diagram_dot',
          path: 'dependencies.dot',
          content: `digraph Dependencies {
  rankdir=LR;
  node [shape=box, style=rounded];

  "${repo.name}" [shape=box, style="rounded,filled", fillcolor=lightblue];

  "react" [fillcolor=lightgreen, style="rounded,filled"];
  "react-dom" [fillcolor=lightgreen, style="rounded,filled"];
  "webpack" [fillcolor=lightyellow, style="rounded,filled"];
  "babel" [fillcolor=lightyellow, style="rounded,filled"];

  "${repo.name}" -> "react";
  "${repo.name}" -> "react-dom";
  "${repo.name}" -> "webpack" [style=dashed];
  "${repo.name}" -> "babel" [style=dashed];
}`,
        },
      ];

      for (const artifactData of artifacts) {
        await prisma.generatedArtifact.create({
          data: {
            runId: run.id,
            ...artifactData,
          },
        });
      }

      console.log(`  ✅ Created ${artifacts.length} artifacts`);
    }

    // Create a pending run for the second repo
    if (repo.name === 'demo-fastify-api') {
      await prisma.analysisRun.create({
        data: {
          repoId: repo.id,
          refName: 'main',
          status: 'pending',
          startedAt: new Date(),
        },
      });

      console.log(`  ✅ Created pending run for ${repo.name}`);
    }
  }

  console.log('\n✨ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${demoRepos.length} repositories created`);
  console.log(`   - 2 analysis runs created`);
  console.log(`   - 5 artifacts created for demo-react-app`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
