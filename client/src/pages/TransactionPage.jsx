import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccount } from "../hooks/useAccount.js";
import DataTable from "../components/common/DataTable.jsx";
import Button from "../components/common/Button.jsx";
import LineItemEditor from "../components/common/LineItemEditor.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Modal from "../components/common/Modal.jsx";
import TransactionLineItemForm from "../components/forms/TransactionLineItemForm.jsx";
import transactionService from "../services/transactionService.js";
import { FileText, ArrowRightLeft, Users, Download, Upload, AlertCircle } from "lucide-react";
import { formatDate } from "../utils/date.js";

// Helper to resolve route flow
const getTransactionRouteDetails = (transactionType, lines, amount) => {
  let fromAccount = "N/A";
  let fromCustomer = "N/A";
  let toAccount = "N/A";
  let toCustomer = "N/A";

  const debitLines = lines.filter(l => l.entry_type_code === 'Debit');
  const creditLines = lines.filter(l => l.entry_type_code === 'Credit');

  const typeUpper = (transactionType || "").toUpperCase();

  if (typeUpper === "TRANSFER" || typeUpper === "SINGLE TRANSFER") {
    if (debitLines.length > 0) {
      fromAccount = debitLines[0].account_no;
      fromCustomer = debitLines[0].customer_name;
    }
    if (creditLines.length > 0) {
      toAccount = creditLines[0].account_no;
      toCustomer = creditLines[0].customer_name;
    }
  } else if (typeUpper === "PAYROLL" || typeUpper === "PAYROLL TRANSFER") {
    if (debitLines.length > 0) {
      fromAccount = debitLines[0].account_no;
      fromCustomer = debitLines[0].customer_name;
    }
    if (creditLines.length > 0) {
      toAccount = creditLines.map(l => l.account_no).join(", ");
      toCustomer = creditLines.map(l => l.customer_name).join(", ");
    }
  } else if (typeUpper === "DEPOSIT") {
    fromAccount = "Cash / Counter";
    fromCustomer = "External Depositor";
    if (creditLines.length > 0) {
      const custCredit = creditLines.find(l => l.account_no !== "000000000") || creditLines[0];
      if (custCredit) {
        toAccount = custCredit.account_no;
        toCustomer = custCredit.customer_name;
      }
    }
  } else if (typeUpper === "WITHDRAWAL") {
    if (debitLines.length > 0) {
      const custDebit = debitLines.find(l => l.account_no !== "000000000") || debitLines[0];
      if (custDebit) {
        fromAccount = custDebit.account_no;
        fromCustomer = custDebit.customer_name;
      }
    }
    toAccount = "Cash / Counter";
    toCustomer = "Account Holder";
  } else {
    if (debitLines.length > 0) {
      fromAccount = debitLines.map(l => l.account_no).join(", ");
      fromCustomer = debitLines.map(l => l.customer_name).join(", ");
    }
    if (creditLines.length > 0) {
      toAccount = creditLines.map(l => l.account_no).join(", ");
      toCustomer = creditLines.map(l => l.customer_name).join(", ");
    }
  }

  return { fromAccount, fromCustomer, toAccount, toCustomer };
};

