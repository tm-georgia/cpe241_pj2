import React, { useState, useEffect } from "react";
import DataTable from "../components/common/DataTable.jsx";
import Button from "../components/common/Button.jsx";
import LoanScheduleForm from "../components/forms/LoanScheduleForm.jsx";
import loanService from "../services/loanService.js";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { Plus } from "lucide-react";
import { formatDate } from "../utils/date.js";

export function LoanSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, form

  const loadData = async () => {
    setLoading(true);
    try {
      const [schData, loansData] = await Promise.all([
        loanService.getSchedules(),
        loanService.getLoans()
      ]);
      setSchedules(schData || []);
      setLoans(loansData || []);
    } catch (err) {
      console.error("Failed to load schedules", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormSubmit = async (payload) => {
    try {
      await loanService.createManualSchedules(payload);
      setView("list");
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to configure schedule override");
    }
  };

  const columns = [
    { title: "Installment", key: "installment_no", sortable: true, render: (row) => <span># {row.installment_no}</span> },
    { title: "Loan Account", key: "loan_code", sortable: true, render: (row) => <span className="text-amber-700 font-bold">{row.loan_code}</span> },
    { title: "Due Date", key: "due_date", render: (row) => formatDate(row.due_date) },
    { title: "Amount To Be Paid Back", key: "amount_to_be_paid_back", sortable: true, render: (row) => <span className="font-extrabold">฿{new Intl.NumberFormat().format(row.amount_to_be_paid_back)} Baht</span> },
    { title: "Status", key: "status", render: (row) => <StatusBadge status={row.status} /> }
  ];

  if (loading && view === "list") {
    return (
      <div className="flex justify-center items-center h-48 text-sm text-gray-400 font-medium">
        Loading schedule milestones...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Amortization Schedules & Milestones ({schedules.length} Items)
            </p>
            <Button 
              onClick={() => setView("form")}
              icon={<Plus size={16} />}
            >
              Manual Schedule Override
            </Button>
          </div>

          <DataTable 
            columns={columns}
            data={schedules}
            searchKey="customer_name"
            searchPlaceholder="Search milestones by customer name..."
          />
        </div>
      )}

      {view === "form" && (
        <LoanScheduleForm 
          loans={loans}
          onSubmit={handleFormSubmit}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
}

export default LoanSchedulePage;
