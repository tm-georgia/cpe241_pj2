import React, { useState } from "react";
import Button from "../common/Button.jsx";
import { formatDateOrEmpty } from "../../utils/date.js";

export function CustomerForm({ initialData = {}, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    code: initialData.code || "",
    name: initialData.name || "",
    nrc_no: initialData.nrc_no || "",
    phone_no: initialData.phone_no || "",
    address_line1: initialData.address_line1 || "",
    address_line2: initialData.address_line2 || "",
    date_of_birth: formatDateOrEmpty(initialData.date_of_birth)
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.nrc_no || !formData.phone_no || !formData.address_line1 || !formData.date_of_birth) {
      setError("Please fill all required fields marked with *");
      return;
    }

    // NRC number validation: must be exactly 9 numeric digits, ask again if other inputs are entered as requested
    const cleanNrc = formData.nrc_no.trim();
    const isOnlyNineDigits = /^\d{9}$/.test(cleanNrc);
    if (!isOnlyNineDigits) {
      setError("NRC number must be exactly 9 numbers. If any non-numeric or other input is entered, it is not accepted. Please check and enter exactly 9 numbers again.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({ ...formData, nrc_no: cleanNrc });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to submit customer records");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl bg-white p-6 rounded-xl border border-gray-100">
      <h3 className="font-bold text-gray-950 text-base mb-2">
        {initialData.id ? "Edit Customer Info" : "Create New Customer Profile"}
      </h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-3.5 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Customer Code (Optional)
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="Auto-generated if left blank"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Aung Zaw Latt"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            NRC Number *
          </label>
          <input
            type="text"
            name="nrc_no"
            required
            value={formData.nrc_no}
            onChange={handleChange}
            placeholder="e.g. 110370001 (Exactly 9 digits)"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Phone Number *
          </label>
          <input
            type="text"
            name="phone_no"
            required
            value={formData.phone_no}
            onChange={handleChange}
            placeholder="e.g. 09-123456789"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Birth Date *
          </label>
          <input
            type="date"
            name="date_of_birth"
            required
            value={formData.date_of_birth}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
          Address Line 1 *
        </label>
        <input
          type="text"
          name="address_line1"
          required
          value={formData.address_line1}
          onChange={handleChange}
          placeholder="e.g. House No. 25, Pyay Road"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
          Address Line 2 (Optional)
        </label>
        <input
          type="text"
          name="address_line2"
          value={formData.address_line2}
          onChange={handleChange}
          placeholder="e.g. Apartment 4A, Kamayut Township"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button onClick={onCancel} variant="outline" type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Customer"}
        </Button>
      </div>
    </form>
  );
}

export default CustomerForm;
