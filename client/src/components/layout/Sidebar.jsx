import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Users, Wallet, Receipt, Landmark, Banknote, Calendar, 
  CreditCard, ArrowRightLeft, Download, Upload, History, 
  LayoutDashboard, ChevronDown, ChevronRight, FileText
} from "lucide-react";

export function Sidebar() {
  const [isReportsOpen, setIsReportsOpen] = useState(true);

  const menuData = [
    { title: "Customers", path: "/customers", icon: <Users size={16} /> },
    { title: "Accounts", path: "/accounts", icon: <Wallet size={16} /> },
    { title: "Account Charges", path: "/charges", icon: <Receipt size={16} /> },
    {
      header: "Loan Management",
      items: [
        { title: "Loans", path: "/loans", icon: <Landmark size={16} /> },
        { title: "Disbursement", path: "/disbursement", icon: <Banknote size={16} /> },
        { title: "Payment Schedule", path: "/schedule", icon: <Calendar size={16} /> },
        { title: "Payment", path: "/payment", icon: <CreditCard size={16} /> }
      ]
    },
    {
      header: "Transfers",
      items: [
        { title: "Single Transfer", path: "/single-transfer", icon: <ArrowRightLeft size={16} /> },
        { title: "Payroll Transfer", path: "/payroll", icon: <Users size={16} /> },
        { title: "Deposit", path: "/deposit", icon: <Download size={16} /> },
        { title: "Withdrawal", path: "/withdrawal", icon: <Upload size={16} /> }
      ]
    },
    {
      header: "History",
      items: [
        { title: "Transaction History", path: "/transactions", icon: <History size={16} /> },
        { title: "Reports & Analytics Desk", path: "/reports", icon: <LayoutDashboard size={16} /> }
      ]
    }
  ];

  const reportsByMember = {
    "Member 1 – Transactions": [
      { id: "report-1", title: "Report 1 – Account Transactions", path: "/reports/report-1" },
      { id: "report-2", title: "Report 2 – Top Account Balances", path: "/reports/report-2" },
      { id: "report-3", title: "Report 3 – Transaction Volume Analysis", path: "/reports/report-3" },
    ],
    "Member 2 – Loan Payments": [
      { id: "report-4", title: "Report 4 – Loan Payments", path: "/reports/report-4" },
      { id: "report-5", title: "Report 5 – Outstanding Loan Balances", path: "/reports/report-5" },
      { id: "report-6", title: "Report 6 – Loan Type Performance", path: "/reports/report-6" },
    ],
    "Member 3 – Disbursement & Schedule": [
      { id: "report-7", title: "Report 7 – Loan Disbursements", path: "/reports/report-7" },
      { id: "report-8", title: "Report 8 – Installment Schedule", path: "/reports/report-8" },
      { id: "report-9", title: "Report 9 – Loan Distribution Analysis", path: "/reports/report-9" },
    ],
    "Member 4 – Loan Monitoring": [
      { id: "report-10", title: "Report 10 – Overdue Installments", path: "/reports/report-10" },
      { id: "report-11", title: "Report 11 – Active Loans", path: "/reports/report-11" },
      { id: "report-12", title: "Report 12 – Interest Income Analysis", path: "/reports/report-12" },
    ],
    "Member 5 – Account & Transaction Analysis": [
      { id: "report-13", title: "Report 13 – Account Status", path: "/reports/report-13" },
      { id: "report-14", title: "Report 14 – Transaction Type Report", path: "/reports/report-14" },
      { id: "report-15", title: "Report 15 – Account Balance Range Analysis", path: "/reports/report-15" },
    ],
  };

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full shrink-0 border-r border-slate-800">
      {/* Brand Profile */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white tracking-tight text-sm leading-tight">Banking Management System</span>
        </div>
      </div>

      {/* Nav Scroll Area */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {menuData.map((section, index) => {
          if (section.header) {
            return (
              <div key={index} className="space-y-0.5 pt-4">
                <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest px-6 pb-1">
                  {section.header}
                </p>
                {section.items.map((item, subIndex) => (
                  <NavLink
                    key={subIndex}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-6 py-2 pb-2 text-xs font-semibold transition-colors ${
                        isActive 
                          ? "bg-slate-800 text-white" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </div>
            );
          }

          return (
            <NavLink
              key={index}
              to={section.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-2 pb-2 text-xs font-semibold transition-colors ${
                  isActive 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              {section.icon}
              <span>{section.title}</span>
            </NavLink>
          );
        })}

        {/* Collapsible Reports Menu and Nested Tree */}
        <div className="space-y-0.5 pt-4 border-t border-slate-800/60 mt-3 select-none">
          <button
            onClick={() => setIsReportsOpen(!isReportsOpen)}
            className="w-full flex items-center justify-between px-6 py-2.5 text-xs font-extrabold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Landmark size={14} className="text-slate-550 text-slate-500" />
              Reports
            </span>
            {isReportsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isReportsOpen && (
            <div className="pl-6 pr-2 py-1 space-y-3 transition duration-150 animate-fade-in">
              {Object.entries(reportsByMember).map(([member, reports], mIdx) => (
                <div key={mIdx} className="space-y-1">
                  {/* Member Name Section Sub-Header */}
                  <span className="block text-[9px] font-extrabold text-slate-600 uppercase tracking-widest pl-2">
                    {member}
                  </span>
                  {/* Nested Report Links */}
                  <div className="space-y-0.5 border-l border-slate-800 pl-1">
                    {reports.map((rep) => (
                      <NavLink
                        key={rep.id}
                        to={rep.path}
                        className={({ isActive }) =>
                          `flex items-start gap-2 pl-3 pr-2 py-1.5 text-[11px] font-medium transition-all ${
                            isActive
                              ? "text-blue-500 font-extrabold border-l border-blue-500 -ml-[1px]"
                              : "text-slate-500 hover:text-slate-300"
                          }`
                        }
                      >
                        <FileText size={10} className="mt-0.5 shrink-0" />
                        <span className="leading-tight shrink">{rep.title.split(" – ")[1]}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
