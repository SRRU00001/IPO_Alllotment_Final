import { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { FilterState, Ipo } from '../types';

interface FiltersPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  ipoList: Ipo[];
}

export function FiltersPanel({ filters, onFiltersChange, ipoList }: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      ipoName: '',
      allotmentStatus: '',
      searchQuery: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 lg:cursor-default"
      >
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        <span className="lg:hidden">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <div className={`${isExpanded ? 'block' : 'hidden'} lg:block p-4 space-y-4`}>
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="search"
              type="text"
              value={filters.searchQuery}
              onChange={e => handleChange('searchQuery', e.target.value)}
              placeholder="Name, PAN, Phone..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ipo" className="block text-sm font-medium text-gray-700 mb-1">
            IPO Name
          </label>
          <select
            id="ipo"
            value={filters.ipoName}
            onChange={e => handleChange('ipoName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All IPOs</option>
            {ipoList.map(ipo => (
              <option key={ipo.name} value={ipo.name}>
                {ipo.name} - Rs. {ipo.amount.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Allotment Status
          </label>
          <select
            id="status"
            value={filters.allotmentStatus}
            onChange={e => handleChange('allotmentStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Allotted">Allotted</option>
            <option value="Not Allotted">Not Allotted</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}
