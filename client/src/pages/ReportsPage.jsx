import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reportService } from "../services/reportService.js";
import { reportsMetadata } from "./reportsMetadata.js";
import { Users, Wallet, Landmark, Receipt, ChevronRight, TrendingUp, FileText } from "lucide-react";

export function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await reportService.getSummary();
        setSummary(data);
      } catch (err) {
        console.error("Failed to load analytics dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-sm text-gray-400 font-medium font-sans">
        Compiling analytical indices...
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Customers",
      value: summary ? summary.totalCustomers : "0",
      icon: <Users size={20} className="text-blue-600" />,
      bg: "bg-blue-50/50 border-blue-100/50"
    },
    {
      title: "Active Accounts",
      value: summary ? summary.totalAccounts : "0",
      icon: <Wallet size={20} className="text-green-600" />,
      bg: "bg-green-50/50 border-green-100/50"
    },
    {
      title: "Total Deposit Balance",
      value: summary ? `฿${new Intl.NumberFormat().format(summary.totalCurrentBalance)} Baht` : "0 Baht",
      icon: <TrendingUp size={20} className="text-purple-600" />,
      bg: "bg-purple-50/50 border-purple-100/50"
    },
    {
      title: "Active Loans Count",
      value: summary ? summary.totalLoans : "0",
      icon: <Landmark size={20} className="text-amber-600" />,
      bg: "bg-amber-50/50 border-amber-100/50"
    },
    {
      title: "Owed Outstanding Debts",
      value: summary ? `฿${new Intl.NumberFormat().format(summary.totalOutstandingBalance)} Baht` : "0 Baht",
      icon: <Landmark size={20} className="text-red-600" />,
      bg: "bg-red-50/50 border-red-100/50"
    },
    {
      title: "Collected Service Fees",
      value: summary ? `฿${new Intl.NumberFormat().format(summary.totalServiceCharges)} Baht` : "0 Baht",
      icon: <Receipt size={20} className="text-emerald-600" />,
      bg: "bg-emerald-50/50 border-emerald-100/50"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h3 className="font-extrabold text-gray-900 text-lg">Financial Audit Desk</h3>
          <p className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">
            Consolidated operational parameters as of {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Metrics bento-grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border bg-white shadow-sm hover:translate-y-[-2px] transition-all`}>
            <div className={`p-3 rounded-xl ${card.bg.split(" ")[0]} border ${card.bg.split(" ")[1]}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">{card.title}</p>
              <h3 className="text-xl font-black text-gray-950 mt-2 tracking-tight leading-none">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Seasonal chart indicators */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
        <div>
          <h4 className="font-extrabold text-gray-950 text-sm">Monthly Operational Accumulations</h4>
          <p className="text-xs text-gray-400 mt-0.5">Vitals tracking deposits versus loan volumes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Chart columns bars */}
          <div className="border border-gray-100 rounded-xl p-5 space-y-4 bg-gray-50/30">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Active files seasonal trend</span>
            <div className="h-40 flex items-end justify-between px-2 pt-4">
              {summary && summary.chartData && summary.chartData.map((data, index) => {
                const maxVal = Math.max(...summary.chartData.map(d => Number(d.accountsCount || 0) + Number(d.loansCount || 0)), 1);
                const acctPct = ((data.accountsCount || 0) / maxVal) * 100;
                const loanPct = ((data.loansCount || 0) / maxVal) * 100;

                return (
                  <div key={index} className="flex flex-col items-center gap-2 shrink-0">
                    <div className="flex gap-1.5 h-28 items-end w-12 justify-center">
                      <div 
                        style={{ height: `${acctPct}%` }}
                        className="w-4 bg-blue-600 rounded-t-md hover:bg-blue-700 transition-all cursor-pointer relative group"
                        title={`${data.accountsCount} Accounts`}
                      >
                        <span className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap">
                          {data.accountsCount} Accounts
                        </span>
                      </div>
                      <div 
                        style={{ height: `${loanPct}%` }}
                        className="w-4 bg-amber-500 rounded-t-md hover:bg-amber-600 transition-all cursor-pointer relative group"
                        title={`${data.loansCount} Loans`}
                      >
                        <span className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap">
                          {data.loansCount} Loans
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{data.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 items-center justify-center text-[10px] font-bold text-gray-500 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span> Active client accounts
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-550 bg-amber-500"></span> Issued Loans count
              </div>
            </div>
          </div>

          {/* Ledger volumes breakdowns list */}
          <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/30 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Deposit volume summaries</span>
              <div className="divide-y divide-gray-100">
                {summary && summary.chartData && summary.chartData.map((data, index) => (
                  <div key={index} className="flex justify-between items-center py-2 text-xs font-semibold">
                    <span className="text-gray-600 font-bold uppercase tracking-wider">{data.month}</span>
                    <span className="text-gray-900 font-extrabold">฿{new Intl.NumberFormat().format(data.totalBalance || 0)} Baht</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 italic font-medium pt-3 border-t border-gray-100 self-end">
              * Calculations computed based on the direct ledger history.
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Audit Worksheets Directories */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm animate-fade-in">
        <div>
          <h4 className="font-extrabold text-gray-950 text-sm">System Audit Worksheets</h4>
          <p className="text-xs text-gray-400 mt-0.5">Quick-jump access to fully queryable financial and operational folders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {Object.entries(
            reportsMetadata.reduce((acc, rep) => {
              if (!acc[rep.member]) acc[rep.member] = [];
              acc[rep.member].push(rep);
              return acc;
            }, {})
          ).map(([member, reports], idx) => (
            <div key={idx} className="border border-slate-100 rounded-xl p-5 bg-slate-50/20 flex flex-col justify-between hover:border-slate-200 transition-all">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-4 border-b border-slate-100/60 pb-1">
                  {member}
                </span>
                <div className="space-y-4">
                  {reports.map((r) => (
                    <Link
                      key={r.id}
                      to={`/reports/${r.id}`}
                      className="group flex gap-2.5 items-start text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <FileText size={14} className="text-slate-400 group-hover:text-blue-500 mt-0.5 shrink-0 transition-colors" />
                      <div className="leading-tight">
                        <span className="block text-slate-800 font-extrabold group-hover:text-blue-600">
                          {r.title.split(" – ")[0]}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                          {r.title.split(" – ")[1]}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
