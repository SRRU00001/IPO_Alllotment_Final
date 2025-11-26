import { Edit2, Trash2, ArrowUpDown, Check, X as XIcon } from 'lucide-react';
import type { IpoApplication, SortState } from '../types';

interface ApplicantsTableProps {
  rows: IpoApplication[];
  onEdit: (row: IpoApplication) => void;
  onDelete: (row: IpoApplication) => void;
  sortState: SortState;
  onSort: (field: keyof IpoApplication) => void;
}

export function ApplicantsTable({ rows, onEdit, onDelete, sortState, onSort }: ApplicantsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Allotted: 'bg-green-100 text-green-800',
      'Not Allotted': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getBooleanBadge = (value: boolean) => {
    if (value) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          <Check className="w-3 h-3" />
          Yes
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
        <XIcon className="w-3 h-3" />
        No
      </span>
    );
  };

  const SortButton = ({ field, label }: { field: keyof IpoApplication; label: string }) => (
    <button
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      {label}
      <ArrowUpDown
        className={`w-3 h-3 ${sortState.field === field ? 'text-blue-600' : 'text-gray-400'}`}
      />
    </button>
  );

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No records found. Add your first IPO application to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <SortButton field="userName" label="Name" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                PAN
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <SortButton field="ipoName" label="IPO Name" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <SortButton field="ipoAmount" label="Amount" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Money Sent
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Refund Rcvd
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <SortButton field="allotmentStatus" label="Status" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <SortButton field="createdAt" label="Date" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.userName}</td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">{row.userPan || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.userPhone || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.ipoName}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                  {formatCurrency(row.ipoAmount)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {getBooleanBadge(row.moneySent)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {row.allotmentStatus === 'Not Allotted' ? getBooleanBadge(row.moneyReceived) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{getStatusBadge(row.allotmentStatus)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(row)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      aria-label="Edit row"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(row)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      aria-label="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
