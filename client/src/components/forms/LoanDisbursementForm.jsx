import React, { useState } from "react";
import Button from "../common/Button.jsx";
import LineItemEditor from "../common/LineItemEditor.jsx";

export function LoanDisbursementForm({ loans = [], onSubmit, onCancel }) {
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [loanDetails, setLoanDetails] = useState(null);
  const [lines, setLines] = useState([{ disbursement_date: new Date().toISOString().split("T")[0], disbursement_amount: "" }]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleLoanChange = (e) => {
    const loanId = e.target.value;
    setSelectedLoanId(loanId);
    const detail = loans.find(l => l.id === Number(loanId));
    setLoanDetails(detail || null);
  };

  const handleLinesChange = (updatedLines) => {
    setLines(updatedLines);
  };

  const handleAddLine = () => {
    setLines(prev => [...prev, { disbursement_date: new Date().toISOString().split("T")[0], disbursement_amount: "" }]);
  };

  const handleRemoveLine = (index) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return lines.reduce((sum, item) => sum + Number(item.disbursement_amount || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoanId) {
      setError("Please select a target Loan ID record");
      return;
    }
    if (lines.length === 0 || lines.some(l => !l.disbursement_amount)) {
      setError("All lines must specify a disbursement amount");
      return;
    }

    const totalDisbursement = calculateTotal();
    const remainingToDisburse = loanDetails ? Number(loanDetails.remaining_to_disburse ?? loanDetails.loan_amount) : 0;
    if (totalDisbursement > remainingToDisburse + 0.01) {
      setError("Disbursement amount exceeds remaining available loan balance.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        loan_id: Number(selectedLoanId),
        lines: lines.map(l => ({
          disbursement_date: l.disbursement_date,
          disbursement_amount: Number(l.disbursement_amount)
        }))
      });
      setSuccess(true);
      setLines([{ disbursement_date: new Date().toISOString().split("T")[0], disbursement_amount: "" }]);
      setSelectedLoanId("");
      setLoanDetails(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to log disbursement");
    } finally {
      setSaving(false);
    }
  };

  const fieldsConfig = [
    { key: "disbursement_date", title: "Disbursement Date *", type: "date" },
    { key: "disbursement_amount", title: "Amount (Baht) *", type: "number", placeholder: "e.g. 1000000" }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-950 text-base mb-2">Process Loan Disbursement</h3>

      {success && (
        <div className="bg-green-50 text-green-700 text-xs font-semibold p-4 rounded-lg border border-green-100 animate-fade-in">
          Disbursement submitted successfully. Active deposit account credited.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Select Loan Dropdown */}
      <div className="space-y-1 max-w-md">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
          Select Active Loan ID
        </label>
        <select
          value={selectedLoanId}
          onChange={handleLoanChange}
          required
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          <option value="">-- Choose Loan --</option>
          {loans.filter(l => l.loan_status !== "FULLY_DISBURSED" && l.loan_status !== "Paid").map(l => (
            <option key={l.id} value={l.id}>
              {l.code} - {l.customer_name} (Remaining: {new Intl.NumberFormat().format(l.remaining_to_disburse ?? l.loan_amount)} Baht)
            </option>
          ))}
        </select>
      </div>

      {/* Header Profile Info Panel */}
      {loanDetails && (
        <div id="loan-disb-profile-panel" className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-xs grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in font-sans">
          <div className="col-span-2 md:col-span-4 border-b border-gray-200/50 pb-1 flex justify-between items-center">
            <p className="font-extrabold uppercase text-gray-500 tracking-wider">Loan Summary & Holder</p>
            <span className="text-xs font-mono px-2 py-0.5 bg-amber-50 rounded border border-amber-200/55 font-bold text-amber-800">
              {loanDetails.code}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Client Name:</span>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{loanDetails.customer_name}</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Link Account No:</span>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{loanDetails.account_no}</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Loan Status:</span>
            <p className="font-bold text-gray-800 text-sm mt-0.5">
              <span className="px-2 py-0.5 text-[11px] rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                {loanDetails.loan_status}
              </span>
            </p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Phone:</span>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{loanDetails.customer_phone || "N/A"}</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Approved Loan Amount:</span>
            <p className="font-medium text-gray-800 text-sm mt-0.5">฿{new Intl.NumberFormat().format(loanDetails.loan_amount)} Baht</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Total Disbursed:</span>
            <p className="font-medium text-blue-700 text-sm mt-0.5 font-bold">฿{new Intl.NumberFormat().format(loanDetails.total_disbursed ?? 0)} Baht</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Remaining To Disburse:</span>
            <p className="font-black text-amber-600 text-sm mt-0.5">฿{new Intl.NumberFormat().format(loanDetails.remaining_to_disburse ?? loanDetails.loan_amount)} Baht</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Outstanding balance:</span>
            <p className="font-semibold text-gray-500 text-sm mt-0.5">฿{new Intl.NumberFormat().format(loanDetails.outstanding_balance)} Baht</p>
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
        title="Disbursement Line Items"
      />

      {/* Summarize totals */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center text-sm">
        <div>
          <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Total payout lines: </span>
          <span className="font-bold text-gray-700">{lines.length}</span>
        </div>
        <div>
          <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Total Disbursement: </span>
          <span className="font-black text-blue-700 text-base">
            ฿{new Intl.NumberFormat().format(calculateTotal())}
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button onClick={onCancel} variant="outline" type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !selectedLoanId}>
          {saving ? "Posting..." : "Post Disbursement"}
        </Button>
      </div>
    </form>
  );
}

export default LoanDisbursementForm;
