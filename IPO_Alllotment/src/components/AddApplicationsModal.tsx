import { useState, useEffect, useCallback } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import type { Applicant, Ipo } from '../types';

interface AddApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ipos: Ipo[];
  users: Applicant[];
  onSubmit: (ipoName: string, userIds: string[]) => Promise<void>;
  onGetAppliedUsers: (ipoName: string) => Promise<string[]>;
}

export function AddApplicationsModal({
  isOpen,
  onClose,
  ipos,
  users,
  onSubmit,
  onGetAppliedUsers,
}: AddApplicationsModalProps) {
  const [selectedIpo, setSelectedIpo] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [appliedUsers, setAppliedUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const resetForm = useCallback(() => {
    setSelectedIpo('');
    setSelectedAmount(null);
    setSelectedUsers(new Set());
    setAppliedUsers(new Set());
    setError('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    const loadAppliedUsers = async () => {
      if (!selectedIpo) {
        setAppliedUsers(new Set());
        return;
      }

      setIsLoadingUsers(true);
      try {
        const appliedUserIds = await onGetAppliedUsers(selectedIpo);
        setAppliedUsers(new Set(appliedUserIds));
      } catch (err) {
        console.error('Failed to load applied users:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadAppliedUsers();
  }, [selectedIpo, onGetAppliedUsers]);

  if (!isOpen) return null;

  const handleIpoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ipoName = e.target.value;
    setSelectedIpo(ipoName);
    setSelectedUsers(new Set());
    setError('');

    const ipo = ipos.find(i => i.name === ipoName);
    setSelectedAmount(ipo?.amount ?? null);
  };

  const toggleUser = (userId: string) => {
    if (appliedUsers.has(userId)) return;

    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    const allAvailable = users.filter(u => !appliedUsers.has(u.id)).map(u => u.id);
    setSelectedUsers(new Set(allAvailable));
  };

  const deselectAll = () => {
    setSelectedUsers(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedIpo) {
      setError('Please select an IPO');
      return;
    }

    if (selectedUsers.size === 0) {
      setError('Please select at least one user');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedIpo, Array.from(selectedUsers));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add applications');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const availableCount = users.filter(u => !appliedUsers.has(u.id)).length;
  const selectedCount = selectedUsers.size;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add Applications</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* IPO Selection */}
            <div>
              <label htmlFor="ipo" className="block text-sm font-medium text-gray-700 mb-1">
                Select IPO <span className="text-red-500">*</span>
              </label>
              <select
                id="ipo"
                value={selectedIpo}
                onChange={handleIpoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select IPO --</option>
                {ipos.map(ipo => (
                  <option key={ipo.name} value={ipo.name}>
                    {ipo.name} - Rs. {ipo.amount.toLocaleString()}
                  </option>
                ))}
              </select>
              {selectedAmount !== null && (
                <p className="mt-1 text-sm text-gray-600">
                  Amount per applicant: <span className="font-semibold">Rs. {selectedAmount.toLocaleString()}</span>
                </p>
              )}
            </div>

            {/* User Selection */}
            {selectedIpo && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Users <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      disabled={availableCount === 0}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    >
                      Select All ({availableCount})
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      disabled={selectedCount === 0}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {isLoadingUsers ? (
                  <div className="text-center py-4 text-gray-500">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No users available. Please add users first.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    {users.map(user => {
                      const isApplied = appliedUsers.has(user.id);
                      const isSelected = selectedUsers.has(user.id);

                      return (
                        <label
                          key={user.id}
                          className={`flex items-center px-3 py-2 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                            isApplied
                              ? 'bg-gray-100 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isApplied}
                            onChange={() => toggleUser(user.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{user.name}</span>
                              {isApplied && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                  <Check className="w-3 h-3" />
                                  Already Applied
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.pan && <span className="font-mono">{user.pan}</span>}
                              {user.pan && user.phone && <span className="mx-1">|</span>}
                              {user.phone && <span>{user.phone}</span>}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {selectedCount > 0 && (
                  <p className="mt-2 text-sm text-blue-600">
                    {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

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
                disabled={isSubmitting || !selectedIpo || selectedUsers.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Adding...' : `Add ${selectedCount > 0 ? selectedCount : ''} Application${selectedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
