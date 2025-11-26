import { useState } from 'react';
import { X } from 'lucide-react';
import type { Ipo } from '../types';

interface CreateIpoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ipoName: string, amount: number) => Promise<void>;
  existingIpos: Ipo[];
}

export function CreateIpoModal({ isOpen, onClose, onSubmit, existingIpos }: CreateIpoModalProps) {
  const [ipoName, setIpoName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = ipoName.trim();

    if (!trimmedName) {
      setError('IPO name cannot be empty');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (existingIpos.some(ipo => ipo.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('This IPO name already exists');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedName, amountValue);
      setIpoName('');
      setAmount('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create IPO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIpoName('');
    setAmount('');
    setError('');
    onClose();
  };

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    return value.replace(/[^\d.]/g, '');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New IPO</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ipoName" className="block text-sm font-medium text-gray-700 mb-1">
                IPO Name <span className="text-red-500">*</span>
              </label>
              <input
                id="ipoName"
                type="text"
                value={ipoName}
                onChange={e => setIpoName(e.target.value)}
                placeholder="e.g., TechCorp IPO"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (per applicant) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                <input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={e => setAmount(formatAmount(e.target.value))}
                  placeholder="15000"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">This amount will be the same for all applicants</p>
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
                {isSubmitting ? 'Creating...' : 'Create IPO'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
