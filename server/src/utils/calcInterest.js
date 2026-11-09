/**
 * Banking Interest and Installment Schedule Calculations
 */

/**
 * Calculate dynamic equal installment parts
 * For a given loan amount, term in months, and annual interest rate
 * @returns {Array} List of installments with principal, interest, and total due
 */
export function calculatePaymentSchedule(loanAmount, interestRate, termMonths, startDateStr) {
  const result = [];
  const total_payback_amount = loanAmount + (loanAmount * interestRate / 100);
  const rounded_total_payback = Math.round(total_payback_amount * 100) / 100;

  let total_allocated = 0;
  let currentDate = new Date(startDateStr);

  for (let i = 1; i <= termMonths; i++) {
    // Months tick
    currentDate.setMonth(currentDate.getMonth() + 1);

    let amount_due;
    if (i === termMonths) {
      amount_due = Math.round((rounded_total_payback - total_allocated) * 100) / 100;
    } else {
      amount_due = Math.round((rounded_total_payback / termMonths) * 100) / 100;
    }
    total_allocated = Math.round((total_allocated + amount_due) * 100) / 100;

    // Prorate principal and interest parts proportionately for logging
    const ratio = rounded_total_payback > 0 ? (loanAmount / rounded_total_payback) : 1;
    let principalPart = Math.round((amount_due * ratio) * 100) / 100;
    let interestPart = Math.round((amount_due - principalPart) * 100) / 100;

    result.push({
      installment_no: i,
      due_date: currentDate.toISOString().split("T")[0],
      amount_due: amount_due,
      amount_to_be_paid_back: amount_due,
      principal_amount: principalPart,
      interest_amount: interestPart
    });
  }

  return result;
}
