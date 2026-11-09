import React, { useState } from "react";
import Button from "../common/Button.jsx";
import LineItemEditor from "../common/LineItemEditor.jsx";

export function LoanScheduleForm({ loans = [], onSubmit, onCancel }) {
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [lines, setLines] = useState([{ installment_no: "1", due_date: "", amount_to_be_paid_back: "", status: "Unpaid" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleLoanChange = (e) => {
    setSelectedLoanId(e.target.value);
  };

  const handleLinesChange = (updatedLines) => {
    setLines(updatedLines);
  };

  const handleAddLine = () => {
    const nextNo = String(lines.length + 1);
    setLines(prev => [...prev, { installment_no: nextNo, due_date: "", amount_to_be_paid_back: "", status: "Unpaid" }]);
  };

  const handleRemoveLine = (index) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoanId) {
      setError("Please select a target Loan ID first");
      return;
    }
    if (lines.length === 0 || lines.some(l => !l.due_date || !l.amount_to_be_paid_back)) {
      setError("Please ensure due date and amount to be paid back are filled in all line items");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        loan_id: Number(selectedLoanId),
        schedules: lines.map(l => ({
          installment_no: Number(l.installment_no),
          due_date: l.due_date,
          amount_to_be_paid_back: Number(l.amount_to_be_paid_back),
          status: l.status
        }))
      });
      setSuccess(true);
      setLines([{ installment_no: "1", due_date: "", amount_to_be_paid_back: "", status: "Unpaid" }]);
      setSelectedLoanId("");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to save payment schedules");
    } finally {
      setSaving(false);
    }
  };

  const fieldsConfig = [
    { key: "installment_no", title: "Installment No *", type: "number", placeholder: "1" },
    { key: "due_date", title: "Due Date *", type: "date" },
    { key: "amount_to_be_paid_back", title: "Amount To Be Paid Back (Baht) *", type: "number" },
    { key: "status", title: "Status", type: "select", options: [
      { value: "Unpaid", label: "Unpaid" },
      { value: "Paid", label: "Paid" }
    ]}
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-950 text-base mb-2">Configure Manual Payment Schedule</h3>

      {success && (
        <div className="bg-green-50 text-green-700 text-xs font-semibold p-4 rounded-lg border border-green-100">
          Manual schedule lines added successfully to target Loan profile.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-1 max-w-md">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
          Select Target Loan
        </label>
        <select
          value={selectedLoanId}
          onChange={handleLoanChange}
          required
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          <option value="">-- Choose Loan --</option>
          {loans.map(l => (
            <option key={l.id} value={l.id}>
              {l.code} - {l.customer_name} ({new Intl.NumberFormat().format(l.loan_amount)} Baht)
            </option>
          ))}
        </select>
      </div>

      <LineItemEditor
        items={lines}
        onChange={handleLinesChange}
        onAdd={handleAddLine}
        onRemove={handleRemoveLine}
        fields={fieldsConfig}
        title="Schedule Milestones Override"
      />

      <div className="flex gap-3 justify-end pt-2">
        <Button onClick={onCancel} variant="outline" type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !selectedLoanId}>
          {saving ? "Deploying..." : "Publish Schedule"}
        </Button>
      </div>
    </form>
  );
}

export default LoanScheduleForm;
