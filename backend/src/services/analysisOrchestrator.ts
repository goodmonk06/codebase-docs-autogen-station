import { getPrismaClient } from '../lib/prisma';
import { createRepoSource } from './repoSource';
import { RepositoryScanner } from './scanner';
import { LLMService } from './llmService';
import { DiagramGenerator } from './diagramGenerator';
import { eventBus } from '../lib/events/DomainEvents';
import { logger, generateCorrelationId } from '../lib/logger';
import { ConsoleMetricsAdapter } from '../lib/adapters/implementations/ConsoleMetricsAdapter';
import { IMetricsAdapter } from '../lib/adapters/IMetricsAdapter';

const prisma = getPrismaClient();

export class AnalysisOrchestrator {
  private llmService: LLMService;
  private diagramGenerator: DiagramGenerator;
  private metricsAdapter: IMetricsAdapter;

  constructor(metricsAdapter?: IMetricsAdapter) {
    this.llmService = new LLMService();
    this.diagramGenerator = new DiagramGenerator();
    this.metricsAdapter = metricsAdapter || new ConsoleMetricsAdapter();
  }

  /**
   * Execute a full analysis run for a repository
   */
  async executeAnalysis(
    repoId: string,
    refName: string = 'main',
    triggeredBy: string = 'manual'
  ): Promise<string> {
    const correlationId = generateCorrelationId();

    // Get repo config to check for template
    const repoConfig = await prisma.repoConfig.findUnique({
      where: { id: repoId },
      include: { template: true },
    });

    if (!repoConfig) {
      throw new Error(`RepoConfig not found: ${repoId}`);
    }

    // Create analysis run record
    const run = await prisma.analysisRun.create({
      data: {
        repoId,
        refName,
        status: 'pending',
        templateId: repoConfig.templateId,
        triggeredBy,
      },
    });

    logger.info('Analysis run created', {
      correlationId,
      runId: run.id,
      repoId,
      triggeredBy,
      hasTemplate: !!repoConfig.templateId,
    });

    // Emit event
    await eventBus.publish({
      type: 'analysis.started',
      timestamp: new Date(),
      aggregateId: run.id,
      correlationId,
      data: {
        runId: run.id,
        repoId,
        repoName: repoConfig.name,
        refName,
        triggeredBy,
      },
    });

    // Start async analysis
    this.runAnalysisAsync(run.id, repoId, refName, correlationId).catch((error) => {
      logger.error('Analysis failed', error, { correlationId, runId: run.id });
      prisma.analysisRun
        .update({
          where: { id: run.id },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            errorMessage: error.message,
          },
        })
        .catch(console.error);

      eventBus.publish({
        type: 'analysis.failed',
        timestamp: new Date(),
        aggregateId: run.id,
        correlationId,
        data: {
          runId: run.id,
          repoId,
          error: error.message,
        },
      });
    });

