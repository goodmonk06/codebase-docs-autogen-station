/**
 * Repository Provider Interface
 * Allows extending beyond GitHub to GitLab, Bitbucket, Azure DevOps, etc.
 */
export interface IRepoProvider {
  name: string;

  /**
   * Check if this provider can handle the given repository URL
   */
  canHandle(repoUrl: string): boolean;

  /**
   * Clone or update repository to local path
   */
  prepare(repoUrl: string, branch: string, targetPath: string): Promise<void>;

  /**
   * Get repository metadata
   */
  getMetadata(repoUrl: string): Promise<RepoProviderMetadata>;

  /**
   * List branches
   */
  listBranches(repoUrl: string): Promise<string[]>;

  /**
   * Get latest commit information
   */
  getLatestCommit(repoUrl: string, branch: string): Promise<CommitInfo>;
}

export interface RepoProviderMetadata {
  name: string;
  description?: string;
  defaultBranch: string;
  language?: string;
  stars?: number;
  forks?: number;
  lastUpdated?: Date;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  date: Date;
}
