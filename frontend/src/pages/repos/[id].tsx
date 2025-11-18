import { useRouter } from 'next/router';
import Link from 'next/link';
import useSWR from 'swr';
import { api } from '@/lib/api';

export default function RepoDetail() {
  const router = useRouter();
  const { id } = router.query;

  const { data: repo, error } = useSWR(
    id ? `repo-${id}` : null,
    () => api.getRepo(id as string)
  );

  if (error) return <div className="p-8">Failed to load repository</div>;
  if (!repo) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Repositories
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{repo.name}</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Source:</span>
              <span className="ml-2 text-gray-900">
                {repo.githubUrl || repo.localPath}
              </span>
            </div>
            {repo.mainLanguage && (
              <div>
                <span className="font-semibold text-gray-700">Language:</span>
                <span className="ml-2 text-gray-900">{repo.mainLanguage}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-700">Created:</span>
              <span className="ml-2 text-gray-900">
                {new Date(repo.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Analysis Runs</h2>
          </div>

          {!repo.runs || repo.runs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No analysis runs yet. Click "Analyze" to create one.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {repo.runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="block px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Run #{run.id.substring(0, 8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Branch: {run.refName} | Started:{' '}
                        {new Date(run.startedAt).toLocaleString()}
                      </div>
                      {run.finishedAt && (
                        <div className="text-xs text-gray-400">
                          Finished: {new Date(run.finishedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          run.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : run.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : run.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
