import React, { useState } from "react";
import Button from "../common/Button.jsx";

export function AccountForm({ customers = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    account_no: "",
    customer_id: "",
    open_date: new Date().toISOString().split("T")[0],
    current_balance: "",
    status: "Active"
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || formData.current_balance === "") {
      setError("Please fill all required records marked with *");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...formData,
        customer_id: Number(formData.customer_id),
        current_balance: Number(formData.current_balance)
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-950 text-base mb-2">Open New Account</h3>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-3.5 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Account Number (Optional)
          </label>
          <input
            type="text"
            name="account_no"
            value={formData.account_no}
            onChange={handleChange}
            placeholder="Auto-generated if left blank"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Assign Customer *
          </label>
          <select
            name="customer_id"
            required
            value={formData.customer_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">-- Choose Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Opening Balance (Baht) *
          </label>
          <input
            type="number"
            name="current_balance"
            required
            min="0"
            value={formData.current_balance}
            onChange={handleChange}
            placeholder="e.g. 500000"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Open Date *
          </label>
          <input
            type="date"
            name="open_date"
            required
            value={formData.open_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Account Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Dormant">Dormant</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button onClick={onCancel} variant="outline" type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}

export default AccountForm;
