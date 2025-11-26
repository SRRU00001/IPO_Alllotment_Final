import { useState, useMemo, useCallback, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { FiltersPanel } from './components/FiltersPanel';
import { SummaryCard } from './components/SummaryCard';
import { ApplicantsTable } from './components/ApplicantsTable';
import { Pagination } from './components/Pagination';
import { CreateIpoModal } from './components/CreateIpoModal';
import { EditApplicationModal } from './components/EditApplicationModal';
import { AddApplicationsModal } from './components/AddApplicationsModal';
import { UserManagementModal } from './components/UserManagementModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Toast } from './components/Toast';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useFetchRows } from './hooks/useFetchRows';
import { useIpoList } from './hooks/useIpoList';
import { usePagination } from './hooks/usePagination';
import { useApi } from './hooks/useApi';
import type { IpoApplication, IpoApplicationInput, Applicant, ApplicantInput, FilterState, SortState } from './types';
import { LogOut } from 'lucide-react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

function MainApp() {
  const { logout, username } = useAuth();
  const { rows, loading, error, lastSync, refresh, setRows } = useFetchRows();
  const { ipos, addIpo, refresh: refreshIpos } = useIpoList();
  const api = useApi();

  // Users state
  const [users, setUsers] = useState<Applicant[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    ipoName: '',
    allotmentStatus: '',
    searchQuery: '',
  });

  const [sortState, setSortState] = useState<SortState>({
    field: 'createdAt',
    direction: 'desc',
  });

  // Modal states
  const [isCreateIpoModalOpen, setIsCreateIpoModalOpen] = useState(false);
  const [isAddApplicationsModalOpen, setIsAddApplicationsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [editingApplication, setEditingApplication] = useState<IpoApplication | null>(null);
  const [deletingApplication, setDeletingApplication] = useState<IpoApplication | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    const response = await api.listUsers();
    if (response.success && response.data) {
      setUsers(response.data);
    }
  }, [api]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

  const filteredAndSortedRows = useMemo(() => {
    let filtered = [...rows];

    if (filters.ipoName) {
      filtered = filtered.filter(row => row.ipoName === filters.ipoName);
    }

    if (filters.allotmentStatus) {
      filtered = filtered.filter(row => row.allotmentStatus === filters.allotmentStatus);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        row =>
          row.userName.toLowerCase().includes(query) ||
          (row.userPan && row.userPan.toLowerCase().includes(query)) ||
          (row.userPhone && row.userPhone.toLowerCase().includes(query)) ||
          row.ipoName.toLowerCase().includes(query)
      );
    }

    if (sortState.field) {
      filtered.sort((a, b) => {
        const aVal = a[sortState.field!];
        const bVal = b[sortState.field!];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortState.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          return sortState.direction === 'asc'
            ? (aVal ? 1 : 0) - (bVal ? 1 : 0)
            : (bVal ? 1 : 0) - (aVal ? 1 : 0);
        }

        return 0;
      });
    }

    return filtered;
  }, [rows, filters, sortState]);

  const { paginatedItems, pagination, totalPages, goToPage, setPageSize } =
    usePagination(filteredAndSortedRows, 10);

  const handleSort = (field: keyof IpoApplication) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refresh(), refreshIpos(), fetchUsers()]);
    setIsRefreshing(false);
    showToast('Data refreshed successfully', 'success');
  };

  const handleCreateIpo = async (ipoName: string, amount: number) => {
    const response = await addIpo(ipoName, amount);
    if (response.success) {
      showToast(`IPO "${ipoName}" created successfully`, 'success');
    } else {
      showToast(response.error || 'Failed to create IPO', 'error');
      throw new Error(response.error);
    }
  };

  const handleAddBulkApplications = async (ipoName: string, userIds: string[]) => {
    const response = await api.addBulkApplications(ipoName, userIds);
    if (response.success) {
      await refresh();
      showToast(`${response.data?.created || userIds.length} application(s) added successfully`, 'success');
    } else {
      showToast(response.error || 'Failed to add applications', 'error');
      throw new Error(response.error);
    }
  };

  const handleGetAppliedUsers = async (ipoName: string): Promise<string[]> => {
    const response = await api.getAppliedUsers(ipoName);
    return response.success && response.data ? response.data : [];
  };

  const handleUpdateApplication = async (id: string, data: IpoApplicationInput) => {
    const response = await api.updateRow(id, data);
    if (response.success && response.data) {
      setRows(prev => prev.map(row => (row.id === id ? response.data! : row)));
      showToast('Application updated successfully', 'success');
    } else {
      showToast(response.error || 'Failed to update application', 'error');
      throw new Error(response.error);
    }
  };

  const handleEdit = (row: IpoApplication) => {
    setEditingApplication(row);
    setIsEditModalOpen(true);
  };

  const handleDelete = (row: IpoApplication) => {
    setDeletingApplication(row);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingApplication) return;

    const response = await api.deleteRow(deletingApplication.id);
    if (response.success) {
      setRows(prev => prev.filter(row => row.id !== deletingApplication.id));
      showToast('Application deleted successfully', 'success');
    } else {
      showToast(response.error || 'Failed to delete application', 'error');
    }

    setIsDeleteModalOpen(false);
    setDeletingApplication(null);
  };

  // User management handlers
  const handleAddUser = async (data: ApplicantInput) => {
    const response = await api.addUser(data);
    if (response.success) {
      showToast(`User "${data.name}" added successfully`, 'success');
    } else {
      showToast(response.error || 'Failed to add user', 'error');
      throw new Error(response.error);
    }
  };

  const handleUpdateUser = async (id: string, data: Partial<ApplicantInput>) => {
    const response = await api.updateUser(id, data);
    if (response.success) {
      showToast('User updated successfully', 'success');
    } else {
      showToast(response.error || 'Failed to update user', 'error');
      throw new Error(response.error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const response = await api.deleteUser(id);
    if (response.success) {
      showToast('User deleted successfully', 'success');
    } else {
      showToast(response.error || 'Failed to delete user', 'error');
      throw new Error(response.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IPO data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Connection Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            Please check if the backend server is running on port 9000.
          </p>
          <button
            onClick={refresh}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User bar with logout */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Logged in as <span className="font-medium text-gray-900">{username}</span>
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <TopNav
        onCreateIpo={() => setIsCreateIpoModalOpen(true)}
        onAddLot={() => setIsAddApplicationsModalOpen(true)}
        onManageUsers={() => setIsUserModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastSync={lastSync}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <FiltersPanel filters={filters} onFiltersChange={setFilters} ipoList={ipos} />
          </aside>

          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredAndSortedRows.length} Application{filteredAndSortedRows.length !== 1 ? 's' : ''}
              </h2>
            </div>

            <SummaryCard rows={filteredAndSortedRows} selectedIpo={filters.ipoName} />

            <ApplicantsTable
              rows={paginatedItems}
              onEdit={handleEdit}
              onDelete={handleDelete}
              sortState={sortState}
              onSort={handleSort}
            />

            <Pagination
              pagination={pagination}
              totalPages={totalPages}
              onPageChange={goToPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </main>

      <CreateIpoModal
        isOpen={isCreateIpoModalOpen}
        onClose={() => setIsCreateIpoModalOpen(false)}
        onSubmit={handleCreateIpo}
        existingIpos={ipos}
      />

      <AddApplicationsModal
        isOpen={isAddApplicationsModalOpen}
        onClose={() => setIsAddApplicationsModalOpen(false)}
        ipos={ipos}
        users={users}
        onSubmit={handleAddBulkApplications}
        onGetAppliedUsers={handleGetAppliedUsers}
      />

      <EditApplicationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingApplication(null);
        }}
        onSubmit={handleUpdateApplication}
        application={editingApplication}
      />

      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onRefresh={fetchUsers}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingApplication(null);
        }}
        onConfirm={handleConfirmDelete}
        row={deletingApplication}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'register' | 'forgotPassword'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authPage === 'register') {
      return <RegisterPage onBackToLogin={() => setAuthPage('login')} />;
    }
    if (authPage === 'forgotPassword') {
      return <ForgotPasswordPage onBackToLogin={() => setAuthPage('login')} />;
    }
    return (
      <LoginPage
        onRegister={() => setAuthPage('register')}
        onForgotPassword={() => setAuthPage('forgotPassword')}
      />
    );
  }

  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
