const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RepoConfig {
  id: string;
  name: string;
  githubUrl?: string | null;
  localPath?: string | null;
  mainLanguage?: string | null;
  createdAt: string;
  updatedAt: string;
  runs?: AnalysisRun[];
}

export interface AnalysisRun {
  id: string;
  repoId: string;
  refName: string;
  startedAt: string;
  finishedAt?: string | null;
  status: string;
  artifactsJson?: string | null;
  errorMessage?: string | null;
  repo?: RepoConfig;
  artifacts?: GeneratedArtifact[];
}

export interface GeneratedArtifact {
  id: string;
  runId: string;
  type: string;
  path: string;
  content: string;
  createdAt: string;
}

export const api = {
  // Repos
  async getRepos(): Promise<RepoConfig[]> {
    const res = await fetch(`${API_URL}/api/repos`);
    if (!res.ok) throw new Error('Failed to fetch repos');
    return res.json();
  },

  async getRepo(id: string): Promise<RepoConfig> {
    const res = await fetch(`${API_URL}/api/repos/${id}`);
    if (!res.ok) throw new Error('Failed to fetch repo');
    return res.json();
  },

  async createRepo(data: {
    name: string;
    githubUrl?: string;
    localPath?: string;
    mainLanguage?: string;
  }): Promise<RepoConfig> {
    const res = await fetch(`${API_URL}/api/repos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create repo');
    return res.json();
  },

  async deleteRepo(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/repos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete repo');
  },

  async triggerAnalysis(id: string, refName: string = 'main'): Promise<{ runId: string }> {
    const res = await fetch(`${API_URL}/api/repos/${id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refName }),
    });
    if (!res.ok) throw new Error('Failed to trigger analysis');
    return res.json();
  },

  // Runs
  async getRuns(): Promise<AnalysisRun[]> {
    const res = await fetch(`${API_URL}/api/runs`);
    if (!res.ok) throw new Error('Failed to fetch runs');
    return res.json();
  },

  async getRun(id: string): Promise<AnalysisRun> {
    const res = await fetch(`${API_URL}/api/runs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch run');
    return res.json();
  },

  async getArtifacts(runId: string, type?: string): Promise<GeneratedArtifact[]> {
    const url = type
      ? `${API_URL}/api/runs/${runId}/artifacts?type=${type}`
      : `${API_URL}/api/runs/${runId}/artifacts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch artifacts');
    return res.json();
  },
};
