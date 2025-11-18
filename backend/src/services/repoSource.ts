import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs';
import { RepoSource, RepoMetadata } from '../types';
import { config } from '../config';

/**
 * RepoSource implementation for GitHub repositories
 */
export class GitHubRepoSource implements RepoSource {
  private git: SimpleGit;
  private localPath: string;

  constructor(
    private githubUrl: string,
    private repoName: string,
    private refName: string = 'main'
  ) {
    this.localPath = path.join(config.workspace.dir, repoName);
    this.git = simpleGit();
  }

  async prepare(): Promise<string> {
    // Check if repo already exists
    if (fs.existsSync(this.localPath)) {
      console.log(`Repository exists at ${this.localPath}, pulling latest...`);
      const repoGit = simpleGit(this.localPath);

      // Fetch and checkout the specified ref
      await repoGit.fetch();
      await repoGit.checkout(this.refName);
      await repoGit.pull('origin', this.refName);
    } else {
      console.log(`Cloning repository to ${this.localPath}...`);
      await this.git.clone(this.githubUrl, this.localPath, ['--depth', '1', '--branch', this.refName]);
    }

    return this.localPath;
  }

  async getMetadata(): Promise<RepoMetadata> {
    const repoGit = simpleGit(this.localPath);
    const remotes = await repoGit.getRemotes(true);
    const branch = await repoGit.revparse(['--abbrev-ref', 'HEAD']);

    return {
      name: this.repoName,
      defaultBranch: branch.trim(),
      language: await this.detectLanguage(),
    };
  }

  private async detectLanguage(): Promise<string | undefined> {
    const detectors = [
      { file: 'package.json', language: 'JavaScript/TypeScript' },
      { file: 'pom.xml', language: 'Java' },
      { file: 'build.gradle', language: 'Java' },
      { file: 'Cargo.toml', language: 'Rust' },
      { file: 'go.mod', language: 'Go' },
      { file: 'requirements.txt', language: 'Python' },
      { file: 'setup.py', language: 'Python' },
      { file: 'Gemfile', language: 'Ruby' },
    ];

    for (const { file, language } of detectors) {
      if (fs.existsSync(path.join(this.localPath, file))) {
        return language;
      }
    }

    return undefined;
  }
}

/**
 * RepoSource implementation for local repositories
 */
export class LocalRepoSource implements RepoSource {
  constructor(
    private localPath: string,
    private repoName: string
  ) {}

  async prepare(): Promise<string> {
    if (!fs.existsSync(this.localPath)) {
      throw new Error(`Local path does not exist: ${this.localPath}`);
    }
    return this.localPath;
  }

  async getMetadata(): Promise<RepoMetadata> {
    const repoGit = simpleGit(this.localPath);
    let branch = 'unknown';

    try {
      branch = (await repoGit.revparse(['--abbrev-ref', 'HEAD'])).trim();
    } catch (err) {
      // Not a git repo, that's okay
    }

    return {
      name: this.repoName,
      defaultBranch: branch,
      language: await this.detectLanguage(),
    };
  }

  private async detectLanguage(): Promise<string | undefined> {
    const detectors = [
      { file: 'package.json', language: 'JavaScript/TypeScript' },
      { file: 'pom.xml', language: 'Java' },
      { file: 'build.gradle', language: 'Java' },
      { file: 'Cargo.toml', language: 'Rust' },
      { file: 'go.mod', language: 'Go' },
      { file: 'requirements.txt', language: 'Python' },
      { file: 'setup.py', language: 'Python' },
      { file: 'Gemfile', language: 'Ruby' },
    ];

    for (const { file, language } of detectors) {
      if (fs.existsSync(path.join(this.localPath, file))) {
        return language;
      }
    }

    return undefined;
  }
}

/**
 * Factory function to create the appropriate RepoSource
 */
export function createRepoSource(
  repoConfig: { githubUrl?: string | null; localPath?: string | null; name: string },
  refName: string = 'main'
): RepoSource {
  if (repoConfig.githubUrl) {
    return new GitHubRepoSource(repoConfig.githubUrl, repoConfig.name, refName);
  } else if (repoConfig.localPath) {
    return new LocalRepoSource(repoConfig.localPath, repoConfig.name);
  } else {
    throw new Error('RepoConfig must have either githubUrl or localPath');
  }
}
