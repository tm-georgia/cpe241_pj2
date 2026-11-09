import React from "react";

export function StatusBadge({ status }) {
  if (!status) return null;

  // Extract string representation safely
  let statusStr = "";
  if (typeof status === "string") {
    statusStr = status;
  } else if (typeof status === "object" && status !== null) {
    statusStr = status.code || status.name || status.status_code || status.text || JSON.stringify(status);
  } else {
    statusStr = String(status);
  }

  const val = statusStr.toLowerCase();
  
  let styles = "bg-slate-100 text-slate-850 border border-slate-200/60"; // default

  if (val === "active" || val === "completed" || val === "paid" || val === "success") {
    styles = "bg-emerald-100 text-emerald-800 border border-emerald-250/20";
  } else if (val === "pending" || val === "partially paid" || val === "partial") {
    styles = "bg-amber-100 text-amber-800 border border-amber-250/20";
  } else if (val === "failed" || val === "dormant" || val === "inactive" || val === "overdue") {
    styles = "bg-rose-100 text-rose-800 border border-rose-250/20";
  } else if (val === "closed") {
    styles = "bg-slate-100 text-slate-600 border border-slate-200/50";
  } else if (val === "unpaid") {
    styles = "bg-blue-100 text-blue-800 border border-blue-200";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles}`}>
      {statusStr}
    </span>
  );
}

export default StatusBadge;
