import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { IpoRow, IpoRowInput } from '../types';

interface EditLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IpoRowInput, id?: string) => Promise<void>;
  ipoList: string[];
  editingRow?: IpoRow | null;
}

export function EditLotModal({ isOpen, onClose, onSubmit, ipoList, editingRow }: EditLotModalProps) {
  const [formData, setFormData] = useState<IpoRowInput>({
    name: '',
    pan: '',
    ipoName: '',
    appliedBy: 'online',
    ipoAllotmentStatus: 'Pending',
    amountApplied: 0,
    amountReverted: 0,
    notes: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRow) {
      setFormData({
        name: editingRow.name,
        pan: editingRow.pan,
        ipoName: editingRow.ipoName,
        appliedBy: editingRow.appliedBy,
        ipoAllotmentStatus: editingRow.ipoAllotmentStatus,
        amountApplied: editingRow.amountApplied,
        amountReverted: editingRow.amountReverted,
        notes: editingRow.notes || '',
      });
    } else {
      setFormData({
        name: '',
        pan: '',
        ipoName: ipoList[0] || '',
        appliedBy: 'online',
        ipoAllotmentStatus: 'Pending',
        amountApplied: 0,
        amountReverted: 0,
        notes: '',
      });
    }
  }, [editingRow, ipoList, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof IpoRowInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.pan.trim()) return 'PAN is required';
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
      return 'Invalid PAN format (e.g., ABCDE1234F)';
    }
    if (!formData.ipoName) return 'IPO Name is required';
    if (formData.amountApplied < 0) return 'Amount applied cannot be negative';
    if (formData.amountReverted < 0) return 'Amount reverted cannot be negative';
    if (formData.amountReverted > formData.amountApplied) {
      return 'Amount reverted cannot exceed amount applied';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        { ...formData, pan: formData.pan.toUpperCase() },
        editingRow?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lot');
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

        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingRow ? 'Edit IPO Lot' : 'Add New IPO Lot'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="pan" className="block text-sm font-medium text-gray-700 mb-1">
                  PAN <span className="text-red-500">*</span>
                </label>
                <input
                  id="pan"
                  type="text"
                  value={formData.pan}
                  onChange={e => handleChange('pan', e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label htmlFor="ipoName" className="block text-sm font-medium text-gray-700 mb-1">
                  IPO Name <span className="text-red-500">*</span>
                </label>
                <select
                  id="ipoName"
                  value={formData.ipoName}
                  onChange={e => handleChange('ipoName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ipoList.length === 0 && <option value="">No IPOs available</option>}
                  {ipoList.map(ipo => (
                    <option key={ipo} value={ipo}>
                      {ipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="appliedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Applied By <span className="text-red-500">*</span>
                </label>
                <select
                  id="appliedBy"
                  value={formData.appliedBy}
                  onChange={e => handleChange('appliedBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="broker">Broker</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Allotment Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  value={formData.ipoAllotmentStatus}
                  onChange={e => handleChange('ipoAllotmentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="Allotted">Allotted</option>
                  <option value="Not Allotted">Not Allotted</option>
                  <option value="Refund Received">Refund Received</option>
                </select>
              </div>

              <div>
                <label htmlFor="amountApplied" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Applied (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  id="amountApplied"
                  type="number"
                  value={formData.amountApplied}
                  onChange={e => handleChange('amountApplied', Number(e.target.value))}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="amountReverted" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Reverted (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  id="amountReverted"
                  type="number"
                  value={formData.amountReverted}
                  onChange={e => handleChange('amountReverted', Number(e.target.value))}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                disabled={isSubmitting || ipoList.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : editingRow ? 'Update Lot' : 'Add Lot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
