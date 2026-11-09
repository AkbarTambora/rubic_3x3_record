import React from 'react';
import { Filter, RotateCcw, Search, Calendar, Hash, Tag, ArrowUpDown } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCubeStore } from '../../hooks/useCubeStore';
import { SortOption } from '../../types/filter';

export const LedgerFilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, allTags } = useCubeStore();

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSolveRangeChange = (field: 'solveFrom' | 'solveTo', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleTagChange = (tag: string) => {
    setFilters(prev => ({ ...prev, tag }));
  };

  const handlePenaltyChange = (penalty: string) => {
    setFilters(prev => ({ ...prev, penalty }));
  };

  const handleSortChange = (sort: SortOption) => {
    setFilters(prev => ({ ...prev, sort }));
  };

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const hasActiveFilters = 
    Boolean(filters.dateFrom || filters.dateTo || filters.solveFrom || filters.solveTo || 
    (filters.tag && filters.tag !== 'all') || 
    (filters.penalty && filters.penalty !== 'all') || 
    filters.sort !== 'newest' || 
    filters.searchQuery);

  return (
    <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md space-y-3">
      {/* Top Filter Bar Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search notes, tags, or scrambles..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-slate-950/60 border-slate-800"
          />
        </div>

        {/* Right: Sort and Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
            <span>Sort:</span>
            <select
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="bg-transparent text-slate-200 border-none focus:outline-none cursor-pointer pr-1"
            >
              <option value="newest" className="bg-slate-900 text-slate-100">Newest (# Desc)</option>
              <option value="oldest" className="bg-slate-900 text-slate-100">Oldest (# Asc)</option>
              <option value="fastest" className="bg-slate-900 text-slate-100">Fastest Time</option>
              <option value="slowest" className="bg-slate-900 text-slate-100">Slowest Time</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Row: Dates, Solves, Tags, Penalty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 border-t border-slate-800/60 text-xs">
        {/* Date Range */}
        <div className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-800/80 rounded-lg px-2.5 py-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500 text-[11px]">Date:</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            className="w-full bg-transparent text-slate-300 text-xs focus:outline-none"
            placeholder="From"
          />
          <span className="text-slate-600">-</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            className="w-full bg-transparent text-slate-300 text-xs focus:outline-none"
            placeholder="To"
          />
        </div>

        {/* Solve Range */}
        <div className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-800/80 rounded-lg px-2.5 py-1">
          <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500 text-[11px]">Solve #:</span>
          <input
            type="number"
            min="1"
            placeholder="Min"
            value={filters.solveFrom}
            onChange={(e) => handleSolveRangeChange('solveFrom', e.target.value)}
            className="w-full bg-transparent text-slate-300 text-xs focus:outline-none"
          />
          <span className="text-slate-600">-</span>
          <input
            type="number"
            min="1"
            placeholder="Max"
            value={filters.solveTo}
            onChange={(e) => handleSolveRangeChange('solveTo', e.target.value)}
            className="w-full bg-transparent text-slate-300 text-xs focus:outline-none"
          />
        </div>

        {/* Tag Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-800/80 rounded-lg px-2.5 py-1">
          <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500 text-[11px]">Tag:</span>
          <select
            value={filters.tag}
            onChange={(e) => handleTagChange(e.target.value)}
            className="w-full bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-slate-100">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag} className="bg-slate-900 text-slate-100">{tag}</option>
            ))}
          </select>
        </div>

        {/* Status / Penalty */}
        <div className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-800/80 rounded-lg px-2.5 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500 text-[11px]">Status:</span>
          <select
            value={filters.penalty}
            onChange={(e) => handlePenaltyChange(e.target.value)}
            className="w-full bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-slate-100">All Statuses</option>
            <option value="clean" className="bg-slate-900 text-slate-100">Clean Solves</option>
            <option value="+2" className="bg-slate-900 text-slate-100">+2 Penalties</option>
            <option value="dnf" className="bg-slate-900 text-slate-100">DNF (Did Not Finish)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
