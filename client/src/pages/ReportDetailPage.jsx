import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { reportService } from "../services/reportService.js";
import { reportsMetadata } from "./reportsMetadata.js";
import { customerService } from "../services/customerService.js";
import { 
  FileSpreadsheet, FileText, Printer, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown,
  Filter, RotateCcw, AlertCircle, Loader2, Landmark
} from "lucide-react";

export function ReportDetailPage() {
  const { reportId } = useParams();
  
  // Find report metadata
  const meta = reportsMetadata.find(r => r.id === reportId);

  if (!meta) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm">
        <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
        <h4 className="font-bold text-gray-900 text-lg">Report Configuration Not Found</h4>
        <p className="text-sm text-gray-500 mt-1">The report identifier code '{reportId}' is invalid.</p>
        <Link to="/reports" className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-blue-600 hover:underline">
          <ChevronLeft size={16} /> Return to Audit Desk Dashboard
        </Link>
      </div>
    );
  }

  // Set default filters based on report metadata
  const getInitialFilters = () => {
    const fObj = {};
    meta.filters.forEach(f => {
      fObj[f.name] = f.defaultValue !== undefined ? f.defaultValue : "";
    });
    return fObj;
  };

  const [formFilters, setFormFilters] = useState(getInitialFilters());
  const [activeFilters, setActiveFilters] = useState(getInitialFilters());

  // Dynamic dropdown metadata options state
  const [dynamicOptionsData, setDynamicOptionsData] = useState({
    customers: []
  });

  useEffect(() => {
    const hasCustomersFilter = meta && meta.filters && meta.filters.some(f => f.dynamicOptions === "customers");
    if (hasCustomersFilter && dynamicOptionsData.customers.length === 0) {
      customerService.getCustomers()
        .then(customers => {
          const options = (customers || []).map(c => ({
            value: c.name,
            label: `${c.name} (${c.code})`
          }));
          setDynamicOptionsData(prev => ({ ...prev, customers: options }));
        })
        .catch(err => console.error("Failed to load customer dynamic options:", err));
    }
  }, [reportId, meta, dynamicOptionsData.customers.length]);
  
  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState(meta.defaultSort?.sortBy || "");
  const [sortOrder, setSortOrder] = useState(meta.defaultSort?.sortOrder || "desc");

  // Data Loading States
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ totalRows: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load report data from service
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters = {
        page,
        limit,
        sortBy,
        sortOrder,
        ...activeFilters
      };
      const result = await reportService.getReport(meta.id, apiFilters);
      const fetchedData = result?.data || (Array.isArray(result) ? result : []);
      const fetchedPagination = result?.pagination || { totalRows: fetchedData.length, totalPages: 1, currentPage: 1, limit };
      setData(fetchedData);
      setPagination(fetchedPagination);
    } catch (err) {
      console.error("Failed to load report", err);
      setError(err.message || "An error occurred while compiling query reports.");
    } finally {
      setLoading(false);
    }
  };

  // Reset states when report changes
  useEffect(() => {
    const initFilters = getInitialFilters();
    setFormFilters(initFilters);
    setActiveFilters(initFilters);
    setPage(1);
    setSortBy(meta.defaultSort?.sortBy || "");
    setSortOrder(meta.defaultSort?.sortOrder || "desc");
  }, [reportId]);

  // Load whenever active filters, page, sorting changes
  useEffect(() => {
    loadData();
  }, [reportId, activeFilters, page, limit, sortBy, sortOrder]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setActiveFilters({ ...formFilters });
    setPage(1);
  };

  const handleResetFilters = () => {
    const clean = getInitialFilters();
    setFormFilters(clean);
    setActiveFilters(clean);
    setPage(1);
  };

  const handleSort = (accessor) => {
    if (sortBy === accessor) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(accessor);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // CSV/Excel Export (Generates clean banking spreadsheet format)
  const handleExportExcel = () => {
    if (!data.length) return;
    const headers = meta.columns.map(c => c.header).join(",");
    const rows = data.map(item => {
      return meta.columns.map(c => {
        let val = item[c.accessor];
        if (val === undefined || val === null) return '""';
        // Sanitize string to prevent CSV injections
        let str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${meta.id}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Corporate PDF Exporter utilizing clean print styling
  const handleExportPDF = () => {
    window.print();
  };

  // Print Desk Worksheet
  const handlePrint = () => {
    window.print();
  };

  // Professional banking typography formatters
  const formatCell = (val, type) => {
    if (val === undefined || val === null) return "-";
    if (type === "currency") {
      return `฿${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val))} THB`;
    }
    if (type === "percentage") {
      return `${Number(val).toFixed(2)}%`;
    }
    if (type === "months") {
      return `${val} Months`;
    }
    if (type === "number") {
      return new Intl.NumberFormat().format(Number(val));
    }
    if (type === "date") {
      return new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }
    if (type === "status") {
      const s = String(val).toUpperCase();
      let color = "bg-gray-50 text-gray-700 border-gray-200";
      if (s === "ACTIVE" || s === "PAID" || s === "COMPLETED") {
        color = "bg-emerald-50 text-emerald-700 border-emerald-200";
      } else if (s === "CLOSE" || s === "FAILED" || s === "CLOSED") {
        color = "bg-rose-50 text-rose-700 border-rose-200";
      } else if (s === "PENDING" || s === "UNPAID") {
        color = "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
      }
      return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
          {val}
        </span>
      );
    }
    return String(val);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Dynamic Style block to support Print ledger headers and hiding elements during PDF/Print generation */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          aside, header, nav, .breadcrumbs-bar, .filter-card, .action-buttons-bar, .pagination-bar {
            display: none !important;
          }
          #print-ledger-area, #print-ledger-area * {
            visibility: visible;
          }
          #print-ledger-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          table {
            border-collapse: collapse;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      {/* Breadcrumb Navigation & Printable Area Container wrapper */}
      <div id="print-ledger-area" className="space-y-6">
        
        {/* Printable Corporate Header (Invisible on standard browser screen) */}
        <div className="hidden print:block border-b-4 border-double border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">BankCore System Ledger Sheet</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">INTERNAL AUDIT & SYSTEM RECOLLECTIONS</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono">Date Printed: {new Date().toLocaleDateString("en-GB")}</p>
              <p className="text-[10px] font-mono text-slate-500">Confidential Report Module: {meta.id}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-50 border text-xs leading-relaxed text-slate-700 rounded font-sans">
            <strong>Parameter:</strong> {meta.title} — {meta.description}
          </div>
        </div>

        {/* Regular Interactive Page Header */}
        <div className="breadcrumbs-bar flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold tracking-wider uppercase">
            <Link to="/reports" className="hover:text-blue-600 transition-colors">Financial Audit Desk</Link>
            <span>/</span>
            <span className="text-slate-500">{meta.member}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-1">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{meta.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
            </div>
            
            {/* ACTION BUTTONS BAR */}
            <div className="action-buttons-bar flex flex-wrap gap-2">
              <button 
                onClick={handleExportExcel}
                disabled={loading || !data.length}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button 
                onClick={handleExportPDF}
                disabled={loading || !data.length}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200 rounded-xl transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileText size={14} /> Export PDF
              </button>
              <button 
                onClick={handlePrint}
                disabled={loading || !data.length}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200 rounded-xl transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Printer size={14} /> Print Worksheet
              </button>
            </div>
          </div>
        </div>

        {/* FILTER CARD (Enterprise Form Card) */}
        {meta.filters.length > 0 && (
          <form onSubmit={handleApplyFilters} className="filter-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400 tracking-widest border-b border-slate-50 pb-2">
              <Filter size={12} /> Search Parameters Ledger
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {meta.filters.map((f, idx) => (
                <div key={idx} className="space-y-1.5 col-span-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{f.label}</label>
                  {f.type === "select" ? (
                    <select
                      value={formFilters[f.name] ?? ""}
                      onChange={(e) => setFormFilters(prev => ({ ...prev, [f.name]: e.target.value }))}
                      className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- View All options --</option>
                      {((f.dynamicOptions && dynamicOptionsData[f.dynamicOptions]) || f.options || []).map((opt, oIdx) => (
                        <option key={oIdx} value={typeof opt === "object" ? opt.value : opt}>
                          {typeof opt === "object" ? opt.label : opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      placeholder={f.placeholder || ""}
                      value={formFilters[f.name] ?? ""}
                      onChange={(e) => setFormFilters(prev => ({ ...prev, [f.name]: e.target.value }))}
                      className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                Apply Filters
              </button>
            </div>
          </form>
        )}

        {/* LOADING & ERROR STATES */}
        {loading && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Recompiling indices records ledger sheets...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-950 text-sm">Compilation Interrupted</h4>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 font-bold text-slate-700 rounded-lg"
            >
              Retry Query
            </button>
          </div>
        )}

        {/* DATA RESPONSIVE TABLE */}
        {!loading && !error && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {meta.columns.map((col, cIdx) => {
                      const isSorted = sortBy === col.accessor;
                      return (
                        <th 
                          key={cIdx} 
                          onClick={() => handleSort(col.accessor)}
                          className="px-6 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-widest select-none cursor-pointer hover:bg-slate-100/50 transition-all"
                        >
                          <div className="flex items-center gap-1.5">
                            {col.header}
                            {isSorted ? (
                              sortOrder === "asc" ? <ArrowUp size={11} className="text-blue-600" /> : <ArrowDown size={11} className="text-blue-600" />
                            ) : (
                              <ArrowUpDown size={11} className="text-slate-300 opacity-50" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.length > 0 ? (
                    data.map((row, rIdx) => (
                      <tr 
                        key={rIdx} 
                        className="hover:bg-slate-50/30 transition duration-150 text-[11.5px] font-medium text-slate-700"
                      >
                        {meta.columns.map((col, cIdx) => (
                          <td key={cIdx} className="px-6 py-3.5 border-b border-slate-50 leading-normal">
                            {formatCell(row[col.accessor], col.type)}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={meta.columns.length} className="px-6 py-12 text-center text-xs text-slate-400 font-medium italic">
                        Empty State: No financial transactions or records found matching generated parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION PANEL */}
            {data.length > 0 && (
              <div className="pagination-bar bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Page <span className="text-slate-700 font-extrabold">{pagination.currentPage}</span> of <span className="text-slate-700 font-extrabold">{pagination.totalPages}</span>
                  <span className="mx-2">•</span>
                  Total rows <span className="text-slate-700 font-extrabold">{pagination.totalRows}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="p-2 bg-white text-slate-500 rounded-lg border hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="First Page"
                  >
                    <ChevronsLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="p-2 bg-white text-slate-500 rounded-lg border hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  {/* Digital pagination numbers */}
                  <div className="hidden sm:flex gap-1.5">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      // Center active page if more than 5
                      let pNum = i + 1;
                      if (pagination.totalPages > 5 && page > 3) {
                        pNum = page - 3 + i;
                        if (pNum + (4 - i) > pagination.totalPages) {
                          pNum = pagination.totalPages - 4 + i;
                        }
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => setPage(pNum)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                            page === pNum
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 border whitespace-nowrap"
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={page === pagination.totalPages}
                    className="p-2 bg-white text-slate-500 rounded-lg border hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setPage(pagination.totalPages)}
                    disabled={page === pagination.totalPages}
                    className="p-2 bg-white text-slate-500 rounded-lg border hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Last Page"
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportDetailPage;
