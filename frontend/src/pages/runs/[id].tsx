import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useSWR from 'swr';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

export default function RunDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [selectedArtifact, setSelectedArtifact] = useState<string>('arch_doc');

  const { data: run, error } = useSWR(
    id ? `run-${id}` : null,
    () => api.getRun(id as string),
    { refreshInterval: 5000 }
  );

  if (error) return <div className="p-8">Failed to load run details</div>;
  if (!run) return <div className="p-8">Loading...</div>;

  const artifact = run.artifacts?.find((a) => a.type === selectedArtifact);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/repos/${run.repoId}`} className="text-blue-600 hover:text-blue-800">
            ← Back to Repository
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Analysis Run - {run.repo?.name}
            </h1>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
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

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Branch:</span>
              <span className="ml-2 text-gray-900">{run.refName}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Started:</span>
              <span className="ml-2 text-gray-900">
                {new Date(run.startedAt).toLocaleString()}
              </span>
            </div>
            {run.finishedAt && (
              <div>
                <span className="font-semibold text-gray-700">Finished:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(run.finishedAt).toLocaleString()}
                </span>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-700">Artifacts:</span>
              <span className="ml-2 text-gray-900">{run.artifacts?.length || 0}</span>
            </div>
          </div>

          {run.errorMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {run.errorMessage}
              </p>
            </div>
          )}
        </div>

        {run.status === 'completed' && run.artifacts && run.artifacts.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { type: 'arch_doc', label: 'Architecture' },
                  { type: 'api_doc', label: 'API Docs' },
                  { type: 'readme', label: 'README' },
                  { type: 'diagram_puml', label: 'PlantUML' },
                  { type: 'diagram_dot', label: 'GraphViz' },
                ].map((tab) => {
                  const hasArtifact = run.artifacts?.some((a) => a.type === tab.type);
                  if (!hasArtifact) return null;

                  return (
                    <button
                      key={tab.type}
                      onClick={() => setSelectedArtifact(tab.type)}
                      className={`px-6 py-3 text-sm font-medium ${
                        selectedArtifact === tab.type
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {artifact && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{artifact.path}</h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(artifact.content);
                        alert('Copied to clipboard!');
                      }}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                    >
                      Copy
                    </button>
                  </div>

                  {selectedArtifact.includes('diagram') ? (
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm text-gray-900">{artifact.content}</code>
                    </pre>
                  ) : (
                    <div className="prose max-w-none">
                      <ReactMarkdown className="text-gray-900">{artifact.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {run.status === 'running' && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analysis in progress... This page will auto-refresh.</p>
          </div>
        )}
      </div>
    </div>
  );
}
