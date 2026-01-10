import { useState } from 'react';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';

const BASE_URL = 'http://localhost:3000';

interface GetResult {
  key: string;
  value: string;
  source?: 'cache' | 'db';
}

export function GetByKey() {
  const [searchKey, setSearchKey] = useState('');
  const [result, setResult] = useState<GetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKey.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${BASE_URL}/get/${searchKey}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError(`Key "${searchKey}" not found`);
        } else {
          setError('Failed to fetch value');
        }
        setLoading(false);
        return;
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Unable to connect to backend');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Search className="w-6 h-6 text-indigo-600" />
        <h2>Get Value by Key</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Enter key to search..."
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !searchKey.trim()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="mb-2">
                <span className="text-green-800">Key: </span>
                <code className="px-2 py-1 bg-green-100 rounded">{result.key}</code>
              </div>
              <div className="mb-2">
                <span className="text-green-800">Value: </span>
                <span className="text-green-900">{result.value}</span>
              </div>
              {result.source && (
                <div>
                  <span className="text-green-800">Source: </span>
                  <span className={`px-2 py-1 rounded-full ${
                    result.source === 'cache' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {result.source === 'cache' ? 'Cache' : 'Database'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
