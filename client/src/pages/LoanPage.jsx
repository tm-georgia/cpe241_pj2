import React, { useState } from "react";
import { useLoan } from "../hooks/useLoan.js";
import { useAccount } from "../hooks/useAccount.js";
import DataTable from "../components/common/DataTable.jsx";
import Button from "../components/common/Button.jsx";
import LoanForm from "../components/forms/LoanForm.jsx";
import loanService from "../services/loanService.js";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { Plus, ArrowLeft } from "lucide-react";
import { formatDate } from "../utils/date.js";

export function LoanPage() {
  const { loans, loanTypes, loading, refresh } = useLoan();
  const { accounts } = useAccount();

  const [view, setView] = useState("list"); // list, form, detail
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanDetails, setLoanDetails] = useState(null);

  const handleRowClick = async (row) => {
    try {
      const detail = await loanService.getLoanById(row.id);
      setLoanDetails(detail);
      setView("detail");
    } catch (err) {
      console.error("Failed to load details", err);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      await loanService.createLoan(formData);
      await refresh();
      setView("list");
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to create loan application");
    }
  };

  const columns = [
    { title: "Loan Code", key: "code", sortable: true },
    { title: "Client Name", key: "customer_name", sortable: true },
    { title: "Loan Class", key: "loan_type_name", sortable: true },
    { title: "Principal Amount", key: "loan_amount", sortable: true, render: (row) => <span className="font-bold">฿{new Intl.NumberFormat().format(row.loan_amount)} Baht</span> },
    { title: "Outstanding Balance", key: "outstanding_balance", sortable: true, render: (row) => <span className="font-extrabold text-red-600">฿{new Intl.NumberFormat().format(row.outstanding_balance)} Baht</span> },
    { title: "Interest Rate", key: "interest_rate", render: (row) => `${row.interest_rate}%` },
    { title: "Status", key: "loan_status", render: (row) => <StatusBadge status={row.loan_status} /> }
  ];

  if (loading && view === "list") {
    return (
      <div className="flex justify-center items-center h-48 text-sm text-gray-400 font-medium">
        Loading loans portfolios...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Loans Accounts Desk ({loans.length} Portfolios)
            </p>
            <Button 
              onClick={() => setView("form")}
              icon={<Plus size={16} />}
            >
              Issue New Loan Unit
            </Button>
          </div>

          <DataTable 
            columns={columns}
            data={loans}
            onRowClick={handleRowClick}
            searchKey="customer_name"
            searchPlaceholder="Search active files by customer name..."
          />
        </div>
      )}

      {view === "form" && (
        <LoanForm 
          accounts={accounts}
          loanTypes={loanTypes}
          onSubmit={handleFormSubmit}
          onCancel={() => setView("list")}
        />
      )}

      {view === "detail" && loanDetails && (
        <div className="space-y-6">
          <button 
            onClick={() => setView("list")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 bg-white border border-gray-100 px-3 py-2 rounded-lg shadow-sm"
          >
            <ArrowLeft size={14} /> Back to portfolios
          </button>

          {/* Master Detail header visualizer */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6 shadow-sm animate-fade-in">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-extrabold text-amber-850 text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded">
                  {loanDetails.loan_status}
                </span>
                <h3 className="font-extrabold text-gray-900 text-lg mt-1.5">{loanDetails.code} ({loanDetails.loan_type_name})</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-400 uppercase">Outstanding Loan Balance</span>
                <h3 className="font-black text-red-600 text-xl mt-0.5">
                  ฿{new Intl.NumberFormat().format(loanDetails.outstanding_balance)} Baht
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-semibold">
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Borrower Name:</span>
                <p className="text-gray-900 font-bold text-sm mt-0.5">{loanDetails.customer_name}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Settlement Account:</span>
                <p className="text-gray-900 font-extrabold text-sm mt-0.5 text-blue-600">{loanDetails.account_no}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Interest Rate:</span>
                <p className="text-gray-900 font-bold text-sm mt-0.5">{loanDetails.interest_rate}% APR</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Loan Term Duration:</span>
                <p className="text-gray-900 font-bold text-sm mt-0.5">{loanDetails.loan_term} Months</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Approved Principal:</span>
                <p className="text-gray-900 font-extrabold text-sm mt-0.5">฿{new Intl.NumberFormat().format(loanDetails.loan_amount)} Baht</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Borrower Address:</span>
                <p className="text-gray-800 font-medium text-xs mt-0.5 truncate max-w-[200px]">{loanDetails.customer_address}</p>
              </div>
            </div>
          </div>

          {/* Connected Schedules Table */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-gray-950 text-sm">Automated Amortization Schedules</h4>
            {(!loanDetails.schedules || loanDetails.schedules.length === 0) ? (
              <p className="text-gray-400 text-xs py-2">No repayment milestones generated yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-extrabold uppercase">
                    <tr>
                      <th className="px-5 py-3">Installment No</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Milestone Status</th>
                      <th className="px-5 py-3 text-right">Amount To Be Paid Back</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-105 divide-gray-100 font-bold text-gray-700">
                    {loanDetails.schedules.map((sch, i) => (
                      <tr key={i} className="hover:bg-gray-50/40">
                        <td className="px-5 py-3"># {sch.installment_no}</td>
                        <td className="px-5 py-3">{formatDate(sch.due_date)}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={sch.status} />
                        </td>
                        <td className="px-5 py-3 text-right font-black text-gray-900">
                          ฿{new Intl.NumberFormat().format(sch.amount_to_be_paid_back)} Baht
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Connected Disbursements and Payments in Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Disbursements Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm">
              <h4 className="font-extrabold text-gray-950 text-sm">Loan Disbursements History</h4>
              {(!loanDetails.disbursements || loanDetails.disbursements.length === 0) ? (
                <p className="text-gray-400 text-xs py-2">No disbursements have been recorded for this loan yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-extrabold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Disb. Code</th>
                        <th className="px-4 py-2.5">Disb. Date</th>
                        <th className="px-4 py-2.5 text-right">Amount Disbursed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                      {loanDetails.disbursements.map((disb, i) => (
                        <tr key={i} className="hover:bg-gray-50/40">
                          <td className="px-4 py-2.5 text-blue-600">{disb.code}</td>
                          <td className="px-4 py-2.5">{formatDate(disb.disbursement_date)}</td>
                          <td className="px-4 py-2.5 text-right font-black text-gray-950">
                            ฿{new Intl.NumberFormat().format(disb.disbursement_amount)} Baht
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payments Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm">
              <h4 className="font-extrabold text-gray-950 text-sm">Loan Repayments History</h4>
              {(!loanDetails.payments || loanDetails.payments.length === 0) ? (
                <p className="text-gray-400 text-xs py-2">No repayments have been received for this loan yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-extrabold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Pay. Code</th>
                        <th className="px-4 py-2.5">Payment Date</th>
                        <th className="px-4 py-2.5 text-right">Amount Repaid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                      {loanDetails.payments.map((pay, i) => (
                        <tr key={i} className="hover:bg-gray-50/40">
                          <td className="px-4 py-2.5 text-emerald-600">{pay.code}</td>
                          <td className="px-4 py-2.5">{formatDate(pay.payment_date)}</td>
                          <td className="px-4 py-2.5 text-right font-black text-emerald-700">
                            ฿{new Intl.NumberFormat().format(pay.payment_amount)} Baht
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoanPage;
