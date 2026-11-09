import { getTransaction, query } from "../config/database.js";
import { TransactionModel } from "../models/transaction.model.js";

export const TransactionService = {
  async listTransactions() {
    return await TransactionModel.getAll();
  },

  async getTransactionDetail(id) {
    const header = await TransactionModel.getById(id);
    if (!header) return null;
    const lines = await TransactionModel.getLineItemsByTransactionId(id);
    return {
      header,
      lines
    };
  },

  // 1. Process Single Transfer
  async processSingleTransfer({ fromAccountNo, toAccountNo, amount, date, remark }) {
    const tx = await getTransaction();
    try {
      const amt = Number(amount);
      if (amt <= 0) throw new Error("Amount must be positive");

      // Verify accounts
      const fromRes = await tx.query("SELECT * FROM account WHERE account_no = $1 FOR UPDATE", [fromAccountNo]);
      const fromAcc = fromRes.rows[0];
      if (!fromAcc) throw new Error("Source account not found");
      if (Number(fromAcc.current_balance) < amt) throw new Error("Insufficient balance in source account");

      const toRes = await tx.query("SELECT * FROM account WHERE account_no = $1 FOR UPDATE", [toAccountNo]);
      const toAcc = toRes.rows[0];
      if (!toAcc) throw new Error("Destination account not found");

      // 1. Save Transfer Batch
      const batchRes = await tx.query(
        `INSERT INTO transfer_batch (batch_type, batch_date, description, status)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        ["Single", date || new Date().toISOString().split("T")[0], remark || "Single Transfer", "Completed"]
      );
      const batch = batchRes.rows[0];

      // 2. Lookup transaction and entry IDs
      const typeRes = await tx.query("SELECT id FROM transaction_type WHERE code = $1 OR code = $2", ["Single Transfer", "TRANSFER"]);
      const typeId = typeRes.rows[0]?.id || 4;

      const statusRes = await tx.query("SELECT id FROM transaction_status WHERE code = $1 OR code = $2", ["Completed", "COMPLETED"]);
      const statusId = statusRes.rows[0]?.id || 2;

      const debitTypeRes = await tx.query("SELECT id FROM entry_type WHERE code = $1", ["Debit"]);
      const debitId = debitTypeRes.rows[0]?.id || 1;

      const creditTypeRes = await tx.query("SELECT id FROM entry_type WHERE code = $1", ["Credit"]);
      const creditId = creditTypeRes.rows[0]?.id || 2;

      // 3. Save Transaction
      const countRes = await tx.query("SELECT id FROM transaction");
      const maxId = countRes.rows.reduce((max, r) => Math.max(max, Number(r.id || 0)), 0);
      const nextTxId = maxId + 1;
      const txCode = `TXN${String(nextTxId).padStart(4, "0")}`;

      const txnRes = await tx.query(
        `INSERT INTO transaction (transaction_code, amount, transaction_date, remark, transaction_type_id, batch_id, status_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [txCode, amt, date || new Date().toISOString().split("T")[0], remark, typeId, batch.id, statusId]
      );
      const transaction = txnRes.rows[0];

      // 4. Save Transfer Line Items
      // Debit from account
      await tx.query(
        `INSERT INTO transfer_line_item (transaction_id, account_id, entry_type_id, amount, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [transaction.id, fromAcc.id, debitId, amt, `Deducted for transfer to ${toAcc.account_no}`]
      );
      // Credit to account
      await tx.query(
        `INSERT INTO transfer_line_item (transaction_id, account_id, entry_type_id, amount, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [transaction.id, toAcc.id, creditId, amt, `Received transfer from ${fromAcc.account_no}`]
      );

      // 5. Update actual balances
      await tx.query("UPDATE account SET current_balance = current_balance - $1 WHERE id = $2", [amt, fromAcc.id]);
      await tx.query("UPDATE account SET current_balance = current_balance + $1 WHERE id = $2", [amt, toAcc.id]);

      await tx.commit();
      return transaction;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // 2. Process Payroll / Batch Transfer
  async processPayrollTransfer({ fromAccountNo, date, remark, destinations }) {
    const tx = await getTransaction();
    try {
      // destinations = [ { accountNo, amount, remark }, ... ]
      let totalAmt = 0;
      for (const dest of destinations) {
        totalAmt += Number(dest.amount || 0);
      }

      if (totalAmt <= 0) throw new Error("Total transfer amount must be positive");

      // Verify source account balance
      const fromRes = await tx.query("SELECT * FROM account WHERE account_no = $1 FOR UPDATE", [fromAccountNo]);
      const fromAcc = fromRes.rows[0];
      if (!fromAcc) throw new Error("Source account not found");
      if (Number(fromAcc.current_balance) < totalAmt) throw new Error("Insufficient balance in source account for total payroll");

      // Create Payroll Batch
      const batchRes = await tx.query(
        `INSERT INTO transfer_batch (batch_type, batch_date, description, status)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        ["Payroll", date || new Date().toISOString().split("T")[0], remark || "Payroll Distribution", "Completed"]
      );
      const batch = batchRes.rows[0];

      // Lookup IDs
      const typeRes = await tx.query("SELECT id FROM transaction_type WHERE code = $1 OR code = $2", ["Payroll Transfer", "Payroll"]);
      const typeId = typeRes.rows[0]?.id || 7;

      const statusRes = await tx.query("SELECT id FROM transaction_status WHERE code = $1 OR code = $2", ["Completed", "COMPLETED"]);
      const statusId = statusRes.rows[0]?.id || 2;

      const debitTypeRes = await tx.query("SELECT id FROM entry_type WHERE code = $1", ["Debit"]);
      const debitId = debitTypeRes.rows[0]?.id || 1;

      const creditTypeRes = await tx.query("SELECT id FROM entry_type WHERE code = $1", ["Credit"]);
      const creditId = creditTypeRes.rows[0]?.id || 2;

      // Create main Transaction
      const countRes = await tx.query("SELECT id FROM transaction");
      const maxId = countRes.rows.reduce((max, r) => Math.max(max, Number(r.id || 0)), 0);
      const nextTxId = maxId + 1;
      const txCode = `TXN${String(nextTxId).padStart(4, "0")}`;

      const txnRes = await tx.query(
        `INSERT INTO transaction (transaction_code, amount, transaction_date, remark, transaction_type_id, batch_id, status_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [txCode, totalAmt, date || new Date().toISOString().split("T")[0], remark, typeId, batch.id, statusId]
      );
      const transaction = txnRes.rows[0];

      // Add Debit line item for source account
      await tx.query(
        `INSERT INTO transfer_line_item (transaction_id, account_id, entry_type_id, amount, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [transaction.id, fromAcc.id, debitId, totalAmt, "Debit for payroll distribution"]
      );

      // Debit source account balance
      await tx.query("UPDATE account SET current_balance = current_balance - $1 WHERE id = $2", [totalAmt, fromAcc.id]);

      // Process crediting destinations
      for (const dest of destinations) {
        const destAmt = Number(dest.amount);
        const toRes = await tx.query("SELECT * FROM account WHERE account_no = $1", [dest.accountNo]);
        const toAcc = toRes.rows[0];
        if (!toAcc) throw new Error(`Destination account ${dest.accountNo} not found`);

        // Insert Credit Line Item
        await tx.query(
          `INSERT INTO transfer_line_item (transaction_id, account_id, entry_type_id, amount, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [transaction.id, toAcc.id, creditId, destAmt, dest.remark || "Salary Credit"]
        );

        // Credit destination account balance
        await tx.query("UPDATE account SET current_balance = current_balance + $1 WHERE id = $2", [destAmt, toAcc.id]);
      }

      await tx.commit();
      return transaction;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // 3. Deposit to account
  async processDeposit({ accountNo, amount, date, remark }) {
    const tx = await getTransaction();
    try {
      const amt = Number(amount);
      if (amt <= 0) throw new Error("Amount must be positive");

      // Verify account
      const accRes = await tx.query("SELECT * FROM account WHERE account_no = $1 FOR UPDATE", [accountNo]);
      const account = accRes.rows[0];
      if (!account) throw new Error("Account not found");

      // Lookup IDs
      const typeRes = await tx.query("SELECT id FROM transaction_type WHERE code = $1 OR code = $2", ["Deposit", "DEPOSIT"]);
      const typeId = typeRes.rows[0]?.id || 5;

      const statusRes = await tx.query("SELECT id FROM transaction_status WHERE code = $1 OR code = $2", ["Completed", "COMPLETED"]);
      const statusId = statusRes.rows[0]?.id || 2;

      const creditTypeRes = await tx.query("SELECT id FROM entry_type WHERE code = $1", ["Credit"]);
      const creditId = creditTypeRes.rows[0]?.id || 2;

      // Create transaction
      const countRes = await tx.query("SELECT id FROM transaction");
      const maxId = countRes.rows.reduce((max, r) => Math.max(max, Number(r.id || 0)), 0);
      const nextTxId = maxId + 1;
      const txCode = `TXN${String(nextTxId).padStart(4, "0")}`;

      const txnRes = await tx.query(
        `INSERT INTO transaction (transaction_code, amount, transaction_date, remark, transaction_type_id, batch_id, status_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [txCode, amt, date || new Date().toISOString().split("T")[0], remark || "Cash Deposit", typeId, null, statusId]
      );
      const transaction = txnRes.rows[0];

      // Add Credit line item
      await tx.query(
        `INSERT INTO transfer_line_item (transaction_id, account_id, entry_type_id, amount, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [transaction.id, account.id, creditId, amt, remark || "Cash Deposit"]
      );

      // Increase account balance
      await tx.query("UPDATE account SET current_balance = current_balance + $1 WHERE id = $2", [amt, account.id]);

      await tx.commit();
      return transaction;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // 4. Withdrawal from account
  async processWithdrawal({ accountNo, amount, date, remark }) {
    const tx = await getTransaction();
    try {
      const amt = Number(amount);
      if (amt <= 0) throw new Error("Amount must be positive");

      // Verify account
      const accRes = await tx.query("SELECT * FROM account WHERE account_no = $1 FOR UPDATE", [accountNo]);
      const account = accRes.rows[0];
      if (!account) throw new Error("Account not found");

      if (Number(account.current_balance) < amt) {
        throw new Error(`Insufficient funds: account balance is ${account.current_balance} Baht`);
      }

      // Lookup IDs
      const typeRes = await tx.query("SELECT id FROM transaction_type WHERE code = $1 OR code = $2", ["Withdrawal", "WITHDRAWAL"]);
      const typeId = typeRes.rows[0]?.id || 6;

      const statusRes = await tx.query("SELECT id FROM transaction_status WHERE code = $1 OR code = $2", ["Completed", "COMPLETED"]);
      const statusId = statusRes.rows[0]?.id || 2;

      const debitTypeRes = await tx.query("SELECT id FROM entry_type WHERE code = $1", ["Debit"]);
      const debitId = debitTypeRes.rows[0]?.id || 1;

      // Create transaction
      const countRes = await tx.query("SELECT id FROM transaction");
      const maxId = countRes.rows.reduce((max, r) => Math.max(max, Number(r.id || 0)), 0);
      const nextTxId = maxId + 1;
      const txCode = `TXN${String(nextTxId).padStart(4, "0")}`;

      const txnRes = await tx.query(
        `INSERT INTO transaction (transaction_code, amount, transaction_date, remark, transaction_type_id, batch_id, status_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [txCode, amt, date || new Date().toISOString().split("T")[0], remark || "Cash Withdrawal", typeId, null, statusId]
      );
      const transaction = txnRes.rows[0];

      // Add Debit line item
      await tx.query(
        `INSERT INTO transfer_line_item (transaction_id, account_id, entry_type_id, amount, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [transaction.id, account.id, debitId, amt, remark || "Cash Withdrawal"]
      );

      // Decrease account balance
      await tx.query("UPDATE account SET current_balance = current_balance - $1 WHERE id = $2", [amt, account.id]);

      await tx.commit();
      return transaction;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
};
