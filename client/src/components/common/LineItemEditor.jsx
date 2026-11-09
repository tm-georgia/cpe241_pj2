import React from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "./Button.jsx";

export function LineItemEditor({ 
  items = [], 
  onChange, 
  onAdd, 
  onRemove, 
  fields = [], // e.g. [ { key: 'desc', title: 'Description', type: 'text', placeholder: '...' } ]
  title = "Line Items"
}) {
  const handleFieldChange = (index, key, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4 border border-gray-100 rounded-xl p-5 bg-gray-50/30">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
        <Button 
          onClick={onAdd}
          variant="outline"
          icon={<Plus size={14} />}
          className="py-1 px-2.5 text-xs text-blue-600 hover:text-blue-700"
        >
          Add Line
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-xs">
          No line items added yet. Click "Add Line" to begin.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-end bg-white border border-gray-100 p-3.5 rounded-lg shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center shrink-0 mb-2">
                {index + 1}
              </div>

              {fields.map((f, fIndex) => (
                <div key={fIndex} className="flex-1 space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                    {f.title}
                  </label>
                  {f.type === "select" ? (
                    <select
                      value={item[f.key] || ""}
                      onChange={(e) => handleFieldChange(index, f.key, e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{f.placeholder || "Select"}</option>
                      {f.options.map((opt, oIndex) => (
                        <option key={oIndex} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type || "text"}
                      placeholder={f.placeholder || ""}
                      disabled={f.disabled}
                      value={item[f.key] === undefined ? "" : item[f.key]}
                      onChange={(e) => handleFieldChange(index, f.key, e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors mb-0.5 shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LineItemEditor;
// LineItemEditor end
