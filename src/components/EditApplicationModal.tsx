import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { IpoApplication, IpoApplicationInput } from '../types';

interface EditApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: IpoApplicationInput) => Promise<void>;
  application: IpoApplication | null;
}

export function EditApplicationModal({ isOpen, onClose, onSubmit, application }: EditApplicationModalProps) {
  const [moneySent, setMoneySent] = useState(false);
  const [moneyReceived, setMoneyReceived] = useState(false);
  const [allotmentStatus, setAllotmentStatus] = useState<'Pending' | 'Allotted' | 'Not Allotted'>('Pending');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (application) {
      setMoneySent(application.moneySent);
      setMoneyReceived(application.moneyReceived);
      setAllotmentStatus(application.allotmentStatus);
    }
  }, [application, isOpen]);

  if (!isOpen || !application) return null;

  const handleStatusChange = (newStatus: 'Pending' | 'Allotted' | 'Not Allotted') => {
    setAllotmentStatus(newStatus);
    // Auto-rule: When status = "Not Allotted", set moneyReceived to false
    if (newStatus === 'Not Allotted') {
      setMoneyReceived(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsSubmitting(true);
    try {
      await onSubmit(application.id, {
        moneySent,
        moneyReceived,
        allotmentStatus,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Application</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Application Info (Read-only) */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium text-gray-900">{application.userName}</span>
              </div>
              <div>
                <span className="text-gray-500">PAN:</span>
                <span className="ml-2 font-mono text-gray-900">{application.userPan || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">IPO:</span>
                <span className="ml-2 font-medium text-gray-900">{application.ipoName}</span>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <span className="ml-2 font-medium text-gray-900">Rs. {application.ipoAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Money Sent */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <label htmlFor="moneySent" className="text-sm font-medium text-gray-700">
                  Money Sent
                </label>
                <p className="text-xs text-gray-500">Has the application money been sent?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="moneySent"
                  checked={moneySent}
                  onChange={e => setMoneySent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Money Received */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <label htmlFor="moneyReceived" className="text-sm font-medium text-gray-700">
                  Money Received (Refund)
                </label>
                <p className="text-xs text-gray-500">Has the refund been received?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="moneyReceived"
                  checked={moneyReceived}
                  onChange={e => setMoneyReceived(e.target.checked)}
                  disabled={allotmentStatus === 'Not Allotted' && !moneyReceived ? false : allotmentStatus !== 'Not Allotted'}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 ${allotmentStatus !== 'Not Allotted' ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50`}></div>
              </label>
            </div>
            {allotmentStatus !== 'Not Allotted' && (
              <p className="text-xs text-gray-400 -mt-2">Refund tracking is only available when status is "Not Allotted"</p>
            )}

            {/* Allotment Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Allotment Status
              </label>
              <select
                id="status"
                value={allotmentStatus}
                onChange={e => handleStatusChange(e.target.value as 'Pending' | 'Allotted' | 'Not Allotted')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="Allotted">Allotted</option>
                <option value="Not Allotted">Not Allotted</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
