import fs from 'fs';
import path from 'path';
import { RepoSummary, ModuleInfo, FileNode, DependencyInfo, DependencyNode } from '../types';

/**
 * Scans a repository and creates a comprehensive summary
 */
export class RepositoryScanner {
  private ignoredDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    'target',
    '__pycache__',
    '.venv',
    'venv',
  ]);

  private ignoredFiles = new Set(['.DS_Store', 'Thumbs.db', '.gitkeep']);

  constructor(private repoPath: string) {}

  async scan(): Promise<RepoSummary> {
    const packageInfo = await this.analyzePackageInfo();
    const fileStructure = this.buildFileTree(this.repoPath);
    const modules = await this.discoverModules();
    const dependencies = await this.analyzeDependencies();

    return {
      name: path.basename(this.repoPath),
      language: packageInfo.language,
      packageManager: packageInfo.packageManager,
      framework: packageInfo.framework,
      entrypoints: packageInfo.entrypoints,
      modules,
      dependencies,
      fileStructure,
    };
  }

  private async analyzePackageInfo() {
    let language = 'Unknown';
    let packageManager: RepoSummary['packageManager'];
    let framework: string | undefined;
    let entrypoints: string[] = [];

    // JavaScript/TypeScript
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      language = 'JavaScript/TypeScript';

      // Detect package manager
      if (fs.existsSync(path.join(this.repoPath, 'pnpm-lock.yaml'))) {
        packageManager = 'pnpm';
      } else if (fs.existsSync(path.join(this.repoPath, 'yarn.lock'))) {
        packageManager = 'yarn';
      } else {
        packageManager = 'npm';
      }

      // Detect framework
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (deps['next']) framework = 'Next.js';
      else if (deps['react']) framework = 'React';
      else if (deps['vue']) framework = 'Vue';
      else if (deps['@angular/core']) framework = 'Angular';
      else if (deps['fastify']) framework = 'Fastify';
      else if (deps['express']) framework = 'Express';
      else if (deps['nestjs']) framework = 'NestJS';

      // Find entrypoints
      if (packageJson.main) entrypoints.push(packageJson.main);
      if (packageJson.bin) {
        if (typeof packageJson.bin === 'string') {
          entrypoints.push(packageJson.bin);
        } else {
          entrypoints.push(...Object.values(packageJson.bin));
        }
      }
    }

    // Python
    if (fs.existsSync(path.join(this.repoPath, 'requirements.txt')) ||
        fs.existsSync(path.join(this.repoPath, 'setup.py'))) {
      language = 'Python';
      packageManager = 'pip';
    }

    // Java
    if (fs.existsSync(path.join(this.repoPath, 'pom.xml'))) {
      language = 'Java';
      packageManager = 'maven';
    } else if (fs.existsSync(path.join(this.repoPath, 'build.gradle'))) {
      language = 'Java';
      packageManager = 'gradle';
    }

    // Rust
    if (fs.existsSync(path.join(this.repoPath, 'Cargo.toml'))) {
      language = 'Rust';
      packageManager = 'cargo';
    }

    return { language, packageManager, framework, entrypoints };
  }

  private buildFileTree(dirPath: string, relativePath: string = ''): FileNode {
    const stats = fs.statSync(dirPath);
    const name = path.basename(dirPath);

    if (stats.isDirectory()) {
      if (this.ignoredDirs.has(name)) {
        return { name, path: relativePath || name, type: 'directory', children: [] };
      }

      const children: FileNode[] = [];
      try {
        const entries = fs.readdirSync(dirPath);
        for (const entry of entries) {
          if (this.ignoredFiles.has(entry)) continue;

          const fullPath = path.join(dirPath, entry);
          const relPath = relativePath ? path.join(relativePath, entry) : entry;
          children.push(this.buildFileTree(fullPath, relPath));
        }
      } catch (err) {
        // Permission denied or other error
      }

      return {
        name,
        path: relativePath || name,
        type: 'directory',
        children: children.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      };
    } else {
      return { name, path: relativePath || name, type: 'file' };
    }
  }

  private async discoverModules(): Promise<ModuleInfo[]> {
    const modules: ModuleInfo[] = [];
    const commonSourceDirs = ['src', 'lib', 'app', 'packages', 'services'];

    for (const dir of commonSourceDirs) {
      const dirPath = path.join(this.repoPath, dir);
      if (fs.existsSync(dirPath)) {
        this.scanForModules(dirPath, dir, modules);
      }
    }

    return modules;
  }

  private scanForModules(dirPath: string, relativePath: string, modules: ModuleInfo[]) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (this.ignoredDirs.has(entry.name) || this.ignoredFiles.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        this.scanForModules(fullPath, relPath, modules);
      } else if (entry.isFile()) {
        const moduleInfo = this.analyzeFile(fullPath, relPath);
        if (moduleInfo) {
          modules.push(moduleInfo);
        }
      }
    }
  }

  private analyzeFile(filePath: string, relativePath: string): ModuleInfo | null {
    const ext = path.extname(filePath);
    const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.rs', '.go'];

    if (!supportedExtensions.includes(ext)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, ext);

    // Determine module type based on naming conventions
    let type: ModuleInfo['type'] = 'unknown';
    const lowerName = fileName.toLowerCase();

    if (lowerName.includes('service')) type = 'service';
    else if (lowerName.includes('controller') || lowerName.includes('handler')) type = 'controller';
    else if (lowerName.includes('model') || lowerName.includes('entity') || lowerName.includes('schema')) type = 'model';
    else if (lowerName.includes('util') || lowerName.includes('helper')) type = 'util';
    else if (lowerName.includes('config')) type = 'config';
    else if (lowerName.includes('component')) type = 'component';
    else if (lowerName.includes('route') || lowerName.includes('router')) type = 'route';
    else if (lowerName.includes('middleware')) type = 'middleware';

    // Extract imports and exports (simple regex-based)
    const imports = this.extractImports(content, ext);
    const exports = this.extractExports(content, ext);

    return {
      path: relativePath,
      name: fileName,
      type,
      imports,
      exports,
    };
  }

  private extractImports(content: string, ext: string): string[] {
    const imports: string[] = [];

    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      // Match import statements
      const importRegex = /import\s+(?:{[^}]+}|[\w\s,]+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    } else if (ext === '.py') {
      const importRegex = /(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    }

    return imports;
  }

  private extractExports(content: string, ext: string): string[] {
    const exports: string[] = [];

    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      // Match export statements
      const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([\w]+)/g;
      let match;
      while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
    }

    return exports;
  }

  private async analyzeDependencies(): Promise<DependencyInfo> {
    const production: Record<string, string> = {};
    const development: Record<string, string> = {};
    const graph: DependencyNode[] = [];

    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (packageJson.dependencies) {
        Object.assign(production, packageJson.dependencies);
      }

      if (packageJson.devDependencies) {
        Object.assign(development, packageJson.devDependencies);
      }

      // Build simple dependency graph from package.json
      Object.keys(production).forEach((dep) => {
        graph.push({ name: dep, dependsOn: [] });
      });
    }

    return { production, development, graph };
  }
}
