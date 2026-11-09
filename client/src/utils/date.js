/**
 * Safely formats any date-like value (String, Date, Timestamp, etc.) to YYYY-MM-DD.
 * Handles cases where database drivers (like pg) parse date structures into actual
 * JavaScript Date Objects, preventing "substring is not a function" errors.
 */
export function formatDate(val) {
  if (!val) return "-";
  
  // If it's already a string, slice it to 10 chars
  if (typeof val === "string") {
    return val.substring(0, 10);
  }
  
  // If it is a Date instance
  if (val instanceof Date) {
    try {
      // Use getFullYear/getMonth/getDate to preserve the exact calendar date
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const d = String(val.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    } catch {
      return "-";
    }
  }

  // Any other date-like object or numeric timestamp
  try {
    const dObj = new Date(val);
    if (!isNaN(dObj.getTime())) {
      const y = dObj.getFullYear();
      const m = String(dObj.getMonth() + 1).padStart(2, "0");
      const d = String(dObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  } catch {
    // silent return
  }

  return "-";
}

/**
 * Same as formatDate, but returns empty string instead of "-"
 */
export function formatDateOrEmpty(val) {
  const result = formatDate(val);
  return result === "-" ? "" : result;
}
