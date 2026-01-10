import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Timer } from 'lucide-react';
import { cacheApi } from '../utils/api';

interface CacheEntry {
  key: string;
  value: string;
  expiry: string | null;
}

interface CacheTabProps {
  onError: (hasError: boolean) => void;
}

export function CacheTab({ onError }: CacheTabProps) {
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [persistentKey, setPersistentKey] = useState('');
  const [persistentValue, setPersistentValue] = useState('');
  const [tempKey, setTempKey] = useState('');
  const [tempValue, setTempValue] = useState('');
  const [ttl, setTtl] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCache = async () => {
    try {
      const data = await cacheApi.getAll();
      setCacheEntries(data.cache || []);
      onError(false);
    } catch (error) {
      console.error('Error fetching cache:', error);
      onError(true);
    }
  };

  useEffect(() => {
    fetchCache();
    const interval = setInterval(fetchCache, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPersistent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persistentKey || !persistentValue) return;
    
    setLoading(true);
    try {
      await cacheApi.put(persistentKey, persistentValue);
      setPersistentKey('');
      setPersistentValue('');
      await fetchCache();
    } catch (error) {
      console.error('Error adding persistent entry:', error);
    }
    setLoading(false);
  };

  const handleAddTemp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempKey || !tempValue || !ttl) return;
    
    setLoading(true);
    try {
      await cacheApi.cache(tempKey, tempValue, parseInt(ttl));
      setTempKey('');
      setTempValue('');
      setTtl('');
      await fetchCache();
    } catch (error) {
      console.error('Error adding temp entry:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete cache entry "${key}"?`)) return;
    
    try {
      await cacheApi.flush(key);
      await fetchCache();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleFlushAll = async () => {
    if (!confirm('Are you sure you want to flush all cache entries?')) return;
    
    try {
      await cacheApi.flushAll();
      await fetchCache();
    } catch (error) {
      console.error('Error flushing cache:', error);
    }
  };

  return (
    <div>
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-6">
        <button
          onClick={fetchCache}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={handleFlushAll}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Flush All
        </button>
      </div>

      {/* Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Persistent Entry Form */}
        <form onSubmit={handleAddPersistent} className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="mb-3 text-green-800">Add Persistent Entry</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Key"
              value={persistentKey}
              onChange={(e) => setPersistentKey(e.target.value)}
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <input
              type="text"
              placeholder="Value"
              value={persistentValue}
              onChange={(e) => setPersistentValue(e.target.value)}
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Add to DB + Cache
            </button>
          </div>
        </form>

        {/* Temporary Entry Form */}
        <form onSubmit={handleAddTemp} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="mb-3 text-blue-800">Add Temporary Entry (TTL)</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Key"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Value"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              placeholder="TTL (seconds)"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Add to Cache Only
            </button>
          </div>
        </form>
      </div>

      {/* Cache Entries Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-700">Key</th>
              <th className="px-4 py-3 text-left text-gray-700">Value</th>
              <th className="px-4 py-3 text-left text-gray-700">TTL</th>
              <th className="px-4 py-3 text-left text-gray-700">Source</th>
              <th className="px-4 py-3 text-center text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {cacheEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No cache entries. Add some using the forms above.
                </td>
              </tr>
            ) : (
              cacheEntries.map((entry, index) => (
                <tr key={`${entry.key}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-gray-100 rounded">{entry.key}</code>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{entry.value}</td>
                  <td className="px-4 py-3">
                    <TTLCounter expiry={entry.expiry} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full ${entry.expiry ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {entry.expiry ? 'Cache' : 'DB'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(entry.key)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TTLCounter({ expiry }: { expiry: string | null }) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTime = () => {
      if (!expiry) {
        setTimeRemaining('Never');
        return;
      }
      
      const now = new Date().getTime();
      const expiryTime = new Date(expiry).getTime();
      const diff = expiryTime - now;
      
      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes % 60}m ${seconds % 60}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds % 60}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, [expiry]);

  if (!expiry) {
    return <span className="text-gray-500">Never</span>;
  }

  return (
    <span className="flex items-center gap-1 text-blue-600">
      <Timer className="w-4 h-4" />
      {timeRemaining}
    </span>
  );
}
