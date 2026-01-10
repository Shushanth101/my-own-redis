import { useEffect, useState } from 'react';
import { BarChart3, Database, Target, Zap } from 'lucide-react';
import { cacheApi } from '../utils/api';

interface Stats {
  cacheCapacity: number;
  cacheSize: number;
  cacheHits: number;
  dbLookups: number;
}

interface StatsCardProps {
  onError: (hasError: boolean) => void;
}

export function StatsCard({ onError }: StatsCardProps) {
  const [stats, setStats] = useState<Stats>({
    cacheCapacity: 0,
    cacheSize: 0,
    cacheHits: 0,
    dbLookups: 0,
  });

  const fetchStats = async () => {
    try {
      const data = await cacheApi.stats();
      setStats(data);
      onError(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      onError(true);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const utilization = stats.cacheCapacity > 0 
    ? Math.round((stats.cacheSize / stats.cacheCapacity) * 100) 
    : 0;

  const hitRate = (stats.cacheHits + stats.dbLookups) > 0
    ? Math.round((stats.cacheHits / (stats.cacheHits + stats.dbLookups)) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-indigo-600" />
        <h2>Live Cache Statistics</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Cache Size */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-blue-900">{stats.cacheSize}</div>
          <div className="text-blue-700">Cache Size</div>
        </div>

        {/* Cache Capacity */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-purple-900">{stats.cacheCapacity}</div>
          <div className="text-purple-700">Capacity</div>
        </div>

        {/* Cache Hits */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-green-900">{stats.cacheHits}</div>
          <div className="text-green-700">Cache Hits</div>
        </div>

        {/* DB Lookups */}
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-orange-900">{stats.dbLookups}</div>
          <div className="text-orange-700">DB Lookups</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mt-6 space-y-4">
        {/* Cache Utilization */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-700">Cache Utilization</span>
            <span className={`${utilization > 80 ? 'text-red-600' : utilization > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
              {utilization}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                utilization > 80 ? 'bg-red-500' : 
                utilization > 50 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>

        {/* Hit Rate */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-700">Cache Hit Rate</span>
            <span className={`${hitRate > 70 ? 'text-green-600' : hitRate > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {hitRate}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                hitRate > 70 ? 'bg-green-500' : 
                hitRate > 40 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${hitRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-600">Total Requests</div>
            <div className="text-gray-900">{stats.cacheHits + stats.dbLookups}</div>
          </div>
          <div>
            <div className="text-gray-600">Available Slots</div>
            <div className="text-gray-900">{stats.cacheCapacity - stats.cacheSize}</div>
          </div>
        </div>
      </div>
    </div>
  );
}