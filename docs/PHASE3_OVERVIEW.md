# Phase 3 Overview: Codebase Documentation Auto-Generator

## Purpose Statement

This repository is a **production-grade documentation generation service** that automatically analyzes Git repositories (GitHub or local) and produces comprehensive technical documentation using AI. It serves as a critical building block in a larger AI-driven ecosystem by:

1. **Reducing documentation debt** - Automates the creation of architecture docs, API docs, and README files
2. **Onboarding acceleration** - Generates visual diagrams and system overviews for new team members
3. **Knowledge extraction** - Preserves tribal knowledge by extracting patterns from code structure
4. **Integration hub** - Provides a standardized API for documentation generation that other services can leverage

The service acts as a "documentation as a service" component that can be embedded in CI/CD pipelines, development workflows, or larger platform ecosystems.

## Current State (Post Phase 2)

### Existing Features
- ✅ **Core vertical slice**: RepoConfig CRUD + Analysis workflow
- ✅ **Git integration**: Clone/pull from GitHub or local paths via `RepoSource` abstraction
- ✅ **Code analysis**: Scanner that detects frameworks, languages, modules, dependencies
- ✅ **AI documentation**: OpenAI integration generating architecture, API, and README docs
- ✅ **Diagram generation**: PlantUML and Graphviz output
- ✅ **Async execution**: Background analysis with status tracking (pending/running/completed/failed)
- ✅ **REST API**: Full CRUD endpoints for repos and runs
- ✅ **Next.js dashboard**: UI for managing repos and viewing results
- ✅ **Docker support**: Complete docker-compose setup with PostgreSQL
- ✅ **Testing**: Vitest configured with unit tests
- ✅ **Seed data**: Demo repositories with sample artifacts

### Current Limitations
- **Single analysis mode**: No templates, scheduling, or customization
- **No user management**: No multi-tenancy or user preferences
- **Limited extensibility**: Hard-coded OpenAI, no plugin system
- **Basic notifications**: No alerts when analysis completes
- **No categorization**: Can't organize repos by project, team, or tag
- **No comparison**: Can't diff documentation versions
- **Limited metrics**: No observability or usage tracking
- **Single LLM provider**: Locked to OpenAI
- **No batch operations**: Can't analyze multiple repos at once
- **Basic error recovery**: No retry logic or partial failure handling

## Phase 3 Implementation Plan

### 1. Domain Expansion (New Entities & Relationships)
**Goal**: Transform from simple repo→analysis into a rich documentation platform

**New Entities:**
- `AnalysisTemplate` - Reusable configurations for analysis (prompt templates, focus areas)
- `RepoTag` - Categorization and organization (project, team, language, domain)
- `ScheduledAnalysis` - Cron-based recurring analysis
- `AnalysisComparison` - Diffs between documentation versions
- `NotificationConfig` - User preferences for alerts
- `AnalysisMetrics` - Usage tracking and performance data

**Enhanced Entities:**
- `RepoConfig`: Add `tags[]`, `templateId`, `scheduleId`, `lastAnalyzedAt`
- `AnalysisRun`: Add `templateUsed`, `metrics`, `retryCount`, `parentRunId`
- `GeneratedArtifact`: Add `version`, `previousVersionId`, `changesSummary`

### 2. Multiple Vertical Slices (3 Rich Flows)

**Slice A: Template System**
- Create custom analysis templates with specific prompts
- Apply templates to repositories
- Share templates across repos
- UI for template management

**Slice B: Scheduled Analysis**
- Configure cron schedules per repository
- Automatic re-analysis on schedule
- Compare changes between runs
- Notification when new docs are ready

**Slice C: Organization & Discovery**
- Tag-based repository organization
- Search/filter by tags, language, framework
- Bulk operations (analyze multiple repos)
- Team/project workspaces

### 3. Extensibility Layer

**Adapter Interfaces:**
- `ILLMProvider` - Swap OpenAI for Anthropic, local LLMs, etc.
- `INotificationAdapter` - Send alerts via email, Slack, Discord, webhooks
- `IStorageAdapter` - Alternative storage for artifacts (S3, local, CDN)
- `IMetricsAdapter` - Push metrics to Prometheus, DataDog, etc.
- `IRepoProvider` - Extend beyond GitHub (GitLab, Bitbucket, etc.)

**Event System:**
- Domain events for all state changes
- Event bus for cross-service integration
- Webhook support for external systems

### 4. Production Hardening

**Observability:**
- Structured logging with correlation IDs
- Metrics collection (analysis duration, success rate, etc.)
- Health checks with detailed status
- Performance monitoring

**Reliability:**
- Retry logic with exponential backoff
- Graceful degradation when LLM unavailable
- Rate limiting and queue management
- Database connection pooling

**Quality:**
- Comprehensive integration tests
- E2E tests for critical flows
- Load testing fixtures
- Error scenario coverage

### 5. Developer Experience

**Enhanced DX:**
- CLI tool for common operations (analyze, seed, migrate)
- Better seed data with 5+ personas
- Development fixtures for testing
- API client SDK generation
- Interactive examples

**Documentation:**
- Architecture diagrams (C4, system context)
- Integration recipes
- Plugin development guide
- API reference with examples
- Deployment guides

### 6. Future-Proofing

**Designed for Integration:**
- Webhook endpoints for CI/CD
- SSO/Auth adapter (for multi-tenant scenarios)
- API rate limiting and quotas
- Audit logging
- Data export capabilities

**Scalability Foundations:**
- Queue-based analysis execution
- Horizontal scaling support
- Cache layer for frequently accessed docs
- Background job infrastructure

## Success Metrics

By end of Phase 3, this repository should:
- ✅ Be 10x larger in functionality and utility
- ✅ Have 3+ complete vertical slices with UI and API
- ✅ Support extension without code modification (adapters)
- ✅ Include 100+ unit/integration tests
- ✅ Have rich seed data demonstrating all features
- ✅ Include comprehensive documentation for integration
- ✅ Be production-ready for multi-tenant deployment
- ✅ Serve as a reference implementation for other services

## Implementation Timeline

**Week 1: Domain & Vertical Slices**
- Expand schema with new entities
- Implement Template system (Slice A)
- Implement Scheduled Analysis (Slice B)

**Week 2: Extensibility & Integrations**
- Create adapter interfaces
- Implement event system
- Add notification adapters
- Add metrics collection

**Week 3: Quality & Production**
- Comprehensive test suite
- Logging and observability
- Error handling improvements
- Performance optimization

**Week 4: Documentation & Polish**
- Architecture documentation
- Integration guides
- API reference
- Example applications

---

**Note**: This document serves as the roadmap for Phase 3. Each section will be implemented incrementally while maintaining backwards compatibility with Phase 2.
