import { useState, useEffect } from 'react';
import { List, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { listApi } from '../utils/api';

interface ListSectionProps {
  onError: (hasError: boolean) => void;
}

export function ListSection({ onError }: ListSectionProps) {
  const [listItems, setListItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    try {
      const data = await listApi.lget();
      setListItems(data.list || []);
      onError(false);
    } catch (error) {
      console.error('Error fetching list:', error);
      onError(true);
    }
  };

  useEffect(() => {
    fetchList();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchList, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLPush = async () => {
    if (!inputValue.trim()) return;
    
    setLoading(true);
    try {
      await listApi.lpush(inputValue);
      setInputValue('');
      await fetchList();
    } catch (error) {
      console.error('Error pushing to front:', error);
    }
    setLoading(false);
  };

  const handleRPush = async () => {
    if (!inputValue.trim()) return;
    
    setLoading(true);
    try {
      await listApi.rpush(inputValue);
      setInputValue('');
      await fetchList();
    } catch (error) {
      console.error('Error pushing to end:', error);
    }
    setLoading(false);
  };

  const handleLPop = async () => {
    if (listItems.length === 0) return;
    if (!confirm('Remove the first item from the list?')) return;
    
    try {
      await listApi.lpop();
      await fetchList();
    } catch (error) {
      console.error('Error popping from front:', error);
    }
  };

  const handleRPop = async () => {
    if (listItems.length === 0) return;
    if (!confirm('Remove the last item from the list?')) return;
    
    try {
      await listApi.rpop();
      await fetchList();
    } catch (error) {
      console.error('Error popping from end:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2">
          <List className="w-6 h-6 text-purple-600" />
          List Operations
        </h2>
        <div className="flex items-center gap-2 text-gray-600">
          <span>Items: {listItems.length}</span>
        </div>
      </div>

      {/* Add Item Form */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mb-6">
        <h3 className="mb-3 text-purple-800">Add Item to List</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter value"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRPush()}
            className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleLPush}
            disabled={loading || !inputValue.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            LPUSH
          </button>
          <button
            onClick={handleRPush}
            disabled={loading || !inputValue.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            RPUSH
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-purple-700">
          LPUSH adds to front, RPUSH adds to end
        </p>
      </div>

      {/* List Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-700">Current List</h3>
          <div className="flex gap-2">
            <button
              onClick={handleLPop}
              disabled={listItems.length === 0}
              className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              LPOP
            </button>
            <button
              onClick={handleRPop}
              disabled={listItems.length === 0}
              className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              RPOP
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {listItems.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">List is empty. Add items using the form above.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Visual indicators */}
            <div className="absolute -top-6 left-0 text-purple-600">Front →</div>
            <div className="absolute -top-6 right-0 text-purple-600">← End</div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {listItems.map((item, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 min-w-[120px] px-4 py-3 bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-300 rounded-lg shadow-sm"
                >
                  <div className="text-purple-600 mb-1">[{index}]</div>
                  <div className="break-words">{item}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* List as Table (Alternative view) */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-700">Index</th>
              <th className="px-4 py-3 text-left text-gray-700">Value</th>
              <th className="px-4 py-3 text-left text-gray-700">Position</th>
            </tr>
          </thead>
          <tbody>
            {listItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No items in list
                </td>
              </tr>
            ) : (
              listItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-gray-100 rounded">{index}</code>
                  </td>
                  <td className="px-4 py-3">{item}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full ${
                      index === 0 ? 'bg-purple-100 text-purple-700' : 
                      index === listItems.length - 1 ? 'bg-pink-100 text-pink-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {index === 0 ? 'Front' : index === listItems.length - 1 ? 'End' : 'Middle'}
                    </span>
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