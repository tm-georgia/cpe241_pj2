import React, { useState } from "react";
import { useAccount } from "../hooks/useAccount.js";
import { useCustomer } from "../hooks/useCustomer.js";
import DataTable from "../components/common/DataTable.jsx";
import Button from "../components/common/Button.jsx";
import AccountForm from "../components/forms/AccountForm.jsx";
import accountService from "../services/accountService.js";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { Plus, ArrowLeft } from "lucide-react";
import { formatDate } from "../utils/date.js";

export function AccountPage() {
  const { accounts, loading, refresh } = useAccount();
  const { customers } = useCustomer();
  
  const [view, setView] = useState("list"); // list, form, detail
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [accDetails, setAccDetails] = useState(null);

  const handleRowClick = async (row) => {
    try {
      const detail = await accountService.getAccountById(row.id);
      setAccDetails(detail);
      setView("detail");
    } catch (err) {
      console.error("Failed to load details", err);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      await accountService.createAccount(formData);
      setView("list");
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to open account");
    }
  };

  const columns = [
    { title: "Account Number", key: "account_no", sortable: true, render: (row) => <span className="text-blue-600 font-extrabold">{row.account_no}</span> },
    { title: "Customer Name", key: "customer_name", sortable: true },
    { title: "Open Date", key: "open_date", render: (row) => formatDate(row.open_date) },
    { title: "Current Balance", key: "current_balance", sortable: true, render: (row) => <span className="font-extrabold text-gray-900">฿{new Intl.NumberFormat().format(row.current_balance)} Baht</span> },
    { title: "Status", key: "status", render: (row) => <StatusBadge status={row.status} /> }
  ];

  if (loading && view === "list") {
    return (
      <div className="flex justify-center items-center h-48 text-sm text-gray-400 font-medium">
        Loading accounts records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Open Deposit / Checking Ledger Accounts ({accounts.length} Entries)
            </p>
            <Button 
              onClick={() => setView("form")}
              icon={<Plus size={16} />}
            >
              Open New Account
            </Button>
          </div>

          <DataTable 
            columns={columns}
            data={accounts}
            onRowClick={handleRowClick}
            searchKey="account_no"
            searchPlaceholder="Search by Account Number..."
          />
        </div>
      )}

      {view === "form" && (
        <AccountForm 
          customers={customers}
          onSubmit={handleFormSubmit}
          onCancel={() => setView("list")}
        />
      )}

      {view === "detail" && accDetails && (
        <div className="space-y-6">
          <button 
            onClick={() => setView("list")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 bg-white border border-gray-100 px-3 py-2 rounded-lg shadow-sm"
          >
            <ArrowLeft size={14} /> Back to accounts
          </button>

          {/* Account information details banner */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6 shadow-sm animate-fade-in">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-extrabold text-blue-650 text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                  {accDetails.status}
                </span>
                <h3 className="font-extrabold text-gray-900 text-lg mt-1.5">{accDetails.account_no}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-400 uppercase">Available Balance</span>
                <h3 className="font-black text-blue-700 text-xl mt-0.5">
                  ฿{new Intl.NumberFormat().format(accDetails.current_balance)} Baht
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-semibold">
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Primary Client Name:</span>
                <p className="text-gray-900 font-bold text-sm mt-0.5">{accDetails.customer_name}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Client Phone No:</span>
                <p className="text-gray-900 font-bold text-sm mt-0.5">{accDetails.customer_phone}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Client NRC:</span>
                <p className="text-gray-900 font-bold text-sm mt-0.5">{accDetails.customer_nrc}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Open Date:</span>
                <p className="text-gray-900 font-bold text-sm mt-0.5">
                  {formatDate(accDetails.open_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Connected Charge actions history */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-gray-950 text-sm">Service Charges Log history</h4>
            {(!accDetails.charges || accDetails.charges.length === 0) ? (
              <p className="text-gray-400 text-xs py-2">No charges were debited from this account history.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-extrabold uppercase">
                    <tr>
                      <th className="px-5 py-3">Reference No</th>
                      <th className="px-5 py-3">Charge Type</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Memo Remark</th>
                      <th className="px-5 py-3 text-right">Debit amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                    {accDetails.charges.map((chg, i) => (
                      <tr key={i}>
                        <td className="px-5 py-3 text-gray-400">CHG-{chg.id}</td>
                        <td className="px-5 py-3 text-blue-600 uppercase font-extrabold">{chg.charge_type}</td>
                        <td className="px-5 py-3">{formatDate(chg.date)}</td>
                        <td className="px-5 py-3 font-medium text-gray-500">{chg.description || "Service charge standard standard deduction"}</td>
                        <td className="px-5 py-3 text-right font-black text-red-650 text-red-600">
                          - ฿{new Intl.NumberFormat().format(chg.charge_amount)} Baht
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;
