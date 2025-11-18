import OpenAI from 'openai';
import { config } from '../config';
import { RepoSummary, GeneratedDocs } from '../types';

export class LLMService {
  private openai: OpenAI;

  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
  }

  async generateDocumentation(summary: RepoSummary): Promise<GeneratedDocs> {
    console.log('Generating documentation with LLM...');

    const [architecture, apiDocs, readme] = await Promise.all([
      this.generateArchitectureDoc(summary),
      this.generateApiDocs(summary),
      this.generateReadme(summary),
    ]);

    return {
      architecture,
      apiDocs,
      readme,
      diagramPuml: '',
      diagramDot: '',
    };
  }

  private async generateArchitectureDoc(summary: RepoSummary): Promise<string> {
    const summaryJson = JSON.stringify(
      {
        name: summary.name,
        language: summary.language,
        framework: summary.framework,
        modules: summary.modules.map((m) => ({
          path: m.path,
          name: m.name,
          type: m.type,
        })),
        dependencies: {
          production: Object.keys(summary.dependencies.production),
          development: Object.keys(summary.dependencies.development),
        },
      },
      null,
      2
    );

    const prompt = `You are a technical architect analyzing a codebase. Based on the following repository summary, create a comprehensive architecture overview document in Markdown format.

Repository Summary:
${summaryJson}

Please include:
1. **System Overview**: High-level description of what this system does
2. **Architecture Pattern**: Identify the architectural pattern (e.g., MVC, layered, microservices, etc.)
3. **Core Components**: List and describe the main components/modules and their responsibilities
4. **Technology Stack**: Programming language, framework, key dependencies
5. **Data Flow**: How data flows through the system
6. **Key Design Decisions**: Notable patterns or architectural choices

Format the output as a well-structured Markdown document with clear headings and sections.`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || '# Architecture Overview\n\nNo content generated.';
  }

  private async generateApiDocs(summary: RepoSummary): Promise<string> {
    const controllers = summary.modules.filter((m) => m.type === 'controller' || m.type === 'route');
    const services = summary.modules.filter((m) => m.type === 'service');

    const summaryJson = JSON.stringify(
      {
        name: summary.name,
        framework: summary.framework,
        controllers: controllers.map((c) => ({
          name: c.name,
          path: c.path,
          exports: c.exports,
        })),
        services: services.map((s) => ({
          name: s.name,
          path: s.path,
          exports: s.exports,
        })),
      },
      null,
      2
    );

    const prompt = `You are a technical writer creating API documentation. Based on the following repository information, generate comprehensive API documentation in Markdown format.

Repository Information:
${summaryJson}

Please include:
1. **API Overview**: Brief description of the API
2. **Endpoints**: List potential endpoints based on controllers/routes (use common REST patterns)
3. **Services**: Describe key services and their purposes
4. **Request/Response Format**: Expected data formats
5. **Authentication**: If applicable (mention common patterns for the framework)
6. **Error Handling**: Common error responses

Format the output as a well-structured Markdown document. Make reasonable assumptions based on the framework and module names.`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || '# API Documentation\n\nNo content generated.';
  }

  private async generateReadme(summary: RepoSummary): Promise<string> {
    const summaryJson = JSON.stringify(
      {
        name: summary.name,
        language: summary.language,
        packageManager: summary.packageManager,
        framework: summary.framework,
        entrypoints: summary.entrypoints,
        dependencies: Object.keys(summary.dependencies.production).slice(0, 10),
      },
      null,
      2
    );

    const prompt = `You are a developer creating a README for a project. Based on the following repository summary, generate a comprehensive README.md file.

Repository Summary:
${summaryJson}

Please include:
1. **Project Title and Description**: Clear, concise description
2. **Features**: Key features and capabilities
3. **Prerequisites**: Required tools and versions
4. **Installation**: Step-by-step installation instructions
5. **Usage**: How to run and use the project
6. **Project Structure**: Overview of the directory structure
7. **Development**: How to set up for development
8. **Contributing**: Basic contribution guidelines
9. **License**: Mention that license should be added

Format as a professional README.md with proper Markdown formatting, badges (if appropriate), and clear sections.`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2500,
    });

    return response.choices[0].message.content || '# Project\n\nNo content generated.';
  }
}
