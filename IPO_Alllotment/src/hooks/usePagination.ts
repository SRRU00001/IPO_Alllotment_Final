import { useState, useMemo } from 'react';
import type { PaginationState } from '../types';

export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: initialPageSize,
    totalItems: items.length,
  });

  const paginatedItems = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, pagination.currentPage, pagination.pageSize]);

  const totalPages = Math.ceil(items.length / pagination.pageSize);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalItems: items.length,
      }));
    }
  };

  const nextPage = () => {
    if (pagination.currentPage < totalPages) {
      goToPage(pagination.currentPage + 1);
    }
  };

  const prevPage = () => {
    if (pagination.currentPage > 1) {
      goToPage(pagination.currentPage - 1);
    }
  };

  const setPageSize = (size: number) => {
    setPagination({
      currentPage: 1,
      pageSize: size,
      totalItems: items.length,
    });
  };

  return {
    paginatedItems,
    pagination: { ...pagination, totalItems: items.length },
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
  };
}
