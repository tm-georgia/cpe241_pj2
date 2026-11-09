export const formatDate = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  return d.toISOString().split("T")[0];
};

export const addMonths = (dateStr, months) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
};
