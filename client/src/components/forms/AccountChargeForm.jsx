import React, { useState, useEffect } from "react";
import Button from "../common/Button.jsx";
import LineItemEditor from "../common/LineItemEditor.jsx";
import { accountService } from "../../services/accountService.js";

export function AccountChargeForm({ accounts = [], onSubmit, onCancel }) {
  const [chargeTypes, setChargeTypes] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [accountDetails, setAccountDetails] = useState(null);
  const [lines, setLines] = useState([{ charge_type: "", charge_amount: "", description: "" }]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load charge items types list on render
    const loadTypes = async () => {
      try {
        const types = await accountService.getChargeItems();
        setChargeTypes(types || []);
      } catch (err) {
        console.error("Failed to load fee formats", err);
      }
    };
    loadTypes();
  }, []);

  const handleAccountChange = (e) => {
    const accNo = e.target.value;
    setSelectedAccount(accNo);
    const detail = accounts.find(a => a.account_no === accNo);
    setAccountDetails(detail || null);
  };

  const handleLinesChange = (updatedLines) => {
    // Audit if a charge_type changed to auto populate the charge_amount
    const processes = updatedLines.map(line => {
      if (line.charge_type) {
        const typeObj = chargeTypes.find(ct => ct.charge_type === line.charge_type);
        if (typeObj && (!line.charge_amount || line.charge_amount !== typeObj.charge_amount)) {
          return {
            ...line,
            charge_amount: typeObj.charge_amount,
            description: typeObj.description || `Applied fee for ${typeObj.charge_type}`
          };
        }
      }
      return line;
    });
    setLines(processes);
  };

  const handleAddLine = () => {
    setLines(prev => [...prev, { charge_type: "", charge_amount: "", description: "" }]);
  };

  const handleRemoveLine = (index) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return lines.reduce((sum, item) => sum + Number(item.charge_amount || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      setError("Please select a target Account");
      return;
    }
    if (lines.length === 0 || lines.some(l => !l.charge_type)) {
      setError("Please verify all lines are filled and a type is chosen");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Find the chargeId if matching first option (for audit header records)
      const firstType = chargeTypes.find(ct => ct.charge_type === lines[0].charge_type);
      
      const payload = {
        accountNo: selectedAccount,
        chargeId: firstType ? firstType.id : null,
        date: new Date().toISOString().split("T")[0],
        lines
      };

      await onSubmit(payload);
      setSuccess(true);
      setLines([{ charge_type: "", charge_amount: "", description: "" }]);
      setSelectedAccount("");
      setAccountDetails(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to post charges log");
    } finally {
      setSaving(false);
    }
  };

  // Convert charge types list to LineItem options
  const typeOptions = chargeTypes.map(ct => ({
    value: ct.charge_type,
    label: `${ct.charge_type} (฿${new Intl.NumberFormat().format(ct.charge_amount)})`
  }));

  const fieldsConfig = [
    { key: "charge_type", title: "Charge Type *", type: "select", options: typeOptions, placeholder: "-- Choose Type --" },
    { key: "charge_amount", title: "Cost (Baht)", type: "number", disabled: true },
    { key: "description", title: "Remark / Description", type: "text" }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-950 text-base">Authorize Account Service Charges</h3>
        <span className="text-xs font-bold text-gray-400 uppercase bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
          CHG-REC-{Date.now().toString().slice(-4)}
        </span>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 text-xs font-semibold p-4 rounded-lg border border-green-100">
          Service charges debited successfully and client notified.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-3.5 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Account Select and Auto-Fill */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Select Account No *
          </label>
          <select
            value={selectedAccount}
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
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
            Associated Client Name
          </label>
          <input
            type="text"
            readOnly
            value={accountDetails ? accountDetails.customer_name : ""}
            placeholder="Auto-filled client"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 font-bold"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
            Available Ledger Balance (Baht)
          </label>
          <input
            type="text"
            readOnly
            value={accountDetails ? new Intl.NumberFormat().format(accountDetails.current_balance) : ""}
            placeholder="Auto-filled current balance"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 font-extrabold"
          />
        </div>
      </div>

      {/* Lines editor */}
      <LineItemEditor
        items={lines}
        onChange={handleLinesChange}
        onAdd={handleAddLine}
        onRemove={handleRemoveLine}
        fields={fieldsConfig}
        title="Charge Items"
      />

      {/* Charge summarizes */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center text-sm">
        <div>
          <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Total Lines: </span>
          <span className="font-extrabold text-gray-700">{lines.length}</span>
        </div>
        <div>
          <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Total Debit Amount: </span>
          <span className="font-black text-blue-700 text-lg">
            ฿{new Intl.NumberFormat().format(calculateTotal())}
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button onClick={onCancel} variant="outline" type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !selectedAccount}>
          {saving ? "Processing..." : "Debit Service Fee"}
        </Button>
      </div>
    </form>
  );
}

export default AccountChargeForm;