export function TransactionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { accounts, refresh: refreshAccounts } = useAccount();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTx, setActiveTx] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "detail"
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form states
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Single Transfer state
  const [singleTx, setSingleTx] = useState({
    debit_account_no: "",
    credit_account_no: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0]
  });

  // 2. Payroll state
  const [payrollHeader, setPayrollHeader] = useState({
    debit_account_no: "",
    batch_date: new Date().toISOString().split("T")[0],
    description: "Corporate Monthly Payroll batch"
  });
  const [payrollLines, setPayrollLines] = useState([{ credit_account_no: "", amount: "", description: "Staff Payroll" }]);

  // 3. Deposit state
  const [depositTx, setDepositTx] = useState({
    account_no: "",
    amount: "",
    description: "Counter Cash Deposit desk entry",
    transaction_date: new Date().toISOString().split("T")[0]
  });

  // 4. Withdrawal state
  const [withdrawTx, setWithdrawTx] = useState({
    account_no: "",
    amount: "",
    description: "Account Holder cash withdrawal",
    transaction_date: new Date().toISOString().split("T")[0]
  });

  // Determine current active sub page based on browser path
  const currentPath = location.pathname;

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getTransactions();
      setTransactions(data || []);
    } catch (err) {
      console.error("Failed to load journal logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentPath === "/transactions") {
      loadTransactions();
    }
    // Reset forms feedback
    setError(null);
    setSuccess(false);
    setSaving(false);
  }, [currentPath]);

  // Handle single row clicks to drill down double entry details of transactional logs
  const handleRowClick = async (row) => {
    try {
      setLoading(true);
      const detail = await transactionService.getTransactionById(row.id);
      setActiveTx(detail);
      setViewMode("detail");
    } catch (err) {
      console.error("Failed to load nested ledger entries", err);
    } finally {
      setLoading(false);
    }
  };

  // Submit handlings
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!singleTx.debit_account_no || !singleTx.credit_account_no || !singleTx.amount) {
      setError("Please specify debit target, credit target, and amount.");
      return;
    }
    if (singleTx.debit_account_no === singleTx.credit_account_no) {
      setError("Source Debit account and recipient Credit account cannot be identical.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await transactionService.singleTransfer({
        fromAccountNo: singleTx.debit_account_no,
        toAccountNo: singleTx.credit_account_no,
        amount: Number(singleTx.amount),
        date: singleTx.transaction_date,
        remark: singleTx.description
      });
      setSuccess(true);
      setSingleTx({
        debit_account_no: "",
        credit_account_no: "",
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split("T")[0]
      });
      refreshAccounts();
      setTimeout(() => {
        navigate("/transactions");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Transfer declined by broker");
    } finally {
      setSaving(false);
    }
  };

  const handlePayrollSubmit = async (e) => {
    e.preventDefault();
    if (!payrollHeader.debit_account_no) {
      setError("Please select corporate funding Account No.");
      return;
    }
    if (payrollLines.length === 0 || payrollLines.some(pl => !pl.credit_account_no || !pl.amount)) {
      setError("Please verify all lines have specified credit-accounts and amounts.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        fromAccountNo: payrollHeader.debit_account_no,
        date: payrollHeader.batch_date,
        remark: payrollHeader.description,
        destinations: payrollLines.map(l => ({
          accountNo: l.credit_account_no,
          amount: Number(l.amount),
          remark: l.description
        }))
      };

      await transactionService.payrollTransfer(payload);
      setSuccess(true);
      setPayrollLines([{ credit_account_no: "", amount: "", description: "Staff Payroll" }]);
      setPayrollHeader({
        debit_account_no: "",
        batch_date: new Date().toISOString().split("T")[0],
        description: "Corporate Monthly Payroll batch"
      });
      refreshAccounts();
      setTimeout(() => {
        navigate("/transactions");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Payroll processing batch failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositTx.account_no || !depositTx.amount) {
      setError("Please specify account and cash amount.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await transactionService.deposit({
        accountNo: depositTx.account_no,
        amount: Number(depositTx.amount),
        date: depositTx.transaction_date,
        remark: depositTx.description
      });
      setSuccess(true);
      setDepositTx({
        account_no: "",
        amount: "",
        description: "Counter Cash Deposit desk entry",
        transaction_date: new Date().toISOString().split("T")[0]
      });
      refreshAccounts();
      setTimeout(() => {
        navigate("/transactions");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Deposit rejected");
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawTx.account_no || !withdrawTx.amount) {
      setError("Please specify account and cash amount.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await transactionService.withdrawal({
        accountNo: withdrawTx.account_no,
        amount: Number(withdrawTx.amount),
        date: withdrawTx.transaction_date,
        remark: withdrawTx.description
      });
      setSuccess(true);
      setWithdrawTx({
        account_no: "",
        amount: "",
        description: "Account Holder cash withdrawal",
        transaction_date: new Date().toISOString().split("T")[0]
      });
      refreshAccounts();
      setTimeout(() => {
        navigate("/transactions");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Balance validation or withdrawal failed");
    } finally {
      setSaving(false);
    }
  };

  // Convert accounts for options dropdown
  const accOptions = accounts.map(a => ({
    value: a.account_no,
    label: `${a.account_no} - ${a.customer_name} (฿${new Intl.NumberFormat().format(a.current_balance)} Baht)`
  }));

  const payrollFields = [
    { key: "credit_account_no", title: "Recipient Account No *", type: "select", options: accOptions, placeholder: "-- Choose Credit Target --" },
    { key: "amount", title: "Amount (Baht) *", type: "number", placeholder: "e.g. 350000" },
    { key: "description", title: "Narration Remark", type: "text" }
  ];

  const columns = [
    { title: "Ref Code", key: "transaction_code", sortable: true },
    { title: "Transaction Date", key: "transaction_date", render: (row) => formatDate(row.transaction_date) },
    { title: "Transaction Type", key: "transaction_type", render: (row) => <span className="bg-slate-50 border border-slate-100 text-slate-700 rounded-full font-bold px-2 py-0.5 uppercase tracking-wider text-[10px]">{row.transaction_type}</span> },
    { title: "Status", key: "status_code", render: (row) => <StatusBadge status={row.status_code} /> },
    { title: "Description", key: "description" }
  ];

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 text-green-700 text-xs font-semibold p-4 rounded-xl border border-green-100 max-w-3xl animate-fade-in flex items-center gap-2">
          Successfully processed and authorized! Account registers updated.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-xl border border-red-100 max-w-3xl flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO PATH */}

      {/* 1. SINGLE TRANSFER */}
      {currentPath === "/single-transfer" && (
        <form onSubmit={handleSingleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <ArrowRightLeft className="text-blue-600" size={20} />
            <h3 className="font-extrabold text-gray-900 text-base">Authorize Inter-account Transfer</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Source Account (Debit) *
              </label>
              <select
                value={singleTx.debit_account_no}
                onChange={(e) => setSingleTx({ ...singleTx, debit_account_no: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Select Source account --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.account_no}>
                    {a.account_no} - {a.customer_name} (฿{new Intl.NumberFormat().format(a.current_balance)} Baht)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Recipient Account (Credit) *
              </label>
              <select
                value={singleTx.credit_account_no}
                onChange={(e) => setSingleTx({ ...singleTx, credit_account_no: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Select Recipient account --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.account_no}>
                    {a.account_no} - {a.customer_name} (฿{new Intl.NumberFormat().format(a.current_balance)} Baht)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Funds Transfer value (Baht) *
              </label>
              <input
                type="number"
                placeholder="Amount e.g. 150000"
                required
                value={singleTx.amount}
                onChange={(e) => setSingleTx({ ...singleTx, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={singleTx.transaction_date}
                onChange={(e) => setSingleTx({ ...singleTx, transaction_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
              Description / Memo *
            </label>
            <input
              type="text"
              placeholder="Description e.g. Payment for suppliers invoices"
              required
              value={singleTx.description}
              onChange={(e) => setSingleTx({ ...singleTx, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Posting entries..." : "Authorize Fund Transfer"}
            </Button>
          </div>
        </form>
      )}

      {/* 2. PAYROLL batch TRANSFER */}
      {currentPath === "/payroll" && (
        <form onSubmit={handlePayrollSubmit} className="space-y-6 max-w-3xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Users className="text-blue-600" size={20} />
            <h3 className="font-extrabold text-gray-900 text-base">Corporate Payroll Batch Dispersal</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Funding Account (Debit) *
              </label>
              <select
                value={payrollHeader.debit_account_no}
                onChange={(e) => setPayrollHeader({ ...payrollHeader, debit_account_no: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Choose Corporate source account --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.account_no}>
                    {a.account_no} - {a.customer_name} (฿{new Intl.NumberFormat().format(a.current_balance)} Baht)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Execution Date *
              </label>
              <input
                type="date"
                required
                value={payrollHeader.batch_date}
                onChange={(e) => setPayrollHeader({ ...payrollHeader, batch_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
              General Batch Description *
            </label>
            <input
              type="text"
              required
              value={payrollHeader.description}
              onChange={(e) => setPayrollHeader({ ...payrollHeader, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <LineItemEditor 
            items={payrollLines}
            onChange={(lines) => setPayrollLines(lines)}
            onAdd={() => setPayrollLines([...payrollLines, { credit_account_no: "", amount: "", description: "Staff Payroll" }])}
            onRemove={(index) => setPayrollLines(payrollLines.filter((_, i) => i !== index))}
            fields={payrollFields}
            title="Payroll Employees line items"
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Posting disbursement..." : "Execute Payroll Transfer Batch"}
            </Button>
          </div>
        </form>
      )}

      {/* 3. CASH DEPOSIT DESK */}
      {currentPath === "/deposit" && (
        <form onSubmit={handleDepositSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Download className="text-green-600" size={20} />
            <h3 className="font-extrabold text-gray-900 text-base">Direct Cash Deposit Desk</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Target Bank Account No *
              </label>
              <select
                value={depositTx.account_no}
                onChange={(e) => setDepositTx({ ...depositTx, account_no: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Select Target --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.account_no}>
                    {a.account_no} - {a.customer_name} (฿{new Intl.NumberFormat().format(a.current_balance)} Baht)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Deposit Value (Baht) *
              </label>
              <input
                type="number"
                placeholder="Baht amount e.g. 500000"
                required
                value={depositTx.amount}
                onChange={(e) => setDepositTx({ ...depositTx, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Authorized Date *
              </label>
              <input
                type="date"
                required
                value={depositTx.transaction_date}
                onChange={(e) => setDepositTx({ ...depositTx, transaction_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
              Description / Remark *
            </label>
            <input
              type="text"
              required
              value={depositTx.description}
              onChange={(e) => setDepositTx({ ...depositTx, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Logging credit..." : "Authorize Cash Deposit"}
            </Button>
          </div>
        </form>
      )}

      {/* 4. CASH WITHDRAWAL DESK */}
      {currentPath === "/withdrawal" && (
        <form onSubmit={handleWithdrawSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Upload className="text-red-500" size={20} />
            <h3 className="font-extrabold text-gray-900 text-base">Direct Cash Withdrawal Desk</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Target Bank Account No *
              </label>
              <select
                value={withdrawTx.account_no}
                onChange={(e) => setWithdrawTx({ ...withdrawTx, account_no: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Select Target --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.account_no}>
                    {a.account_no} - {a.customer_name} (฿{new Intl.NumberFormat().format(a.current_balance)} Baht)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Withdrawal cash value (Baht) *
              </label>
              <input
                type="number"
                placeholder="Baht amount e.g. 100000"
                required
                value={withdrawTx.amount}
                onChange={(e) => setWithdrawTx({ ...withdrawTx, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Authorized Date *
              </label>
              <input
                type="date"
                required
                value={withdrawTx.transaction_date}
                onChange={(e) => setWithdrawTx({ ...withdrawTx, transaction_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
              Description / Remark *
            </label>
            <input
              type="text"
              required
              value={withdrawTx.description}
              onChange={(e) => setWithdrawTx({ ...withdrawTx, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Executing debit..." : "Authorize Cash Withdrawal"}
            </Button>
          </div>
        </form>
      )}

      {/* 5. TRANSACTION HISTORY TABLE */}
      {currentPath === "/transactions" && viewMode === "list" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Consolidated Ledger Book postings ({transactions.length} Journals)
          </p>

          <DataTable 
            columns={columns}
            data={transactions}
            onRowClick={handleRowClick}
            searchKey="transaction_code"
            searchPlaceholder="Search journal reference (e.g. TX-)..."
          />
        </div>
      )}

      {/* 6. TRANSACTION DETAIL VIEW */}
      {currentPath === "/transactions" && viewMode === "detail" && activeTx && (
        <div className="space-y-6 max-w-4xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in text-slate-800">
          {/* Back Button and Title */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Button onClick={() => setViewMode("list")} variant="secondary" className="px-3 py-1.5 text-xs">
                &larr; Back to List
              </Button>
              <h3 className="font-extrabold text-gray-900 text-base ml-2">
                Journal Entry Details: {activeTx.header?.transaction_code}
              </h3>
            </div>
            <StatusBadge status={activeTx.header?.status_code} />
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Ref Code</span>
                <span className="text-sm font-black text-slate-850 font-mono bg-blue-50/50 border border-blue-100 px-2 py-0.5 rounded text-blue-800">{activeTx.header?.transaction_code}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Transaction Date</span>
                <p className="text-sm font-bold text-slate-800 mt-1">{formatDate(activeTx.header?.transaction_date)}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Transaction Type</span>
                <span className="inline-block mt-1 bg-slate-200 border border-slate-300 text-slate-800 rounded-full font-bold px-2 py-0.5 uppercase tracking-wider text-[10px]">
                  {activeTx.header?.transaction_type}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Status</span>
                <p className="mt-1"><StatusBadge status={activeTx.header?.status_code} /></p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Description</span>
                <p className="text-sm font-medium text-slate-700 bg-white border border-slate-200 p-3 rounded-lg mt-1 shadow-sm leading-relaxed">
                  {activeTx.header?.description || "No narrative description provided"}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Total Amount</span>
                <p className="text-xl font-black text-blue-600 mt-1">
                  ฿ {new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(activeTx.header?.amount)} Baht
                </p>
              </div>

              {(() => {
                const { fromAccount, fromCustomer, toAccount, toCustomer } = getTransactionRouteDetails(
                  activeTx.header?.transaction_type,
                  activeTx.lines || [],
                  activeTx.header?.amount
                );
                return (
                  <div className="space-y-3 pt-3 border-t border-slate-150 mt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">From Account</span>
                        <p className="text-sm font-black text-slate-800 mt-1 font-mono">{fromAccount}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">From Customer</span>
                        <p className="text-sm font-bold text-slate-700 mt-1">{fromCustomer}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">To Account</span>
                        <p className="text-sm font-black text-slate-800 mt-1 font-mono">{toAccount}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">To Customer</span>
                        <p className="text-sm font-bold text-slate-700 mt-1">{toCustomer}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Ledger Journal Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-2">
              Ledger Postings Double-Entry Lines
            </h4>
            <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-sm">
              <TransactionLineItemForm lines={activeTx.lines || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionPage;
// TransactionPage end
