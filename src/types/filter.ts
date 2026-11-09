export type SortOption = 'newest' | 'oldest' | 'fastest' | 'slowest';

export interface FilterCriteria {
  dateFrom: string;
  dateTo: string;
  solveFrom: string;
  solveTo: string;
  tag: string;
  penalty: string; // 'all' | 'clean' | '+2' | 'dnf'
  sort: SortOption;
  searchQuery: string;
}
