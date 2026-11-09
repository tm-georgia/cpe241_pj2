import React, { useState, useEffect } from "react";
import Button from "../common/Button.jsx";
import LineItemEditor from "../common/LineItemEditor.jsx";
import { loanService } from "../../services/loanService.js";
import { formatDateOrEmpty } from "../../utils/date.js";

export function LoanPaymentForm({ loans = [], onSubmit, onCancel }) {
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [loanDetails, setLoanDetails] = useState(null);
  const [schedules, setSchedules] = useState([]);
  
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [lines, setLines] = useState([{ schedule_id: "", due_date: "", amount_to_be_paid_back: "", amount_paid: "" }]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch loan schedules dynamically when a loan is selected
  useEffect(() => {
    if (!selectedLoanId) {
      setSchedules([]);
      return;
    }

    const loadSchedules = async () => {
      try {
        const list = await loanService.getSchedulesByLoan(selectedLoanId);
        // Exclude already Paid schedules
        setSchedules(list.filter(s => s.status !== "Paid") || []);
      } catch (err) {
        console.error("Failed to load loan schedules", err);
      }
    };

    loadSchedules();
  }, [selectedLoanId]);

  const handleLoanChange = (e) => {
    const loanId = e.target.value;
    setSelectedLoanId(loanId);
    const detail = loans.find(l => l.id === Number(loanId));
    setLoanDetails(detail || null);
    // Reset lines
    setLines([{ schedule_id: "", due_date: "", amount_to_be_paid_back: "", amount_paid: "" }]);
  };

  const handleLinesChange = (updatedLines) => {
    // If schedule_id is selected, auto-fill due_date and amount_to_be_paid_back
    const processes = updatedLines.map(line => {
      if (line.schedule_id) {
        const schObj = schedules.find(s => s.id === Number(line.schedule_id));
        if (schObj && (!line.due_date || line.due_date !== schObj.due_date)) {
          return {
            ...line,
            due_date: formatDateOrEmpty(schObj.due_date),
            amount_to_be_paid_back: schObj.amount_to_be_paid_back,
            amount_paid: schObj.amount_to_be_paid_back, // Default to full amount outstanding
            applied_interest_rate: loanDetails ? loanDetails.interest_rate : 0
          };
        }
      }
      return line;
    });
    setLines(processes);
  };

  const handleAddLine = () => {
    setLines(prev => [...prev, { schedule_id: "", due_date: "", amount_to_be_paid_back: "", amount_paid: "" }]);
  };

  const handleRemoveLine = (index) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return lines.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoanId) {
      setError("Please select a target Loan ID first");
      return;
    }
    if (lines.length === 0 || lines.some(l => !l.schedule_id || !l.amount_paid)) {
      setError("Please ensure schedule ID and payment amounts are specified in all columns");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        loan_id: Number(selectedLoanId),
        payment_date: paymentDate,
        lines: lines.map(l => ({
          schedule_id: Number(l.schedule_id),
          amount_due: Number(l.amount_to_be_paid_back),
          amount_to_be_paid_back: Number(l.amount_to_be_paid_back),
          amount_paid: Number(l.amount_paid),
          applied_interest_rate: Number(l.applied_interest_rate || (loanDetails ? loanDetails.interest_rate : 0))
        }))
      });
      setSuccess(true);
      setLines([{ schedule_id: "", due_date: "", amount_to_be_paid_back: "", amount_paid: "" }]);
      setSelectedLoanId("");
      setLoanDetails(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to process repayment");
    } finally {
      setSaving(false);
    }
  };

  // Convert schedules of selected loan to select items
  const schOptions = schedules.map(s => ({
    value: s.id,
    label: `Inst. #${s.installment_no} - Due: ${formatDateOrEmpty(s.due_date)} - Due: ฿${new Intl.NumberFormat().format(s.amount_to_be_paid_back)} Baht`
  }));

  const fieldsConfig = [
    { key: "schedule_id", title: "Select Schedule *", type: "select", options: schOptions, placeholder: "-- Choose Installment --" },
    { key: "due_date", title: "Due Date", type: "text", disabled: true },
    { key: "amount_to_be_paid_back", title: "Amount To Be Paid Back (Baht)", type: "number", disabled: true },
    { key: "amount_paid", title: "Amount Repaying *", type: "number", placeholder: "e.g. 180000" }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-950 text-base mb-2">Process Loan Installment Repayment</h3>

      {success && (
        <div className="bg-green-50 text-green-700 text-xs font-semibold p-4 rounded-lg border border-green-100 animate-fade-in">
          Installment payment cleared. Outstanding balance decremented and client's account debited.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Payment Date *
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Select Active Loan *
          </label>
          <select
            value={selectedLoanId}
            onChange={handleLoanChange}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">-- Choose Loan Profile --</option>
            {loans.map(l => (
              <option key={l.id} value={l.id}>
                {l.code} - {l.customer_name} ({new Intl.NumberFormat().format(l.loan_amount)} Baht)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Auto-fill Customer profiles */}
      {loanDetails && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 text-xs grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-4 border-b border-blue-100/50 pb-1">
            <p className="font-extrabold uppercase text-blue-800 tracking-wider">Repayer Details</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Client Name:</span>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{loanDetails.customer_name}</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Assigned Bank Account:</span>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{loanDetails.account_no}</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Ledger Balance (Baht):</span>
            <p className="font-extrabold text-blue-800 text-sm mt-0.5">฿{new Intl.NumberFormat().format(loanDetails.account_balance || 0)}</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Outstanding Loan Balance:</span>
            <p className="font-extrabold text-red-700 text-sm mt-0.5">฿{new Intl.NumberFormat().format(loanDetails.outstanding_balance)}</p>
          </div>
        </div>
      )}

      {/* Line Item editor */}
      <LineItemEditor
        items={lines}
        onChange={handleLinesChange}
        onAdd={handleAddLine}
        onRemove={handleRemoveLine}
        fields={fieldsConfig}
        title="Schedule repayment Items"
      />

      {/* Total panel */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center text-sm">
        <div>
          <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Repaying Inst. Count: </span>
          <span className="font-bold text-gray-700">{lines.length}</span>
        </div>
        <div>
          <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Total Repayment Amount: </span>
          <span className="font-black text-green-700 text-base">
            ฿{new Intl.NumberFormat().format(calculateTotal())}
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button onClick={onCancel} variant="outline" type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !selectedLoanId}>
          {saving ? "Clearing log..." : "Confirm Repayment"}
        </Button>
      </div>
    </form>
  );
}

export default LoanPaymentForm;
