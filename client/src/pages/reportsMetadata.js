export const reportsMetadata = [
  // MEMBER 1 – TRANSACTIONS
  {
    id: "report-1",
    member: "Member 1",
    title: "Report 1 – Account Transactions",
    description: "List all account transactions within selected date range.",
    filters: [
      { type: "date", name: "fromDate", label: "From Date" },
      { type: "date", name: "toDate", label: "To Date" }
    ],
    columns: [
      { header: "Transaction Code", accessor: "transaction_code" },
      { header: "Transaction Date", accessor: "transaction_date", type: "date" },
      { header: "Account Number", accessor: "account_no" },
      { header: "Transaction Type", accessor: "transaction_type" },
      { header: "Amount", accessor: "amount", type: "currency" },
      { header: "Description", accessor: "description" }
    ],
    defaultSort: { sortBy: "transaction_date", sortOrder: "desc" }
  },
  {
    id: "report-2",
    member: "Member 1",
    title: "Report 2 – Top Account Balances",
    description: "Display top N accounts sorted by current statement balance.",
    filters: [
      { type: "number", name: "topN", label: "Top N Result Limit", defaultValue: 10 }
    ],
    columns: [
      { header: "Account Code", accessor: "account_code" },
      { header: "Customer Name", accessor: "customer_name" },
      { header: "Current Balance", accessor: "current_balance", type: "currency" },
      { header: "Account Status", accessor: "account_status", type: "status" }
    ],
    defaultSort: { sortBy: "current_balance", sortOrder: "desc" }
  },
  {
    id: "report-3",
    member: "Member 1",
    title: "Report 3 – Transaction Volume Analysis",
    description: "Aggregated volume totals analyzed across transaction types.",
    filters: [
      { type: "date", name: "fromDate", label: "From Date" },
      { type: "date", name: "toDate", label: "To Date" }
    ],
    columns: [
      { header: "Transaction Type", accessor: "transaction_type" },
      { header: "Total Transactions", accessor: "total_transactions", type: "number" },
      { header: "Total Amount", accessor: "total_amount", type: "currency" }
    ],
    defaultSort: { sortBy: "total_transactions", sortOrder: "desc" }
  },

  // MEMBER 2 – LOAN PAYMENTS
  {
    id: "report-4",
    member: "Member 2",
    title: "Report 4 – Loan Payments",
    description: "Show payments processed for credit accounts within selected dates.",
    filters: [
      { type: "date", name: "fromDate", label: "From Date" },
      { type: "date", name: "toDate", label: "To Date" }
    ],
    columns: [
      { header: "Payment Code", accessor: "payment_code" },
      { header: "Payment Date", accessor: "payment_date", type: "date" },
      { header: "Loan Code", accessor: "loan_code" },
      { header: "Loan Type", accessor: "loan_type" },
      { header: "Total Paid", accessor: "total_paid", type: "currency" },
      { header: "Outstanding Balance", accessor: "outstanding_balance", type: "currency" },
      { header: "Loan Status", accessor: "loan_status", type: "status" }
    ],
    defaultSort: { sortBy: "payment_date", sortOrder: "desc" }
  },
  {
    id: "report-5",
    member: "Member 2",
    title: "Report 5 – Outstanding Loan Balances",
    description: "Retrieve highest remaining customer loan accounts balance.",
    filters: [
      { type: "number", name: "topN", label: "Top N Result Limit", defaultValue: 5 }
    ],
    columns: [
      { header: "Customer Code", accessor: "customer_code" },
      { header: "Customer Name", accessor: "customer_name" },
      { header: "Account Number", accessor: "account_number" },
      { header: "Loan Code", accessor: "loan_code" },
      { header: "Loan Amount", accessor: "loan_amount", type: "currency" },
      { header: "Total Paid", accessor: "total_paid", type: "currency" },
      { header: "Outstanding Balance", accessor: "outstanding_balance", type: "currency" }
    ],
    defaultSort: { sortBy: "outstanding_balance", sortOrder: "desc" }
  },
  {
    id: "report-6",
    member: "Member 2",
    title: "Report 6 – Loan Type Performance",
    description: "Deep analytics tracking interest metrics and volumes by loan category.",
    filters: [
      { type: "date", name: "fromDate", label: "From Date" },
      { type: "date", name: "toDate", label: "To Date" },
      { type: "number", name: "topN", label: "Top Loan Type Limit", defaultValue: 10 }
    ],
    columns: [
      { header: "Loan Type Code", accessor: "loan_type_code" },
      { header: "Loan Type Name", accessor: "loan_type_name" },
      { header: "Total Loans", accessor: "total_loans", type: "number" },
      { header: "Average Interest Rate", accessor: "average_interest_rate", type: "percentage" },
      { header: "Average Loan Term", accessor: "average_loan_term", type: "months" }
    ],
    defaultSort: { sortBy: "total_loans", sortOrder: "desc" }
  },

  // MEMBER 3 – LOAN DISBURSEMENT & SCHEDULE
  {
    id: "report-7",
    member: "Member 3",
    title: "Report 7 – Loan Disbursements",
    description: "List successful disbursements mapped to borrowers names.",
    filters: [
      { type: "date", name: "fromDate", label: "From Date" },
      { type: "date", name: "toDate", label: "To Date" },
      { type: "select", name: "customerName", label: "Customer Name", dynamicOptions: "customers" }
    ],
    columns: [
      { header: "Disbursement Code", accessor: "disbursement_code" },
      { header: "Disbursement Date", accessor: "disbursement_date", type: "date" },
      { header: "Customer Code", accessor: "customer_code" },
      { header: "Customer Name", accessor: "customer_name" },
      { header: "Account Number", accessor: "account_number" },
      { header: "Loan Code", accessor: "loan_code" },
      { header: "Disbursement Amount", accessor: "disbursement_amount", type: "currency" }
    ],
    defaultSort: { sortBy: "disbursement_date", sortOrder: "desc" }
  },
  {
    id: "report-8",
    member: "Member 3",
    title: "Report 8 – Installment Schedule",
    description: "Enquire expected historical amortization schedule per credit facility.",
    filters: [
      { type: "text", name: "loanCode", label: "Loan Code (Required)", placeholder: "e.g. L001" }
    ],
    columns: [
      { header: "Loan Code", accessor: "loan_code" },
      { header: "Installment Number", accessor: "installment_number", type: "number" },
      { header: "Due Date", accessor: "due_date", type: "date" },
      { header: "Amount Due", accessor: "amount_due", type: "currency" }
    ],
    defaultSort: { sortBy: "installment_number", sortOrder: "asc" }
  },
  {
    id: "report-9",
    member: "Member 3",
    title: "Report 9 – Loan Distribution Analysis",
    description: "Cross portfolio profiling of averages and sizes by product offering.",
    filters: [
      { type: "date", name: "fromDate", label: "From Date" },
      { type: "date", name: "toDate", label: "To Date" },
      { type: "number", name: "topN", label: "Top N Limit", defaultValue: 10 }
    ],
    columns: [
      { header: "Loan Type", accessor: "loan_type" },
      { header: "Number Of Loans", accessor: "number_of_loans", type: "number" },
      { header: "Total Loan Amount", accessor: "total_loan_amount", type: "currency" },
      { header: "Average Interest Rate", accessor: "average_interest_rate", type: "percentage" }
    ],
    defaultSort: { sortBy: "total_loan_amount", sortOrder: "desc" }
  },

  // MEMBER 4 – LOAN MONITORING
  {
    id: "report-10",
    member: "Member 4",
    title: "Report 10 – Overdue Installments",
    description: "Urgent audit listing missed schedules, highlighting unpaid arrears.",
    filters: [
      { type: "date", name: "asOfDate", label: "As of Date", defaultValue: "2026-06-01" }
    ],
    columns: [
      { header: "Loan Schedule ID", accessor: "loan_schedule_id" },
      { header: "Loan Code", accessor: "loan_code" },
      { header: "Customer Code", accessor: "customer_code" },
      { header: "Customer Name", accessor: "customer_name" },
      { header: "Due Date", accessor: "due_date", type: "date" },
      { header: "Amount Due", accessor: "amount_due", type: "currency" },
      { header: "Amount Paid", accessor: "amount_paid", type: "currency" },
      { header: "Outstanding Amount", accessor: "outstanding_amount", type: "currency" }
    ],
    defaultSort: { sortBy: "due_date", sortOrder: "asc" }
  },
  {
    id: "report-11",
    member: "Member 4",
    title: "Report 11 – Active Loans",
    description: "List currently performing loans filtering by operational statues.",
    filters: [
      {
        type: "select",
        name: "loanStatus",
        label: "Loan Status",
        options: [
          { label: "Active Status", value: "Active" },
          { label: "Fully Paid Status", value: "Paid" }
        ],
        defaultValue: "Active"
      }
    ],
    columns: [
      { header: "Loan Code", accessor: "loan_code" },
      { header: "Customer Code", accessor: "customer_code" },
      { header: "Customer Name", accessor: "customer_name" },
      { header: "Loan Type", accessor: "loan_type" },
      { header: "Loan Amount", accessor: "loan_amount", type: "currency" },
      { header: "Outstanding Balance", accessor: "outstanding_balance", type: "currency" },
      { header: "Loan Status", accessor: "loan_status", type: "status" }
    ],
    defaultSort: { sortBy: "loan_code", sortOrder: "asc" }
  },
  {
    id: "report-12",
    member: "Member 4",
    title: "Report 12 – Interest Income Analysis",
    description: "Review net yield derived from calculated interest premiums per individual.",
    filters: [
      { type: "date", name: "fromDate", label: "From Date" },
      { type: "date", name: "toDate", label: "To Date" },
      { type: "number", name: "topN", label: "Top Customer Limit", defaultValue: 5 }
    ],
    columns: [
      { header: "Customer Code", accessor: "customer_code" },
      { header: "Customer Name", accessor: "customer_name" },
      { header: "Total Interest Income", accessor: "total_interest_income", type: "currency" }
    ],
    defaultSort: { sortBy: "total_interest_income", sortOrder: "desc" }
  },

  // MEMBER 5 – ACCOUNT & TRANSACTION ANALYSIS
  {
    id: "report-13",
    member: "Member 5",
    title: "Report 13 – Account Status",
    description: "Detailed parameters describing individual statements status.",
    filters: [
      {
        type: "select",
        name: "accountStatus",
        label: "Account Status",
        options: [
          { label: "ACTIVE", value: "ACTIVE" },
          { label: "CLOSED", value: "CLOSED" }
        ],
        defaultValue: "ACTIVE"
      },
      { type: "text", name: "accountCode", label: "Account No Match" },
      { type: "text", name: "customerName", label: "Customer Name Match" }
    ],
    columns: [
      { header: "Account Code", accessor: "account_code" },
      { header: "Customer Name", accessor: "customer_name" },
      { header: "NRC No.", accessor: "nrc_no" },
      { header: "Phone Number", accessor: "phone_number" },
      { header: "Address", accessor: "address" },
      { header: "Current Balance", accessor: "current_balance", type: "currency" },
      { header: "Account Status", accessor: "account_status", type: "status" }
    ],
    defaultSort: { sortBy: "account_code", sortOrder: "asc" }
  },
  {
    id: "report-14",
    member: "Member 5",
    title: "Report 14 – Transaction Type Report",
    description: "Listing statement operations filtered by explicit ledger category.",
    filters: [
      { type: "date", name: "fromDate", label: "From Date" },
      { type: "date", name: "toDate", label: "To Date" },
      {
        type: "select",
        name: "transactionType",
        label: "Transaction Type",
        options: [
          { label: "Cash Deposit", value: "DEPOSIT" },
          { label: "Cash Withdrawal", value: "WITHDRAWL" },
          { label: "Single Transfer", value: "TRANSFER" },
          { label: "Payroll Batch Transfer", value: "PAYROLL" },
          { label: "Applied Bank Charge", value: "ACCOUNT_CHARGE" },
          { label: "Applied Loan Repayment", value: "LOAN_PAYMENT" },
          { label: "Disbursed Credit", value: "LOAN_DISBURSEMENT" }
        ]
      }
    ],
    columns: [
      { header: "Transaction Code", accessor: "transaction_code" },
      { header: "Transaction Date", accessor: "transaction_date", type: "date" },
      { header: "Transaction Type", accessor: "transaction_type" },
      { header: "Amount", accessor: "amount", type: "currency" },
      { header: "Status", accessor: "status", type: "status" },
      { header: "Description", accessor: "description" }
    ],
    defaultSort: { sortBy: "transaction_date", sortOrder: "desc" }
  },
  {
    id: "report-15",
    member: "Member 5",
    title: "Report 15 – Account Balance Range Analysis",
    description: "Analyze how customer accounts are distributed across balance ranges.",
    filters: [
      {
        type: "select",
        name: "accountStatus",
        label: "Account Status",
        options: [
          { label: "All Status", value: "" },
          { label: "ACTIVE", value: "ACTIVE" },
          { label: "CLOSED", value: "CLOSED" }
        ],
        defaultValue: ""
      }
    ],
    columns: [
      { header: "Balance Range", accessor: "balance_range" },
      { header: "Total Accounts", accessor: "total_accounts", type: "number" },
      { header: "Total Balance", accessor: "total_balance", type: "currency" },
      { header: "Average Balance", accessor: "average_balance", type: "currency" }
    ],
    defaultSort: { sortBy: "total_accounts", sortOrder: "desc" }
  }
];
