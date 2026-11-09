import React, { useState, useEffect } from "react";
import Button from "../common/Button.jsx";

export function LoanForm({ accounts = [], loanTypes = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    account_no: "",
    loan_type_id: "",
    loan_amount: "",
    loan_term: "",
    interest_rate: "",
    start_date: new Date().toISOString().split("T")[0],
    status: "Active"
  });

  const [selectedType, setSelectedType] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (e) => {
    const id = e.target.value;
    setFormData(prev => ({ ...prev, loan_type_id: id }));
    const typeObj = loanTypes.find(t => t.id === Number(id));
    setSelectedType(typeObj || null);
    if (typeObj) {
      setFormData(prev => ({ 
        ...prev, 
        interest_rate: typeObj.default_interest_rate,
        loan_term: typeObj.max_term 
      }));
    }
  };

  const handleAccountChange = (e) => {
    const accNo = e.target.value;
    setFormData(prev => ({ ...prev, account_no: accNo }));
    const accObj = accounts.find(a => a.account_no === accNo);
    setSelectedAccount(accObj || null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.account_no || !formData.loan_type_id || !formData.loan_amount || !formData.loan_term || !formData.start_date) {
      setError("Please fill all required inputs marked with *");
      return;
    }

    const requestedAmount = Number(formData.loan_amount);
    const requestedTerm = Number(formData.loan_term);
    const requestedRate = Number(formData.interest_rate);

    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      setError("Please specify a valid loan principal amount greater than 0");
      return;
    }
    if (isNaN(requestedTerm) || requestedTerm <= 0) {
      setError("Please specify a valid loan term greater than 0");
      return;
    }
    if (isNaN(requestedRate) || requestedRate < 0 || requestedRate > 100) {
      setError("Please specify a valid interest rate between 0% and 100%");
      return;
    }

    // Validate limits
    if (selectedType) {
      if (requestedAmount > Number(selectedType.max_loan_amount)) {
        setError(`Requested amount exceeds maximal permitted amount (${new Intl.NumberFormat().format(selectedType.max_loan_amount)} Baht)`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSubmit({
        ...formData,
        loan_type_id: Number(formData.loan_type_id),
        loan_amount: requestedAmount,
        loan_term: requestedTerm,
        interest_rate: Number(formData.interest_rate)
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to create loan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-950 text-base mb-2">Create New Loan Application</h3>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Account Info Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Select Account No *
          </label>
          <select
            value={formData.account_no}
            onChange={handleAccountChange}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">-- Choose Account --</option>
            {accounts.map(a => (
              <option key={a.id} value={a.account_no}>
                {a.account_no} - {a.customer_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Loan Class Type *
          </label>
          <select
            value={formData.loan_type_id}
            onChange={handleTypeChange}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">-- Choose Type --</option>
            {loanTypes.map(t => (
              <option key={t.id} value={t.id}>
                {t.type_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Auto Filled Customer Info Details */}
      {selectedAccount && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs space-y-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="col-span-1 md:col-span-3 pb-1 border-b border-blue-100/50">
            <p className="font-extrabold uppercase text-blue-800 tracking-wider">Client Profile details</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Client Name:</span>
            <p className="font-bold text-gray-800">{selectedAccount.customer_name}</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Phone:</span>
            <p className="font-bold text-gray-800">{selectedAccount.customer_phone}</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">NRC:</span>
            <p className="font-bold text-gray-800">{selectedAccount.customer_nrc}</p>
          </div>
        </div>
      )}

      {/* Auto Filled Loan Type Details */}
      {selectedType && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-xs grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="col-span-1 md:col-span-4 pb-1 border-b border-amber-100/50">
            <p className="font-extrabold uppercase text-amber-800 tracking-wider">Loan Class Thresholds</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Maximum Term:</span>
            <p className="font-bold text-gray-800">{selectedType.max_term} Months</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase">Max Interest Rate:</span>
            <p className="font-bold text-gray-800">{selectedType.default_interest_rate}% APR</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 font-semibold uppercase">Max Loan Amount:</span>
            <p className="font-extrabold text-amber-800">
              ฿{new Intl.NumberFormat().format(selectedType.max_loan_amount)} Baht
            </p>
          </div>
        </div>
      )}

      {/* Form Entries inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Loan Term Timeframe (Months) *
          </label>
          <input
            type="number"
            name="loan_term"
            required
            value={formData.loan_term}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Loan Interest Rate (%) *
          </label>
          <input
            type="number"
            step="0.01"
            name="interest_rate"
            required
            value={formData.interest_rate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Loan Principal Amount (Baht) *
          </label>
          <input
            type="number"
            name="loan_amount"
            required
            value={formData.loan_amount}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Loan Start Date *
          </label>
          <input
            type="date"
            name="start_date"
            required
            value={formData.start_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            State Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button onClick={onCancel} variant="outline" type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Generating Schedules..." : "Approve Loan Account"}
        </Button>
      </div>
    </form>
  );
}

export default LoanForm;
