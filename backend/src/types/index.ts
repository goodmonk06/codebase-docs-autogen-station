// Core types and interfaces

export interface RepoSource {
  /**
   * Clone or update a repository to the workspace
   * @returns path to the local repository
   */
  prepare(): Promise<string>;

  /**
   * Get repository metadata
   */
  getMetadata(): Promise<RepoMetadata>;
}

export interface RepoMetadata {
  name: string;
  defaultBranch: string;
  language?: string;
  description?: string;
}

export interface RepoSummary {
  name: string;
  language: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'maven' | 'gradle' | 'pip' | 'cargo';
  framework?: string;
  entrypoints: string[];
  modules: ModuleInfo[];
  dependencies: DependencyInfo;
  fileStructure: FileNode;
}

export interface ModuleInfo {
  path: string;
  name: string;
  type: 'service' | 'controller' | 'model' | 'util' | 'config' | 'component' | 'route' | 'middleware' | 'unknown';
  exports?: string[];
  imports?: string[];
  description?: string;
}

export interface DependencyInfo {
  production: Record<string, string>;
  development: Record<string, string>;
  graph: DependencyNode[];
}

export interface DependencyNode {
  name: string;
  dependsOn: string[];
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface GeneratedDocs {
  architecture: string;
  apiDocs: string;
  readme: string;
  diagramPuml: string;
  diagramDot: string;
}

export type ArtifactType = 'arch_doc' | 'api_doc' | 'readme' | 'diagram_puml' | 'diagram_dot';
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';
