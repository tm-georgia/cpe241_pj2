import React, { useState, useEffect } from "react";
import DataTable from "../components/common/DataTable.jsx";
import Button from "../components/common/Button.jsx";
import LoanPaymentForm from "../components/forms/LoanPaymentForm.jsx";
import loanService from "../services/loanService.js";
import { Plus } from "lucide-react";
import { formatDate } from "../utils/date.js";

export function LoanPaymentPage() {
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, form

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, loansData] = await Promise.all([
        loanService.getPayments(),
        loanService.getLoans()
      ]);
      setPayments(paymentsData || []);
      setLoans(loansData || []);
    } catch (err) {
      console.error("Failed to load repayments log", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormSubmit = async (payload) => {
    try {
      await loanService.processRepayment(payload);
      setView("list");
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to process repayment request");
    }
  };

  const columns = [
    { title: "Repayment Reference", key: "code", sortable: true },
    { title: "Loan Reference", key: "loan_code", sortable: true, render: (row) => <span className="font-bold text-amber-700">{row.loan_code}</span> },
    { title: "Client Name", key: "customer_name", sortable: true },
    { title: "Repayment Date", key: "payment_date", render: (row) => formatDate(row.payment_date) },
    { title: "Amount Repaid", key: "total_paid", sortable: true, render: (row) => <span className="font-black text-green-700">฿{new Intl.NumberFormat().format(row.total_paid || 0 )} Baht</span> }
  ];

  if (loading && view === "list") {
    return (
      <div className="flex justify-center items-center h-48 text-sm text-gray-400 font-medium">
        Loading repayments history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Historic repayment logs ({payments.length} Cleared Entries)
            </p>
            <Button 
              onClick={() => setView("form")}
              icon={<Plus size={16} />}
            >
              Collect Repayment
            </Button>
          </div>

          <DataTable 
            columns={columns}
            data={payments}
            searchKey="customer_name"
            searchPlaceholder="Search repayments by borrower name..."
          />
        </div>
      )}

      {view === "form" && (
        <LoanPaymentForm 
          loans={loans}
          onSubmit={handleFormSubmit}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
}

export default LoanPaymentPage;
