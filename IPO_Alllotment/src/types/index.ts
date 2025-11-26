// Applicant/User for IPO applications
export interface Applicant {
  id: string;
  name: string;
  phone: string;
  pan: string;
  createdAt: string;
}

// IPO with amount
export interface Ipo {
  name: string;
  amount: number;
}

// IPO Application (links user to IPO)
export interface IpoApplication {
  id: string;
  ipoName: string;
  userId: string;
  userName: string;
  userPan: string;
  userPhone: string;
  ipoAmount: number;
  moneySent: boolean;
  moneyReceived: boolean;
  allotmentStatus: 'Pending' | 'Allotted' | 'Not Allotted';
  createdAt: string;
}

// Input for updating application
export interface IpoApplicationInput {
  moneySent?: boolean;
  moneyReceived?: boolean;
  allotmentStatus?: string;
}

// Input for adding user
export interface ApplicantInput {
  name: string;
  phone: string;
  pan: string;
}

// Generic API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination state
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

// Filter state
export interface FilterState {
  ipoName: string;
  allotmentStatus: string;
  searchQuery: string;
}

// Sort state
export interface SortState {
  field: keyof IpoApplication | null;
  direction: 'asc' | 'desc';
}

// Legacy types for backward compatibility (will be removed)
export interface IpoRow extends IpoApplication {}
export interface IpoRowInput extends IpoApplicationInput {}