    return run.id;
  }

  private async runAnalysisAsync(runId: string, repoId: string, refName: string, correlationId: string) {
    const startTime = Date.now();
    const runLogger = logger.child({ correlationId, runId, repoId });

    try {
      // Update status to running
      await prisma.analysisRun.update({
        where: { id: runId },
        data: { status: 'running' },
      });

      // Get repo config with template
      const repoConfig = await prisma.repoConfig.findUnique({
        where: { id: repoId },
        include: { template: true },
      });

      if (!repoConfig) {
        throw new Error(`RepoConfig not found: ${repoId}`);
      }

      runLogger.info('Starting analysis', { repoName: repoConfig.name });

      // Step 1: Prepare repository (clone/pull)
      const repoSource = createRepoSource(repoConfig, refName);
      const repoPath = await repoSource.prepare();
      runLogger.info('Repository prepared', { repoPath });

      // Step 2: Scan repository
      const scanStart = Date.now();
      const scanner = new RepositoryScanner(repoPath);
      const summary = await scanner.scan();
      const scanDuration = Date.now() - scanStart;

      runLogger.info('Repository scanned', {
        modules: summary.modules.length,
        dependencies: Object.keys(summary.dependencies.production).length,
        durationMs: scanDuration,
      });

      this.metricsAdapter.recordTiming('scan_duration', scanDuration, {
        repoId,
        language: summary.language,
      });

      this.metricsAdapter.recordCounter('modules_found', summary.modules.length, { repoId });

      // Step 3: Generate documentation with LLM (using template if available)
      const llmStart = Date.now();
      const docs = await this.llmService.generateDocumentation(
        summary,
        repoConfig.template || undefined
      );
      const llmDuration = Date.now() - llmStart;

      runLogger.info('Documentation generated', { durationMs: llmDuration });

      this.metricsAdapter.recordTiming('llm_generation_duration', llmDuration, { repoId });

      // Step 4: Generate diagrams
      const diagramPuml = this.diagramGenerator.generatePlantUML(summary);
      const diagramDot = this.diagramGenerator.generateGraphvizDot(summary);
      runLogger.info('Diagrams generated');

      // Step 5: Save artifacts
      await this.saveArtifacts(runId, {
        ...docs,
        diagramPuml,
        diagramDot,
      });

      const totalDuration = Date.now() - startTime;

      // Calculate stats
      const filesScanned = this.countFiles(summary.fileStructure);
      const linesScanned = summary.modules.length * 50; // Rough estimate

      // Step 6: Update run status with metrics
      await prisma.analysisRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          finishedAt: new Date(),
          durationMs: totalDuration,
          filesScanned,
          linesScanned,
          artifactsJson: JSON.stringify(summary, null, 2),
        },
      });

      // Save metrics to database
      await this.saveMetrics(runId, {
        scan_duration: scanDuration,
        llm_duration: llmDuration,
        total_duration: totalDuration,
        modules_found: summary.modules.length,
        files_scanned: filesScanned,
        dependencies_count: Object.keys(summary.dependencies.production).length,
      });

      // Update repo last analyzed timestamp
      await prisma.repoConfig.update({
        where: { id: repoId },
        data: { lastAnalyzedAt: new Date() },
      });

      runLogger.info('Analysis completed', {
        durationMs: totalDuration,
        filesScanned,
        linesScanned,
      });

      // Emit completion event
      await eventBus.publish({
        type: 'analysis.completed',
        timestamp: new Date(),
        aggregateId: runId,
        correlationId,
        data: {
          runId,
          repoId,
          repoName: repoConfig.name,
          durationMs: totalDuration,
          filesScanned,
          modulesFound: summary.modules.length,
        },
      });

      this.metricsAdapter.recordCounter('analysis_completed', 1, {
        repoId,
        triggeredBy: 'manual',
      });
    } catch (error) {
      runLogger.error('Analysis error', error as Error);
      this.metricsAdapter.recordCounter('analysis_failed', 1, { repoId });
      throw error;
    }
  }

  private countFiles(node: any): number {
    if (node.type === 'file') return 1;
    if (node.type === 'directory' && node.children) {
      return node.children.reduce((sum: number, child: any) => sum + this.countFiles(child), 0);
    }
    return 0;
  }

  private async saveMetrics(runId: string, metrics: Record<string, number>) {
    const metricPromises = Object.entries(metrics).map(([name, value]) =>
      prisma.analysisMetrics.create({
        data: {
          runId,
          metricName: name,
          metricValue: value,
          unit: name.includes('duration') ? 'ms' : 'count',
        },
      })
    );

    await Promise.all(metricPromises);
  }

  private async saveArtifacts(
    runId: string,
    docs: {
      architecture: string;
      apiDocs: string;
      readme: string;
      diagramPuml: string;
      diagramDot: string;
    }
  ) {
    const artifacts = [
      { type: 'arch_doc', content: docs.architecture, path: 'architecture.md' },
      { type: 'api_doc', content: docs.apiDocs, path: 'api-docs.md' },
      { type: 'readme', content: docs.readme, path: 'README.md' },
      { type: 'diagram_puml', content: docs.diagramPuml, path: 'architecture.puml' },
      { type: 'diagram_dot', content: docs.diagramDot, path: 'dependencies.dot' },
    ];

    for (const artifact of artifacts) {
      const wordCount = artifact.content.split(/\s+/).length;

      await prisma.generatedArtifact.create({
        data: {
          runId,
          type: artifact.type,
          path: artifact.path,
          content: artifact.content,
          wordCount,
        },
      });
    }
  }
}
