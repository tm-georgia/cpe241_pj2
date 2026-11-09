import db from "../config/database.js";
const { query, getPool, memoryDb } = db;

// Helper to check if fallback mode or in-memory is active
const isInMemoryMode = async () => {
  const pool = await getPool();
  return !pool;
};

// Helper for dynamic in-memory sorting
const applySorting = (data, sortBy, sortOrder = "desc") => {
  if (!sortBy) return data;
  const multiplier = sortOrder.toLowerCase() === "asc" ? 1 : -1;

  return [...data].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    // Handle string capitalization or dates
    if (typeof valA === "string" && typeof valB === "string") {
      return valA.localeCompare(valB) * multiplier;
    }

    // Number conversion
    if (valA === undefined || valA === null) valA = 0;
    if (valB === undefined || valB === null) valB = 0;

    return (Number(valA) - Number(valB)) * multiplier;
  });
};

// Helper for dynamic in-memory pagination
const applyPagination = (data, page = 1, limit = 10) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  const totalRows = data.length;
  const totalPages = Math.ceil(totalRows / l);
  const startIndex = (p - 1) * l;
  const endIndex = startIndex + l;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      totalRows,
      totalPages,
      currentPage: p,
      limit: l
    }
  };
};

export const ReportService = {
  // Original stats dashboard endpoint to maintain compatibility
  async getGeneralStats() {
    try {
      const isMem = await isInMemoryMode();
      if (isMem) {
        return {
          totalCustomers: memoryDb.customer.length,
          totalAccounts: memoryDb.account.length,
          totalDeposits: memoryDb.account.reduce((sum, ac) => sum + Number(ac.current_balance || 0), 0),
          outstandingLoans: memoryDb.loan.reduce((sum, ln) => sum + Number(ln.outstanding_balance || 0), 0)
        };
      }

      const customerCountRes = await query("SELECT COUNT(*) FROM customer");
      const accountCountRes = await query("SELECT COUNT(*) FROM account");
      const totalBalanceRes = await query("SELECT SUM(current_balance) as sum FROM account");
      const totalLoansRes = await query("SELECT SUM(outstanding_balance) as sum FROM loan");

      return {
        totalCustomers: Number(customerCountRes.rows[0]?.count || 0),
        totalAccounts: Number(accountCountRes.rows[0]?.count || 0),
        totalDeposits: Number(totalBalanceRes.rows[0]?.sum || 0),
        outstandingLoans: Number(totalLoansRes.rows[0]?.sum || 0)
      };
    } catch {
      // Fallback
      return {
        totalCustomers: memoryDb.customer.length,
        totalAccounts: memoryDb.account.length,
        totalDeposits: memoryDb.account.reduce((sum, ac) => sum + Number(ac.current_balance || 0), 0),
        outstandingLoans: memoryDb.loan.reduce((sum, ln) => sum + Number(ln.outstanding_balance || 0), 0)
      };
    }
  },

  async getLoanPortfolioStats() {
    try {
      const isMem = await isInMemoryMode();
      if (isMem) {
        const types = memoryDb.loan_type;
        return types.map(lt => {
          const matchedLoans = memoryDb.loan.filter(l => l.loan_type_id === lt.id);
          return {
            type_name: lt.type_name,
            loan_count: matchedLoans.length,
            total_allocated: matchedLoans.reduce((s, l) => s + Number(l.loan_amount || 0), 0),
            total_outstanding: matchedLoans.reduce((s, l) => s + Number(l.outstanding_balance || 0), 0)
          };
        });
      }

      const res = await query(`
        SELECT lt.type_name, COUNT(l.id) as loan_count, SUM(l.loan_amount) as total_allocated, SUM(l.outstanding_balance) as total_outstanding
        FROM loan l
        JOIN loan_type lt ON l.loan_type_id = lt.id
        GROUP BY lt.type_name
      `);
      return res.rows;
    } catch {
      const types = memoryDb.loan_type;
      return types.map(lt => {
        const matchedLoans = memoryDb.loan.filter(l => l.loan_type_id === lt.id);
        return {
          type_name: lt.type_name,
          loan_count: matchedLoans.length,
          total_allocated: matchedLoans.reduce((s, l) => s + Number(l.loan_amount || 0), 0),
          total_outstanding: matchedLoans.reduce((s, l) => s + Number(l.outstanding_balance || 0), 0)
        };
      });
    }
  },

  async getRecentTransactionStats() {
    try {
      const isMem = await isInMemoryMode();
      if (isMem) {
        const types = memoryDb.transaction_type;
        return types.map(tt => {
          const matchedTx = memoryDb.transaction_table.filter(t => t.transaction_type_id === tt.id);
          return {
            type_name: tt.code,
            trans_count: matchedTx.length,
            total_volume: matchedTx.reduce((s, t) => s + Number(t.amount || 0), 0)
          };
        });
      }

      const res = await query(`
        SELECT tt.code as type_name, COUNT(t.id) as trans_count, SUM(t.amount) as total_volume
        FROM "transaction" t
        JOIN transaction_type tt ON t.transaction_type_id = tt.id
        GROUP BY tt.code
      `);
      return res.rows;
    } catch {
      const types = memoryDb.transaction_type;
      return types.map(tt => {
        const matchedTx = memoryDb.transaction_table.filter(t => t.transaction_type_id === tt.id);
        return {
          type_name: tt.code,
          trans_count: matchedTx.length,
          total_volume: matchedTx.reduce((s, t) => s + Number(t.amount || 0), 0)
        };
      });
    }
  },

  async getDashboardSummaryMetrics() {
    const isMem = await isInMemoryMode();
    
    let totalCustomers = 0;
    let totalAccounts = 0;
    let totalCurrentBalance = 0;
    let totalLoans = 0;
    let totalOutstandingBalance = 0;
    let totalServiceCharges = 0;
    let chartData = [];

    if (isMem) {
      totalCustomers = memoryDb.customer.length;
      totalAccounts = memoryDb.account.filter(a => a.status === "ACTIVE").length;
      totalCurrentBalance = memoryDb.account.filter(a => a.status === "ACTIVE").reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
      totalLoans = memoryDb.loan.filter(l => l.loan_status === "Active").length;
      totalOutstandingBalance = memoryDb.loan.filter(l => l.loan_status === "Active").reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);
      
      totalServiceCharges = memoryDb.account_charge.reduce((sum, ac) => {
        const ci = memoryDb.charge_item.find(item => item.id === ac.charge_id);
        return sum + (ci ? Number(ci.charge_amount || 0) : 0);
      }, 0);

      const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05"];
      chartData = months.map(m => {
        const accountsCount = memoryDb.account.filter(a => a.open_date.substring(0, 7) <= m).length;
        const loansCount = memoryDb.loan.filter(l => l.start_date.substring(0, 7) <= m).length;
        const totalBalance = memoryDb.account.filter(a => a.open_date.substring(0, 7) <= m).reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
        return {
          month: m,
          accountsCount,
          loansCount,
          totalBalance
        };
      });
    } else {
      try {
        const custRes = await query("SELECT COUNT(*) FROM customer");
        totalCustomers = Number(custRes.rows[0]?.count || 0);

        const actRes = await query("SELECT COUNT(*) FROM account WHERE status = 'ACTIVE'");
        totalAccounts = Number(actRes.rows[0]?.count || 0);

        const balRes = await query("SELECT SUM(current_balance) as sum FROM account WHERE status = 'ACTIVE'");
        totalCurrentBalance = Number(balRes.rows[0]?.sum || 0);

        const loanRes = await query("SELECT COUNT(*) FROM loan WHERE UPPER(loan_status) = 'ACTIVE'");
        totalLoans = Number(loanRes.rows[0]?.count || 0);

        const oustRes = await query("SELECT SUM(outstanding_balance) as sum FROM loan WHERE UPPER(loan_status) = 'ACTIVE'");
        totalOutstandingBalance = Number(oustRes.rows[0]?.sum || 0);

        const chargeRes = await query(`
          SELECT SUM(ci.charge_amount) as sum
          FROM account_charge ac
          JOIN charge_item ci ON ac.charge_id = ci.id
        `);
        totalServiceCharges = Number(chargeRes.rows[0]?.sum || 0);

        const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05"];

chartData = await Promise.all(months.map(async (m) => {
  const endOfMonth = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0)
    .toISOString()
    .split("T")[0];

  const actCountRes = await query("SELECT COUNT(*) FROM account WHERE open_date <= $1", [endOfMonth]);
  const lnCountRes = await query("SELECT COUNT(*) FROM loan WHERE start_date <= $1", [endOfMonth]);
  const totBalRes = await query("SELECT SUM(current_balance) as sum FROM account WHERE open_date <= $1", [endOfMonth]);

  return {
    month: m,
    accountsCount: Number(actCountRes.rows[0]?.count || 0),
    loansCount: Number(lnCountRes.rows[0]?.count || 0),
    totalBalance: Number(totBalRes.rows[0]?.sum || 0)
  };
}));
      } catch (err) {
        console.warn("SQL for summary failed, fallback to memory:", err.message);
        totalCustomers = memoryDb.customer.length;
        totalAccounts = memoryDb.account.filter(a => a.status === "ACTIVE").length;
        totalCurrentBalance = memoryDb.account.filter(a => a.status === "ACTIVE").reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
        totalLoans = memoryDb.loan.filter(l => l.loan_status === "Active").length;
        totalOutstandingBalance = memoryDb.loan.filter(l => l.loan_status === "Active").reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);
        
        totalServiceCharges = memoryDb.account_charge.reduce((sum, ac) => {
          const ci = memoryDb.charge_item.find(item => item.id === ac.charge_id);
          return sum + (ci ? Number(ci.charge_amount || 0) : 0);
        }, 0);

        const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05"];
        chartData = months.map(m => {
          const accountsCount = memoryDb.account.filter(a => a.open_date.substring(0, 7) <= m).length;
          const loansCount = memoryDb.loan.filter(l => l.start_date.substring(0, 7) <= m).length;
          const totalBalance = memoryDb.account.filter(a => a.open_date.substring(0, 7) <= m).reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
          return {
            month: m,
            accountsCount,
            loansCount,
            totalBalance
          };
        });
      }
    }

    return {
      totalCustomers,
      totalAccounts,
      totalCurrentBalance,
      totalLoans,
      totalOutstandingBalance,
      totalServiceCharges,
      chartData
    };
  },

  // 15 Reports Dispatch Engine
  async getReportData(reportId, filters = {}) {
    const isMem = await isInMemoryMode();
    let rows = [];

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const sortBy = filters.sortBy;
    const sortOrder = filters.sortOrder || "desc";

    // Dispatcher
    try {
      if (isMem) {
        rows = await this.resolveReportInMemory(reportId, filters);
      } else {
        rows = await this.resolveReportInSQL(reportId, filters);
      }
    } catch (err) {
      console.warn(`SQL query failed for report ${reportId}, fallback to in-memory:`, err.message);
      rows = await this.resolveReportInMemory(reportId, filters);
    }

    // Apply Sorting and Pagination uniformly
    const sorted = applySorting(rows, sortBy, sortOrder);
    return applyPagination(sorted, page, limit);
  },

  // Postgres SQL database implementation
  async resolveReportInSQL(reportId, f) {
    let sql = "";
    let params = [];

    switch (reportId) {
      case "report-1": // List account transactions within date range
        sql = `
          SELECT t.transaction_code, t.transaction_date, a.account_no, tt.code as transaction_type, t.amount, t.remark as description
          FROM transaction t
          JOIN transaction_type tt ON t.transaction_type_id = tt.id
          LEFT JOIN transfer_line_item li ON t.id = li.transaction_id
          LEFT JOIN account a ON li.account_id = a.id
          WHERE ($1::date IS NULL OR t.transaction_date >= $1)
            AND ($2::date IS NULL OR t.transaction_date <= $2)
          ORDER BY t.transaction_date DESC
        `;
        params = [f.fromDate || null, f.toDate || null];
        break;

      case "report-2": // Top N accounts by balance
        const n2 = Number(f.topN) || 10;
        sql = `
          SELECT a.account_no as account_code, c.name as customer_name, a.current_balance, a.status as account_status
          FROM account a
          JOIN customer c ON a.customer_id = c.id
          WHERE a.account_no <> '999999999' AND a.account_no <> '000000000'
          ORDER BY a.current_balance DESC
          LIMIT $1
        `;
        params = [n2];
        break;

      case "report-3": // Transaction volume by transaction type
        sql = `
          SELECT tt.code as transaction_type, COUNT(t.id) as total_transactions, SUM(t.amount) as total_amount
          FROM transaction t
          JOIN transaction_type tt ON t.transaction_type_id = tt.id
          WHERE ($1::date IS NULL OR t.transaction_date >= $1)
            AND ($2::date IS NULL OR t.transaction_date <= $2)
          GROUP BY tt.code
          ORDER BY total_transactions DESC
        `;
        params = [f.fromDate || null, f.toDate || null];
        break;

      case "report-4": // Loan payments within selected date range
        sql = `
          SELECT lp.code as payment_code, lp.payment_date, l.code as loan_code, lt.type_name as loan_type, lp.total_paid, lp.outstanding_balance, l.loan_status
          FROM loan_payment lp
          JOIN loan l ON lp.loan_id = l.id
          JOIN loan_type lt ON l.loan_type_id = lt.id
          WHERE ($1::date IS NULL OR lp.payment_date >= $1)
            AND ($2::date IS NULL OR lp.payment_date <= $2)
          ORDER BY lp.payment_date DESC
        `;
        params = [f.fromDate || null, f.toDate || null];
        break;

      case "report-5": // Outstanding loan balance by customer
        const n5 = Number(f.topN) || 5;
        sql = `
          SELECT c.code as customer_code, c.name as customer_name, a.account_no as account_number, l.code as loan_code,
                 l.loan_amount,
                 COALESCE(SUM(lp.total_paid), 0) as total_paid,
                 (l.loan_amount - COALESCE(SUM(lp.total_paid), 0)) as outstanding_balance
          FROM customer c
          JOIN loan l ON l.customer_id = c.id
          JOIN account a ON l.account_id = a.id
          LEFT JOIN loan_payment lp ON lp.loan_id = l.id
          GROUP BY c.code, c.name, a.account_no, l.code, l.loan_amount
          ORDER BY outstanding_balance DESC
          LIMIT $1
        `;
        params = [n5];
        break;

      case "report-6": // Loan type performance analysis
        const n6 = Number(f.topN) || 10;
        sql = `
          SELECT lt.code as loan_type_code, lt.type_name as loan_type_name,
                 COUNT(l.id) as total_loans,
                 COALESCE(AVG(l.interest_rate), 0) as average_interest_rate,
                 COALESCE(AVG(l.loan_term), 0) as average_loan_term
          FROM loan l
          JOIN loan_type lt ON l.loan_type_id = lt.id
          WHERE ($1::date IS NULL OR l.start_date >= $1)
            AND ($2::date IS NULL OR l.start_date <= $2)
          GROUP BY lt.code, lt.type_name
          ORDER BY total_loans DESC
          LIMIT $3
        `;
        params = [f.fromDate || null, f.toDate || null, n6];
        break;

      case "report-7": // Loan disbursements
        sql = `
          SELECT ld.code as disbursement_code, ld.disbursement_date, c.code as customer_code, c.name as customer_name, a.account_no as account_number, l.code as loan_code, ld.disbursement_amount
          FROM loan_disbursement_line_item ld
          JOIN loan l ON ld.loan_id = l.id
          JOIN account a ON l.account_id = a.id
          JOIN customer c ON l.customer_id = c.id
          WHERE ($1::date IS NULL OR ld.disbursement_date >= $1)
            AND ($2::date IS NULL OR ld.disbursement_date <= $2)
            AND ($3::text IS NULL OR $3 = '' OR c.name = $3)
          ORDER BY ld.disbursement_date DESC
        `;
        params = [f.fromDate || null, f.toDate || null, f.customerName || null];
        break;

      case "report-8": // Installment schedule by loan
        sql = `
          SELECT l.code as loan_code, ls.installment_no as installment_number, ls.due_date, ls.amount_due
          FROM loan_schedule ls
          JOIN loan l ON ls.loan_id = l.id
          WHERE ($1::text IS NULL OR $1 = '' OR l.code = $1)
          ORDER BY ls.installment_no ASC
        `;
        params = [f.loanCode || null];
        break;

      case "report-9": // Loan type distribution analysis
        const n9 = Number(f.topN) || 10;
        sql = `
          SELECT lt.type_name as loan_type,
                 COUNT(l.id) as number_of_loans,
                 SUM(l.loan_amount) as total_loan_amount,
                 COALESCE(AVG(l.interest_rate), 0) as average_interest_rate
          FROM loan l
          JOIN loan_type lt ON l.loan_type_id = lt.id
          WHERE ($1::date IS NULL OR l.start_date >= $1)
            AND ($2::date IS NULL OR l.start_date <= $2)
          GROUP BY lt.type_name
          ORDER BY total_loan_amount DESC
          LIMIT $3
        `;
        params = [f.fromDate || null, f.toDate || null, n9];
        break;

      case "report-10": // Overdue installments
        sql = `
          SELECT ls.id as loan_schedule_id, l.code as loan_code, c.code as customer_code, c.name as customer_name,
                 ls.due_date, ls.amount_due,
                 COALESCE(SUM(lpli.amount_paid), 0) as amount_paid,
                 (ls.amount_due - COALESCE(SUM(lpli.amount_paid), 0)) as outstanding_amount
          FROM loan_schedule ls
          JOIN loan l ON ls.loan_id = l.id
          JOIN customer c ON l.customer_id = c.id
          LEFT JOIN loan_payment_line_item lpli ON lpli.loan_schedule_id = ls.id
          GROUP BY ls.id, l.code, c.code, c.name, ls.due_date, ls.amount_due
          HAVING ls.due_date < $1
             AND (ls.amount_due - COALESCE(SUM(lpli.amount_paid), 0)) > 0
          ORDER BY ls.due_date ASC
        `;
        params = [f.asOfDate || new Date().toISOString().split("T")[0]];
        break;

      case "report-11": // List of Active Loans
        sql = `
          SELECT l.code as loan_code, c.code as customer_code, c.name as customer_name, lt.type_name as loan_type, l.loan_amount, l.outstanding_balance, l.loan_status
          FROM loan l
          JOIN customer c ON l.customer_id = c.id
          JOIN loan_type lt ON l.loan_type_id = lt.id
          WHERE UPPER(l.loan_status) = UPPER($1)
          ORDER BY l.code ASC
        `;
        params = [f.loanStatus || "Active"];
        break;

      case "report-12": // Total interest income from paid installments by customer
        const n12 = Number(f.topN) || 5;
        sql = `
          SELECT c.code as customer_code, c.name as customer_name,
                 SUM(lpli.interest_amount) as total_interest_income
          FROM customer c
          JOIN loan l ON l.customer_id = c.id
          JOIN loan_payment lp ON lp.loan_id = l.id
          JOIN loan_payment_line_item lpli ON lpli.loan_payment_id = lp.id
          WHERE ($1::date IS NULL OR lp.payment_date >= $1)
            AND ($2::date IS NULL OR lp.payment_date <= $2)
          GROUP BY c.id, c.code, c.name
          ORDER BY total_interest_income DESC
          LIMIT $3
        `;
        params = [f.fromDate || null, f.toDate || null, n12];
        break;

      case "report-13": // Account Status Report
        sql = `
          SELECT a.account_no as account_code, c.name as customer_name, c.nrc_no, c.phone_no as phone_number,
                 CONCAT(c.address_line1, ' ', c.address_line2) as address, a.current_balance, a.status as account_status
          FROM account a
          JOIN customer c ON a.customer_id = c.id
          WHERE ($1::text IS NULL OR $1 = '' OR a.status = $1)
            AND ($2::text IS NULL OR $2 = '' OR a.account_no LIKE $2)
            AND ($3::text IS NULL OR $3 = '' OR c.name ILIKE $3)
          ORDER BY a.account_no ASC
        `;
        params = [
          f.accountStatus || null,
          f.accountCode ? `%${f.accountCode}%` : null,
          f.customerName ? `%${f.customerName}%` : null
        ];
        break;

      case "report-14": // Transaction Type Report
        sql = `
          SELECT t.transaction_code, t.transaction_date, tt.code as transaction_type, t.amount, ts.code as status, t.remark as description
          FROM "transaction" t
          JOIN transaction_type tt ON t.transaction_type_id = tt.id
          JOIN transaction_status ts ON t.status_id = ts.id
          WHERE ($1::date IS NULL OR t.transaction_date >= $1)
            AND ($2::date IS NULL OR t.transaction_date <= $2)
            AND ($3::text IS NULL OR $3 = '' OR tt.code = $3)
          ORDER BY t.transaction_date DESC
        `;
        params = [f.fromDate || null, f.toDate || null, f.transactionType || null];
        break;

      case "report-15":
        sql = `
          SELECT
            CASE
              WHEN a.current_balance < 10000 THEN 'Below 10,000'
              WHEN a.current_balance >= 10000 AND a.current_balance < 50000 THEN '10,000 - 49,999'
              WHEN a.current_balance >= 50000 AND a.current_balance < 100000 THEN '50,000 - 99,999'
              ELSE '100,000 and above'
            END as balance_range,
            COUNT(a.id) as total_accounts,
            COALESCE(SUM(a.current_balance), 0) as total_balance,
            COALESCE(AVG(a.current_balance), 0) as average_balance
          FROM account a
          WHERE a.account_no <> '999999999'
            AND a.account_no <> '000000000'
            AND ($1::text IS NULL OR $1 = '' OR a.status = $1)
          GROUP BY balance_range
          ORDER BY total_accounts DESC
        `;
        params = [f.accountStatus || null];
        break;
    }

    const res = await query(sql, params);
    return res.rows;
  },

  // Perfect JavaScript/In-Memory database simulation for any offline test state
  async resolveReportInMemory(reportId, f) {
    const isWithinDateRange = (dateStr, from, to) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (from) {
        const fromD = new Date(from);
        if (d < fromD) return false;
      }
      if (to) {
        const toD = new Date(to);
        if (d > toD) return false;
      }
      return true;
    };

    switch (reportId) {
      case "report-1": {
        const matchedTxns = memoryDb.transaction_table.filter(t =>
          isWithinDateRange(t.transaction_date, f.fromDate, f.toDate)
        );

        let result = [];
        matchedTxns.forEach(t => {
          const tt = memoryDb.transaction_type.find(type => type.id === t.transaction_type_id) || { code: "Unknown" };
          const lines = memoryDb.transfer_line_item.filter(li => li.transaction_id === t.id);

          if (lines.length > 0) {
            lines.forEach(line => {
              const act = memoryDb.account.find(a => a.id === line.account_id);
              result.push({
                transaction_code: t.transaction_code,
                transaction_date: t.transaction_date,
                account_no: act ? act.account_no : "000000000",
                transaction_type: tt.code,
                amount: Number(t.amount || 0),
                description: t.remark || ""
              });
            });
          } else {
            result.push({
              transaction_code: t.transaction_code,
              transaction_date: t.transaction_date,
              account_no: "000000000",
              transaction_type: tt.code,
              amount: Number(t.amount || 0),
              description: t.remark || ""
            });
          }
        });
        return result;
      }

      case "report-2": {
        const n2 = Number(f.topN) || 10;
        const validAccounts = memoryDb.account.filter(a => a.account_no !== "999999999" && a.account_no !== "000000000");
        const results = validAccounts.map(a => {
          const cust = memoryDb.customer.find(c => c.id === a.customer_id) || { name: "Non-customer" };
          return {
            account_code: a.account_no,
            customer_name: cust.name,
            current_balance: Number(a.current_balance || 0),
            account_status: a.status
          };
        });
        // Sort descending and slice
        results.sort((a, b) => b.current_balance - a.current_balance);
        return results.slice(0, n2);
      }

      case "report-3": {
        const matchedTxns = memoryDb.transaction_table.filter(t =>
          isWithinDateRange(t.transaction_date, f.fromDate, f.toDate)
        );

        const summary = {};
        memoryDb.transaction_type.forEach(tt => {
          summary[tt.id] = { transaction_type: tt.code, total_transactions: 0, total_amount: 0 };
        });

        matchedTxns.forEach(t => {
          if (summary[t.transaction_type_id]) {
            summary[t.transaction_type_id].total_transactions += 1;
            summary[t.transaction_type_id].total_amount += Number(t.amount || 0);
          }
        });

        return Object.values(summary).sort((a, b) => b.total_transactions - a.total_transactions);
      }

      case "report-4": {
        const payments = memoryDb.loan_payment.filter(lp =>
          isWithinDateRange(lp.payment_date, f.fromDate, f.toDate)
        );

        return payments.map(lp => {
          const l = memoryDb.loan.find(loan => loan.id === lp.loan_id) || {};
          const lt = memoryDb.loan_type.find(t => t.id === l.loan_type_id) || {};
          return {
            payment_code: lp.code,
            payment_date: lp.payment_date,
            loan_code: l.code || "Unknown",
            loan_type: lt.type_name || "Unknown",
            total_paid: Number(lp.total_paid || 0),
            outstanding_balance: Number(lp.outstanding_balance || 0),
            loan_status: l.loan_status || "Active"
          };
        });
      }

      case "report-5": {
        const n5 = Number(f.topN) || 5;
        const results = memoryDb.loan.map(l => {
          const cust = memoryDb.customer.find(c => c.id === l.customer_id) || { name: "Unknown", code: "Unknown" };
          const act = memoryDb.account.find(a => a.id === l.account_id) || { account_no: "Unknown" };
          const payments = memoryDb.loan_payment.filter(lp => lp.loan_id === l.id);
          const total_paid = payments.reduce((sum, p) => sum + Number(p.total_paid || 0), 0);
          const outstanding_balance = Number(l.loan_amount || 0) - total_paid;

          return {
            customer_code: cust.code,
            customer_name: cust.name,
            account_number: act.account_no,
            loan_code: l.code,
            loan_amount: Number(l.loan_amount || 0),
            total_paid: total_paid,
            outstanding_balance: outstanding_balance
          };
        });

        results.sort((a, b) => b.outstanding_balance - a.outstanding_balance);
        return results.slice(0, n5);
      }

      case "report-6": {
        const n6 = Number(f.topN) || 10;
        const results = memoryDb.loan_type.map(lt => {
          const matchedLoans = memoryDb.loan.filter(l => l.loan_type_id === lt.id && isWithinDateRange(l.start_date, f.fromDate, f.toDate));
          const totalLoans = matchedLoans.length;
          const avgRate = totalLoans ? (matchedLoans.reduce((sum, l) => sum + Number(l.interest_rate || 0), 0) / totalLoans) : 0;
          const avgTerm = totalLoans ? (matchedLoans.reduce((sum, l) => sum + Number(l.loan_term || 0), 0) / totalLoans) : 0;

          return {
            loan_type_code: lt.code,
            loan_type_name: lt.type_name,
            total_loans: totalLoans,
            average_interest_rate: avgRate,
            average_loan_term: avgTerm
          };
        });

        results.sort((a, b) => b.total_loans - a.total_loans);
        return results.slice(0, n6);
      }

      case "report-7": {
        const lines = memoryDb.loan_disbursement_line_item.filter(ld =>
          isWithinDateRange(ld.disbursement_date, f.fromDate, f.toDate)
        );

        let results = lines.map(ld => {
          const l = memoryDb.loan.find(loan => loan.id === ld.loan_id) || {};
          const act = memoryDb.account.find(a => a.id === l.account_id) || {};
          const cust = memoryDb.customer.find(c => c.id === l.customer_id) || {};
          return {
            disbursement_code: ld.code,
            disbursement_date: ld.disbursement_date,
            customer_code: cust.code || "Unknown",
            customer_name: cust.name || "Unknown",
            account_number: act.account_no || "Unknown",
            loan_code: l.code || "Unknown",
            disbursement_amount: Number(ld.disbursement_amount || 0)
          };
        });

        if (f.customerName) {
          results = results.filter(r => r.customer_name === f.customerName);
        }

        return results;
      }

      case "report-8": {
        let schedules = memoryDb.loan_schedule;
        if (f.loanCode) {
          const l = memoryDb.loan.find(loan => loan.code.toUpperCase() === f.loanCode.toUpperCase());
          if (l) {
            schedules = schedules.filter(ls => ls.loan_id === l.id);
          } else {
            return []; // No loan found
          }
        }

        return schedules.map(ls => {
          const l = memoryDb.loan.find(loan => loan.id === ls.loan_id) || {};
          return {
            loan_code: l.code || "Unknown",
            installment_number: ls.installment_no,
            due_date: ls.due_date,
            amount_due: Number(ls.amount_due || 0)
          };
        });
      }

      case "report-9": {
        const n9 = Number(f.topN) || 10;
        const results = memoryDb.loan_type.map(lt => {
          const matchedLoans = memoryDb.loan.filter(l => l.loan_type_id === lt.id && isWithinDateRange(l.start_date, f.fromDate, f.toDate));
          const number_of_loans = matchedLoans.length;
          const total_amount = matchedLoans.reduce((sum, l) => sum + Number(l.loan_amount || 0), 0);
          const avgInterest = number_of_loans ? (matchedLoans.reduce((sum, l) => sum + Number(l.interest_rate || 0), 0) / number_of_loans) : 0;

          return {
            loan_type: lt.type_name,
            number_of_loans,
            total_loan_amount: total_amount,
            average_interest_rate: avgInterest
          };
        });

        results.sort((a, b) => b.total_loan_amount - a.total_loan_amount);
        return results.slice(0, n9);
      }

      case "report-10": {
        const asOf = f.asOfDate || "2026-06-01";
        const asOfD = new Date(asOf);

        const overdueSchedules = memoryDb.loan_schedule.filter(ls => {
          const dueD = new Date(ls.due_date);
          return dueD < asOfD;
        });

        const results = [];
        overdueSchedules.forEach(ls => {
          const payments = memoryDb.loan_payment_line_item.filter(lpli => lpli.loan_schedule_id === ls.id);
          const amount_paid = payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
          const outstanding_amount = Number(ls.amount_due || 0) - amount_paid;

          if (outstanding_amount > 0) {
            const l = memoryDb.loan.find(loan => loan.id === ls.loan_id) || {};
            const cust = memoryDb.customer.find(c => c.id === l.customer_id) || {};

            results.push({
              loan_schedule_id: ls.id,
              loan_code: l.code || "Unknown",
              customer_code: cust.code || "Unknown",
              customer_name: cust.name || "Unknown",
              due_date: ls.due_date,
              amount_due: Number(ls.amount_due || 0),
              amount_paid,
              outstanding_amount
            });
          }
        });

        return results;
      }

      case "report-11": {
        const targetStatus = (f.loanStatus || "Active").toUpperCase();
        const matchedLoans = memoryDb.loan.filter(l => l.loan_status.toUpperCase() === targetStatus);

        return matchedLoans.map(l => {
          const cust = memoryDb.customer.find(c => c.id === l.customer_id) || {};
          const lt = memoryDb.loan_type.find(type => type.id === l.loan_type_id) || {};
          return {
            loan_code: l.code,
            customer_code: cust.code || "Unknown",
            customer_name: cust.name || "Unknown",
            loan_type: lt.type_name || "Unknown",
            loan_amount: Number(l.loan_amount || 0),
            outstanding_balance: Number(l.outstanding_balance || 0),
            loan_status: l.loan_status
          };
        });
      }

      case "report-12": {
        const n12 = Number(f.topN) || 5;
        const results = memoryDb.customer.map(cust => {
          const loans = memoryDb.loan.filter(loan => loan.customer_id === cust.id);
          let totalInterest = 0;

          loans.forEach(loan => {
            const payments = memoryDb.loan_payment.filter(lp => lp.loan_id === loan.id && isWithinDateRange(lp.payment_date, f.fromDate, f.toDate));
            payments.forEach(payment => {
              const items = memoryDb.loan_payment_line_item.filter(li => li.loan_payment_id === payment.id);
              totalInterest += items.reduce((sum, item) => sum + Number(item.interest_amount || 0), 0);
            });
          });

          return {
            customer_code: cust.code,
            customer_name: cust.name,
            total_interest_income: totalInterest
          };
        });

        results.sort((a, b) => b.total_interest_income - a.total_interest_income);
        return results.slice(0, n12);
      }

      case "report-13": {
        let list = memoryDb.account;

        if (f.accountStatus) {
          list = list.filter(a => a.status.toUpperCase() === f.accountStatus.toUpperCase());
        }
        if (f.accountCode) {
          list = list.filter(a => a.account_no.includes(f.accountCode));
        }

        const results = list.map(a => {
          const cust = memoryDb.customer.find(c => c.id === a.customer_id) || {};
          return {
            account_code: a.account_no,
            customer_name: cust.name || "Unknown",
            nrc_no: cust.nrc_no || "",
            phone_number: cust.phone_no || "",
            address: `${cust.address_line1 || ""} ${cust.address_line2 || ""}`.trim(),
            current_balance: Number(a.current_balance || 0),
            account_status: a.status
          };
        });

        if (f.customerName) {
          const search = f.customerName.toLowerCase();
          return results.filter(row => row.customer_name.toLowerCase().includes(search));
        }

        return results;
      }

      case "report-14": {
        let matched = memoryDb.transaction_table;

        if (f.transactionType) {
          const tt = memoryDb.transaction_type.find(type => type.code.toUpperCase() === f.transactionType.toUpperCase());
          if (tt) {
            matched = matched.filter(t => t.transaction_type_id === tt.id);
          } else {
            return [];
          }
        }

        matched = matched.filter(t => isWithinDateRange(t.transaction_date, f.fromDate, f.toDate));

        return matched.map(t => {
          const tt = memoryDb.transaction_type.find(type => type.id === t.transaction_type_id) || { code: "Unknown" };
          const ts = memoryDb.transaction_status.find(status => status.id === t.status_id) || { code: "Unknown" };
          return {
            transaction_code: t.transaction_code,
            transaction_date: t.transaction_date,
            transaction_type: tt.code,
            amount: Number(t.amount || 0),
            status: ts.code,
            description: t.remark || ""
          };
        });
      }

      case "report-15": {
        const ranges = {
          "Below 10,000": [],
          "10,000 - 49,999": [],
          "50,000 - 99,999": [],
          "100,000 and above": []
        };

        memoryDb.account.forEach(a => {
          if (a.account_no === "999999999" || a.account_no === "000000000") return;
          if (f.accountStatus && a.status !== f.accountStatus) return;

          const balance = Number(a.current_balance || 0);

          if (balance < 10000) {
            ranges["Below 10,000"].push(balance);
          } else if (balance < 50000) {
            ranges["10,000 - 49,999"].push(balance);
          } else if (balance < 100000) {
            ranges["50,000 - 99,999"].push(balance);
          } else {
            ranges["100,000 and above"].push(balance);
          }
        });

        return Object.entries(ranges)
          .filter(([_, balances]) => balances.length > 0)
          .map(([balance_range, balances]) => {
            const total = balances.reduce((sum, value) => sum + value, 0);

            return {
              balance_range,
              total_accounts: balances.length,
              total_balance: total,
              average_balance: total / balances.length
            };
          });
      }

      default:
        return [];
    }
  }
};
