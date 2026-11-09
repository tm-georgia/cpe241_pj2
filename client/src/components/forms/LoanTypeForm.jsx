import React, { useState } from "react";
import Button from "../common/Button.jsx";

export function LoanTypeForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    code: "",
    type_name: "",
    default_interest_rate: "10",
    max_term: "36",
    max_loan_amount: ""
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    onSubmit(formData);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg bg-white p-5 rounded-xl border border-gray-100">
      <h3 className="font-bold text-gray-900 text-sm">Add New Loan Category</h3>
      <div className="space-y-3 text-xs">
        <input
          type="text"
          placeholder="Code e.g. LNT-004"
          required
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
        />
        <input
          type="text"
          placeholder="Name e.g. Student Loan"
          required
          value={formData.type_name}
          onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
        />
        <input
          type="number"
          placeholder="Default Interest Rate (%)"
          required
          value={formData.default_interest_rate}
          onChange={(e) => setFormData({ ...formData, default_interest_rate: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
        />
        <input
          type="number"
          placeholder="Max Term (Months)"
          required
          value={formData.max_term}
          onChange={(e) => setFormData({ ...formData, max_term: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
        />
        <input
          type="number"
          placeholder="Max Loan Limit (Baht)"
          required
          value={formData.max_loan_amount}
          onChange={(e) => setFormData({ ...formData, max_loan_amount: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button onClick={onCancel} variant="outline">Cancel</Button>
        <Button type="submit">{saving ? "Saving..." : "Create Category"}</Button>
      </div>
    </form>
  );
}

export default LoanTypeForm;
