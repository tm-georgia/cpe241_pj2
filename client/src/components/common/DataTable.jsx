import React, { useState, useMemo } from "react";
import Pagination from "./Pagination.jsx";
import { ArrowUpDown, Search } from "lucide-react";

export function DataTable({ 
  columns, 
  data = [], 
  onRowClick, 
  searchPlaceholder = "Search criteria...",
  pageSize = 15,
  searchKey = "name"
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Handle Search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item => {
      const val = item[searchKey];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(q);
    });
  }, [data, searchQuery, searchKey]);

  // Handle Sort
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === undefined || valB === undefined) return 0;
        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Handle Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
        />
      </div>

      {/* Styled Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold tracking-wider text-xs">
              <tr>
                {columns.map((col, index) => (
                  <th 
                    key={index} 
                    className={`px-6 py-4 font-semibold uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:bg-slate-100 transition-colors' : ''}`}
                    onClick={() => col.sortable && requestSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.title}
                      {col.sortable && <ArrowUpDown size={12} className="text-slate-400" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-400 font-medium">
                    No results found matching search criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rIndex) => (
                  <tr 
                    key={rIndex}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
                  >
                    {columns.map((col, cIndex) => {
                      const displayVal = col.render ? col.render(row) : row[col.key];
                      return (
                        <td key={cIndex} className="px-6 py-4 text-slate-700 font-medium align-middle">
                          {displayVal === null || displayVal === undefined ? "-" : displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default DataTable;
