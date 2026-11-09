import React, { useState, useEffect } from "react";
import DataTable from "../components/common/DataTable.jsx";
import Button from "../components/common/Button.jsx";
import AccountChargeForm from "../components/forms/AccountChargeForm.jsx";
import accountService from "../services/accountService.js";
import { Plus } from "lucide-react";
import { formatDate } from "../utils/date.js";

export function AccountChargePage() {
  const [charges, setCharges] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, form

  const loadData = async () => {
    setLoading(true);
    try {
      const [accs] = await Promise.all([
        accountService.getAccounts()
      ]);
      setAccounts(accs || []);

      // Compile Posted charges lists across all accounts for the overview table
      const list = [];
      for (const a of accs) {
        const details = await accountService.getAccountById(a.id);
        if (details && details.charges) {
          details.charges.forEach(chg => {
            list.push({
              ...chg,
              account_no: a.account_no,
              customer_name: a.customer_name
            });
          });
        }
      }
      setCharges(list);
    } catch (err) {
      console.error("Failed to load fee information", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormSubmit = async (payload) => {
    try {
      await accountService.applyCharges(payload);
      setView("list");
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to process charges");
    }
  };

  const columns = [
    { title: "Invoice Ref", key: "id", sortable: true, render: (row) => <span>CHG-{row.id}</span> },
    { title: "Account Number", key: "account_no", sortable: true, render: (row) => <span className="font-extrabold text-blue-600">{row.account_no}</span> },
    { title: "Client Name", key: "customer_name", sortable: true },
    { title: "Fee Category", key: "charge_type", sortable: true, render: (row) => <span className="uppercase text-amber-700 font-extrabold">{row.charge_type || "Service Charge" }</span> },
    
    { title: "Deducted Amount", key: "charge_amount", sortable: true, render: (row) => <span className="font-extrabold text-red-600">- ฿{new Intl.NumberFormat().format(Number(row.charge_amount) || 0)} Baht</span> }
  ];

  if (loading && view === "list") {
    return (
      <div className="flex justify-center items-center h-48 text-sm text-gray-400 font-medium">
        Loading service charges ledgers...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Service Fee Ledger Postings ({charges.length} Debits)
            </p>
            <Button 
              onClick={() => setView("form")}
              icon={<Plus size={16} />}
            >
              Levy Account Service Charge
            </Button>
          </div>

          <DataTable 
            columns={columns}
            data={charges}
            searchKey="customer_name"
            searchPlaceholder="Search charges by customer name..."
          />
        </div>
      )}

      {view === "form" && (
        <AccountChargeForm 
          accounts={accounts}
          onSubmit={handleFormSubmit}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
}

export default AccountChargePage;
