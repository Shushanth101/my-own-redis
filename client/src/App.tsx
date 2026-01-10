import { useEffect, useState } from 'react';
import { StatsCard } from './components/StatsCard';
import { GetByKey } from './components/GetByKey';
import { Tabs } from './components/Tabs';
import { CacheTab } from './components/CacheTab';
import { ListTab } from './components/ListTab';
import { Activity, WifiOff, Database, List } from 'lucide-react';

export default function App() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [hasConnectionError, setHasConnectionError] = useState(false);

  // Auto-refresh timer for display only
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleError = (hasError: boolean) => {
    setHasConnectionError(hasError);
  };

  const tabs = [
    {
      id: 'cache',
      label: 'Cache Management',
      icon: <Database className="w-4 h-4" />,
      content: <CacheTab onError={handleError} />,
    },
    {
      id: 'list',
      label: 'List Operations',
      icon: <List className="w-4 h-4" />,
      content: <ListTab onError={handleError} />,
    },
    // Add more data structures here easily:
    // {
    //   id: 'stack',
    //   label: 'Stack Operations',
    //   icon: <Stack className="w-4 h-4" />,
    //   content: <StackTab onError={handleError} />,
    // },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">MyOwnRedis Dashboard</h1>
                <p className="text-gray-600">LRU Cache with MongoDB Persistence</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-600">Last Updated</div>
              <div className="text-gray-900">
                {lastUpdate.toLocaleTimeString()}
              </div>
              <div className="text-gray-500 mt-1">
                Auto-refresh: 10s
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Connection Error Banner */}
      {hasConnectionError && (
        <div className="bg-red-50 border-l-4 border-red-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start gap-3">
              <WifiOff className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-800">Unable to Connect to Backend</h3>
                <div className="text-red-700 mt-1 space-y-1">
                  <p>Make sure your Express server is running at <code className="px-1 py-0.5 bg-red-100 rounded">http://localhost:3000</code></p>
                  <p className="mt-2">To enable CORS on your backend, add this to your Express server:</p>
                  <pre className="mt-2 p-3 bg-red-100 rounded overflow-x-auto">
{`const cors = require('cors');
app.use(cors());`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Card */}
          <StatsCard onError={handleError} />

          {/* Get by Key Section */}
          <GetByKey />

          {/* Data Structures Tabs */}
          <Tabs tabs={tabs} defaultTab="cache" />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-gray-600">
            <div>
              Connected to: <code className="px-2 py-1 bg-gray-100 rounded">http://localhost:3000</code>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasConnectionError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
              {hasConnectionError ? 'Disconnected' : 'Live Dashboard'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
