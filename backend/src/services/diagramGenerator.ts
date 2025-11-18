import { RepoSummary, DependencyNode } from '../types';

export class DiagramGenerator {
  /**
   * Generate PlantUML diagram for the repository structure
   */
  generatePlantUML(summary: RepoSummary): string {
    let puml = '@startuml\n';
    puml += `title ${summary.name} - Architecture Diagram\n\n`;

    // Add components
    const serviceModules = summary.modules.filter((m) => m.type === 'service');
    const controllerModules = summary.modules.filter((m) => m.type === 'controller');
    const modelModules = summary.modules.filter((m) => m.type === 'model');

    if (controllerModules.length > 0) {
      puml += 'package "Controllers" {\n';
      controllerModules.forEach((m) => {
        puml += `  [${m.name}]\n`;
      });
      puml += '}\n\n';
    }

    if (serviceModules.length > 0) {
      puml += 'package "Services" {\n';
      serviceModules.forEach((m) => {
        puml += `  [${m.name}]\n`;
      });
      puml += '}\n\n';
    }

    if (modelModules.length > 0) {
      puml += 'package "Models" {\n';
      modelModules.forEach((m) => {
        puml += `  [${m.name}]\n`;
      });
      puml += '}\n\n';
    }

    // Add database if models exist
    if (modelModules.length > 0) {
      puml += 'database "Database" {\n';
      puml += '  [Data Storage]\n';
      puml += '}\n\n';
    }

    // Add relationships
    if (controllerModules.length > 0 && serviceModules.length > 0) {
      controllerModules.forEach((controller) => {
        serviceModules.forEach((service) => {
          // Check if controller imports service
          if (controller.imports?.some((imp) => imp.includes(service.name))) {
            puml += `[${controller.name}] --> [${service.name}]\n`;
          }
        });
      });
    }

    if (serviceModules.length > 0 && modelModules.length > 0) {
      serviceModules.forEach((service) => {
        modelModules.forEach((model) => {
          if (service.imports?.some((imp) => imp.includes(model.name))) {
            puml += `[${service.name}] --> [${model.name}]\n`;
          }
        });
      });
    }

    if (modelModules.length > 0) {
      modelModules.forEach((model) => {
        puml += `[${model.name}] --> [Data Storage]\n`;
      });
    }

    puml += '\n@enduml';
    return puml;
  }

  /**
   * Generate Graphviz DOT diagram for dependency graph
   */
  generateGraphvizDot(summary: RepoSummary): string {
    let dot = 'digraph Dependencies {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    // Add main application node
    dot += `  "${summary.name}" [shape=box, style="rounded,filled", fillcolor=lightblue];\n\n`;

    // Add production dependencies
    const prodDeps = Object.keys(summary.dependencies.production).slice(0, 15);
    if (prodDeps.length > 0) {
      dot += '  // Production Dependencies\n';
      prodDeps.forEach((dep) => {
        dot += `  "${dep}" [fillcolor=lightgreen, style="rounded,filled"];\n`;
        dot += `  "${summary.name}" -> "${dep}";\n`;
      });
      dot += '\n';
    }

    // Add development dependencies (lighter color)
    const devDeps = Object.keys(summary.dependencies.development).slice(0, 10);
    if (devDeps.length > 0) {
      dot += '  // Development Dependencies\n';
      devDeps.forEach((dep) => {
        dot += `  "${dep}" [fillcolor=lightyellow, style="rounded,filled"];\n`;
        dot += `  "${summary.name}" -> "${dep}" [style=dashed];\n`;
      });
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Generate component dependency diagram in PlantUML
   */
  generateComponentDiagram(summary: RepoSummary): string {
    let puml = '@startuml\n';
    puml += `title ${summary.name} - Component Dependencies\n\n`;

    // Group modules by type
    const modulesByType: Record<string, typeof summary.modules> = {};
    summary.modules.forEach((module) => {
      if (!modulesByType[module.type]) {
        modulesByType[module.type] = [];
      }
      modulesByType[module.type].push(module);
    });

    // Create components for each module
    Object.entries(modulesByType).forEach(([type, modules]) => {
      puml += `package "${type}" {\n`;
      modules.forEach((m) => {
        puml += `  component "${m.name}" as ${this.sanitizeId(m.name)}\n`;
      });
      puml += '}\n\n';
    });

    // Add dependencies between modules
    summary.modules.forEach((module) => {
      module.imports?.forEach((imp) => {
        // Find matching module
        const targetModule = summary.modules.find((m) =>
          imp.includes(m.name) || imp.includes(m.path)
        );
        if (targetModule && targetModule.name !== module.name) {
          puml += `${this.sanitizeId(module.name)} ..> ${this.sanitizeId(targetModule.name)}\n`;
        }
      });
    });

    puml += '\n@enduml';
    return puml;
  }

  private sanitizeId(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
  }
}
