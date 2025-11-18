import { PrismaClient } from '@prisma/client';
import { createRepoSource } from './repoSource';
import { RepositoryScanner } from './scanner';
import { LLMService } from './llmService';
import { DiagramGenerator } from './diagramGenerator';

const prisma = new PrismaClient();

export class AnalysisOrchestrator {
  private llmService: LLMService;
  private diagramGenerator: DiagramGenerator;

  constructor() {
    this.llmService = new LLMService();
    this.diagramGenerator = new DiagramGenerator();
  }

  /**
   * Execute a full analysis run for a repository
   */
  async executeAnalysis(repoId: string, refName: string = 'main'): Promise<string> {
    // Create analysis run record
    const run = await prisma.analysisRun.create({
      data: {
        repoId,
        refName,
        status: 'pending',
      },
    });

    // Start async analysis
    this.runAnalysisAsync(run.id, repoId, refName).catch((error) => {
      console.error('Analysis failed:', error);
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
    });

    return run.id;
  }

  private async runAnalysisAsync(runId: string, repoId: string, refName: string) {
    try {
      // Update status to running
      await prisma.analysisRun.update({
        where: { id: runId },
        data: { status: 'running' },
      });

      // Get repo config
      const repoConfig = await prisma.repoConfig.findUnique({
        where: { id: repoId },
      });

      if (!repoConfig) {
        throw new Error(`RepoConfig not found: ${repoId}`);
      }

      console.log(`Starting analysis for ${repoConfig.name}...`);

      // Step 1: Prepare repository (clone/pull)
      const repoSource = createRepoSource(repoConfig, refName);
      const repoPath = await repoSource.prepare();
      console.log(`Repository prepared at: ${repoPath}`);

      // Step 2: Scan repository
      const scanner = new RepositoryScanner(repoPath);
      const summary = await scanner.scan();
      console.log(`Repository scanned: ${summary.modules.length} modules found`);

      // Step 3: Generate documentation with LLM
      const docs = await this.llmService.generateDocumentation(summary);
      console.log('Documentation generated');

      // Step 4: Generate diagrams
      const diagramPuml = this.diagramGenerator.generatePlantUML(summary);
      const diagramDot = this.diagramGenerator.generateGraphvizDot(summary);
      console.log('Diagrams generated');

      // Step 5: Save artifacts
      await this.saveArtifacts(runId, {
        ...docs,
        diagramPuml,
        diagramDot,
      });

      // Step 6: Update run status
      await prisma.analysisRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          finishedAt: new Date(),
          artifactsJson: JSON.stringify(summary, null, 2),
        },
      });

      console.log(`Analysis completed for run ${runId}`);
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
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
      await prisma.generatedArtifact.create({
        data: {
          runId,
          type: artifact.type,
          path: artifact.path,
          content: artifact.content,
        },
      });
    }
  }
}
