import { Plus, RefreshCw, FileText, Users } from 'lucide-react';

interface TopNavProps {
  onCreateIpo: () => void;
  onAddLot: () => void;
  onManageUsers: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastSync: Date | null;
}

export function TopNav({ onCreateIpo, onAddLot, onManageUsers, onRefresh, isRefreshing, lastSync }: TopNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">IPO Allotment Manager</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {lastSync && (
              <span className="hidden sm:inline text-xs text-gray-500">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={onManageUsers}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Manage Users</span>
            </button>
            <button
              onClick={onCreateIpo}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create IPO</span>
            </button>
            <button
              onClick={onAddLot}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Applications</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
