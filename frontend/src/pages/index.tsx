import { useState } from 'react';
import useSWR from 'swr';
import { api, RepoConfig } from '@/lib/api';
import Link from 'next/link';

export default function Home() {
  const { data: repos, error, mutate } = useSWR('repos', api.getRepos);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    githubUrl: '',
    localPath: '',
    mainLanguage: '',
  });
  const [sourceType, setSourceType] = useState<'github' | 'local'>('github');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        name: formData.name,
        mainLanguage: formData.mainLanguage || undefined,
      };

      if (sourceType === 'github') {
        data.githubUrl = formData.githubUrl;
      } else {
        data.localPath = formData.localPath;
      }

      await api.createRepo(data);
      setShowForm(false);
      setFormData({ name: '', githubUrl: '', localPath: '', mainLanguage: '' });
      mutate();
    } catch (err) {
      alert('Failed to create repository');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repository?')) return;

    try {
      await api.deleteRepo(id);
      mutate();
    } catch (err) {
      alert('Failed to delete repository');
    }
  };

  const handleAnalyze = async (id: string) => {
    try {
      const result = await api.triggerAnalysis(id);
      alert(`Analysis started! Run ID: ${result.runId}`);
      mutate();
    } catch (err) {
      alert('Failed to trigger analysis');
    }
  };

  if (error) return <div className="p-8">Failed to load repositories</div>;
  if (!repos) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Codebase Documentation Generator</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Repository'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Repository</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="my-awesome-project"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={sourceType === 'github'}
                      onChange={() => setSourceType('github')}
                      className="mr-2"
                    />
                    <span className="text-gray-900">GitHub URL</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={sourceType === 'local'}
                      onChange={() => setSourceType('local')}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Local Path</span>
                  </label>
                </div>
              </div>

              {sourceType === 'github' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub URL *
                  </label>
                  <input
                    type="url"
                    required={sourceType === 'github'}
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    placeholder="https://github.com/user/repo.git"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Local Path *
                  </label>
                  <input
                    type="text"
                    required={sourceType === 'local'}
                    value={formData.localPath}
                    onChange={(e) => setFormData({ ...formData, localPath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    placeholder="/path/to/local/repo"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Language (optional)
                </label>
                <input
                  type="text"
                  value={formData.mainLanguage}
                  onChange={(e) => setFormData({ ...formData, mainLanguage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="TypeScript, Python, etc."
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Repository
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Repositories</h2>
          </div>

          {repos.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No repositories yet. Add one to get started!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {repos.map((repo: RepoConfig) => (
                <div key={repo.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/repos/${repo.id}`}
                        className="text-lg font-medium text-blue-600 hover:text-blue-800"
                      >
                        {repo.name}
                      </Link>
                      <div className="mt-1 text-sm text-gray-500">
                        {repo.githubUrl && <span>GitHub: {repo.githubUrl}</span>}
                        {repo.localPath && <span>Local: {repo.localPath}</span>}
                        {repo.mainLanguage && (
                          <span className="ml-4 px-2 py-1 bg-gray-100 rounded text-xs">
                            {repo.mainLanguage}
                          </span>
                        )}
                      </div>
                      {repo.runs && repo.runs.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          Last run: {new Date(repo.runs[0].startedAt).toLocaleString()} -{' '}
                          <span
                            className={`font-semibold ${
                              repo.runs[0].status === 'completed'
                                ? 'text-green-600'
                                : repo.runs[0].status === 'failed'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            {repo.runs[0].status}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAnalyze(repo.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Analyze
                      </button>
                      <button
                        onClick={() => handleDelete(repo.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
