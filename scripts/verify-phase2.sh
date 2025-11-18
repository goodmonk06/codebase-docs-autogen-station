#!/bin/bash

# Phase 2 Verification Script
# This script validates that all Phase 2 requirements are met

set -e

echo "🔍 Phase 2 Verification Starting..."
echo ""

# Check Node version
echo "✓ Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -ge 18 ]; then
  echo "  ✅ Node.js $node_version (required: 18+)"
else
  echo "  ❌ Node.js $node_version (required: 18+)"
  exit 1
fi

# Check Docker
echo "✓ Checking Docker..."
if command -v docker &> /dev/null; then
  echo "  ✅ Docker installed"
else
  echo "  ⚠️  Docker not found (optional for local dev)"
fi

# Check Git
echo "✓ Checking Git..."
if command -v git &> /dev/null; then
  echo "  ✅ Git installed"
else
  echo "  ❌ Git required"
  exit 1
fi

# Check file structure
echo ""
echo "✓ Checking project structure..."

files=(
  "README.md"
  "PHASE2_SUMMARY.md"
  ".env.example"
  "docker-compose.yml"
  "package.json"
  "backend/Dockerfile"
  "backend/.eslintrc.json"
  "backend/vitest.config.ts"
  "backend/prisma/schema.prisma"
  "backend/prisma/seed.ts"
  "backend/src/lib/errors.ts"
  "backend/src/lib/prisma.ts"
  "backend/src/lib/__tests__/errors.test.ts"
  "backend/src/services/__tests__/diagramGenerator.test.ts"
  "frontend/Dockerfile"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (missing)"
    exit 1
  fi
done

# Check package.json scripts
echo ""
echo "✓ Checking npm scripts..."

scripts=(
  "dev"
  "build"
  "test"
  "lint"
  "db:setup"
  "db:push"
  "db:seed"
)

for script in "${scripts[@]}"; do
  if grep -q "\"$script\"" package.json; then
    echo "  ✅ npm run $script"
  else
    echo "  ❌ npm run $script (missing)"
    exit 1
  fi
done

# Check .env.example
echo ""
echo "✓ Checking environment configuration..."

env_vars=(
  "DATABASE_URL"
  "OPENAI_API_KEY"
  "PORT"
  "NODE_ENV"
  "NEXT_PUBLIC_API_URL"
  "WORKSPACE_DIR"
)

for var in "${env_vars[@]}"; do
  if grep -q "$var" .env.example; then
    echo "  ✅ $var"
  else
    echo "  ❌ $var (missing)"
    exit 1
  fi
done

echo ""
echo "✅ Phase 2 Verification Complete!"
echo ""
echo "📋 Summary:"
echo "   - Project structure: ✅"
echo "   - Docker configuration: ✅"
echo "   - npm scripts: ✅"
echo "   - Testing setup: ✅"
echo "   - Seed data: ✅"
echo "   - Documentation: ✅"
echo ""
echo "🚀 Ready to start:"
echo "   1. cp .env.example .env"
echo "   2. Edit .env and add OPENAI_API_KEY"
echo "   3. docker compose up --build"
echo "   4. docker compose exec backend npm run db:push"
echo "   5. docker compose exec backend npm run db:seed"
echo "   6. Visit http://localhost:3000"
echo ""
echo "📖 See README.md for detailed instructions"
