import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, XCircle } from 'lucide-react';
import type { Applicant, ApplicantInput } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Applicant[];
  onAddUser: (data: ApplicantInput) => Promise<void>;
  onUpdateUser: (id: string, data: Partial<ApplicantInput>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export function UserManagementModal({
  isOpen,
  onClose,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onRefresh,
}: UserManagementModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPan, setNewPan] = useState('');

  // Edit form state
  const [editPhone, setEditPhone] = useState('');
  const [editPan, setEditPan] = useState('');

  useEffect(() => {
    if (isOpen) {
      onRefresh();
    }
  }, [isOpen, onRefresh]);

  if (!isOpen) return null;

  const handleClose = () => {
    setShowAddForm(false);
    setEditingId(null);
    setError('');
    resetAddForm();
    onClose();
  };

  const resetAddForm = () => {
    setNewName('');
    setNewPhone('');
    setNewPan('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddUser({
        name: trimmedName,
        phone: newPhone.trim(),
        pan: newPan.trim().toUpperCase(),
      });
      resetAddForm();
      setShowAddForm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (user: Applicant) => {
    setEditingId(user.id);
    setEditPhone(user.phone || '');
    setEditPan(user.pan || '');
    setError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditPhone('');
    setEditPan('');
    setError('');
  };

  const handleEditSubmit = async (userId: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      await onUpdateUser(userId, {
        phone: editPhone.trim(),
        pan: editPan.trim().toUpperCase(),
      });
      setEditingId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete "${userName}"?`)) {
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onDeleteUser(userId);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Manage Users</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Add User Button/Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New User
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New User</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PAN</label>
                  <input
                    type="text"
                    value={newPan}
                    onChange={e => setNewPan(e.target.value.toUpperCase())}
                    placeholder="PAN Number"
                    maxLength={10}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetAddForm();
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="max-h-96 overflow-y-auto">
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users added yet. Click "Add New User" to get started.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Phone</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">PAN</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      {editingId === user.id ? (
                        <>
                          <td className="px-3 py-2 text-gray-900 font-medium">{user.name}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={editPhone}
                              onChange={e => setEditPhone(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={editPan}
                              onChange={e => setEditPan(e.target.value.toUpperCase())}
                              maxLength={10}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => handleEditSubmit(user.id)}
                                disabled={isSubmitting}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 text-gray-900 font-medium">{user.name}</td>
                          <td className="px-3 py-2 text-gray-600">{user.phone || '-'}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono">{user.pan || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => startEditing(user)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id, user.name)}
                                disabled={isSubmitting}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
