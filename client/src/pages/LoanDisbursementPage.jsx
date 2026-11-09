import React, { useState, useEffect } from "react";
import DataTable from "../components/common/DataTable.jsx";
import Button from "../components/common/Button.jsx";
import LoanDisbursementForm from "../components/forms/LoanDisbursementForm.jsx";
import loanService from "../services/loanService.js";
import { Plus } from "lucide-react";
import { formatDate } from "../utils/date.js";

export function LoanDisbursementPage() {
  const [disbursements, setDisbursements] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, form

  const loadData = async () => {
    setLoading(true);
    try {
      const [disData, loansData] = await Promise.all([
        loanService.getDisbursements(),
        loanService.getLoans()
      ]);
      setDisbursements(disData || []);
      setLoans(loansData || []);
    } catch (err) {
      console.error("Failed to load payout details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormSubmit = async (payload) => {
    try {
      await loanService.createDisbursement(payload);
      setView("list");
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to submit Disbursement");
    }
  };

  const columns = [
    { title: "ID", key: "id", sortable: true },
    { title: "Loan Reference", key: "loan_code", sortable: true, render: (row) => <span className="font-bold text-amber-700">{row.loan_code}</span> },
    { title: "Client Name", key: "customer_name", sortable: true },
    { title: "Disbursed Date", key: "disbursement_date", render: (row) => formatDate(row.disbursement_date) },
    { title: "Payout Value", key: "disbursement_amount", sortable: true, render: (row) => <span className="font-extrabold text-blue-700">฿{new Intl.NumberFormat().format(row.disbursement_amount)} Baht</span> }
  ];

  if (loading && view === "list") {
    return (
      <div className="flex justify-center items-center h-48 text-sm text-gray-400 font-medium">
        Loading payout disbursals list...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Issued Payout registers ({disbursements.length} Logs)
            </p>
            <Button 
              onClick={() => setView("form")}
              icon={<Plus size={16} />}
            >
              Post Capital Disbursement
            </Button>
          </div>

          <DataTable 
            columns={columns}
            data={disbursements}
            searchKey="customer_name"
            searchPlaceholder="Search by customer name..."
          />
        </div>
      )}

      {view === "form" && (
        <LoanDisbursementForm 
          loans={loans}
          onSubmit={handleFormSubmit}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
}

export default LoanDisbursementPage;
