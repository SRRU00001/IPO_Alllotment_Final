import { TrendingUp, Users, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { IpoApplication } from '../types';

interface SummaryCardProps {
  rows: IpoApplication[];
  selectedIpo: string;
}

export function SummaryCard({ rows, selectedIpo }: SummaryCardProps) {
  const filteredRows = selectedIpo ? rows.filter(r => r.ipoName === selectedIpo) : rows;

  const totalApplicants = filteredRows.length;
  const totalAmount = filteredRows.reduce((sum, row) => sum + row.ipoAmount, 0);

  // Count by status
  const pendingCount = filteredRows.filter(r => r.allotmentStatus === 'Pending').length;
  const allottedCount = filteredRows.filter(r => r.allotmentStatus === 'Allotted').length;
  const notAllottedCount = filteredRows.filter(r => r.allotmentStatus === 'Not Allotted').length;

  // Money tracking
  const moneySentCount = filteredRows.filter(r => r.moneySent).length;
  const pendingRefundCount = filteredRows.filter(r => r.allotmentStatus === 'Not Allotted' && !r.moneyReceived).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">
        {selectedIpo ? `Summary: ${selectedIpo}` : 'Overall Summary'}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Applications</p>
            <p className="text-xl font-bold text-gray-900">{totalApplicants}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Pending</p>
            <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Allotted</p>
            <p className="text-xl font-bold text-gray-900">{allottedCount}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Not Allotted</p>
            <p className="text-xl font-bold text-gray-900">{notAllottedCount}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Pending Refund</p>
            <p className="text-xl font-bold text-gray-900">{pendingRefundCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
