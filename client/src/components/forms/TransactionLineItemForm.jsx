import React from "react";

export function TransactionLineItemForm({ lines = [] }) {
  return (
    <div className="space-y-3 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <h4 className="font-bold text-gray-900 text-xs uppercase tracking-widest pb-2 border-b border-gray-100">
        Posting Log details (Double-entry Ledger)
      </h4>
      <div className="divide-y divide-gray-100 text-xs">
        {lines.length === 0 ? (
          <p className="text-gray-400 py-3 text-center">No posting line items linked to this posting.</p>
        ) : (
          lines.map((li, index) => (
            <div key={index} className="flex justify-between items-center py-2.5">
              <div className="space-y-0.5">
                <p className="font-bold text-gray-800">
                  {li.account_no} {li.customer_name ? `(${li.customer_name})` : ""}
                </p>
                <p className="text-gray-400 font-medium text-[11px]">{li.description || "Transferred"}</p>
              </div>
              <div className="text-right">
                <p className={`font-extrabold ${li.entry_type_code === "Debit" ? "text-red-650 text-red-600" : "text-green-600"}`}>
                  {li.entry_type_code === "Debit" ? "-" : "+"} ฿{new Intl.NumberFormat().format(li.amount)} Baht
                </p>
                <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${li.entry_type_code === "Debit" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {li.entry_type_code}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TransactionLineItemForm;
