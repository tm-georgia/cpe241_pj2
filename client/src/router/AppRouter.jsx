import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";
import CustomerPage from "../pages/CustomerPage.jsx";
import AccountPage from "../pages/AccountPage.jsx";
import AccountChargePage from "../pages/AccountChargePage.jsx";
import LoanPage from "../pages/LoanPage.jsx";
import LoanDisbursementPage from "../pages/LoanDisbursementPage.jsx";
import LoanSchedulePage from "../pages/LoanSchedulePage.jsx";
import LoanPaymentPage from "../pages/LoanPaymentPage.jsx";
import TransactionPage from "../pages/TransactionPage.jsx";
import ReportsPage from "../pages/ReportsPage.jsx";
import ReportDetailPage from "../pages/ReportDetailPage.jsx";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Default Route redirection to /customers */}
          <Route index element={<Navigate to="/customers" replace />} />
          
          {/* Core Modules routes */}
          <Route path="customers" element={<CustomerPage />} />
          <Route path="accounts" element={<AccountPage />} />
          <Route path="charges" element={<AccountChargePage />} />

          {/* Loan Management sub pages */}
          <Route path="loans" element={<LoanPage />} />
          <Route path="disbursement" element={<LoanDisbursementPage />} />
          <Route path="schedule" element={<LoanSchedulePage />} />
          <Route path="payment" element={<LoanPaymentPage />} />

          {/* Dual Transfer modules mapped to polymorphic transactions page */}
          <Route path="single-transfer" element={<TransactionPage />} />
          <Route path="payroll" element={<TransactionPage />} />
          <Route path="deposit" element={<TransactionPage />} />
          <Route path="withdrawal" element={<TransactionPage />} />
          <Route path="transactions" element={<TransactionPage />} />

          {/* History / Reporting */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/:reportId" element={<ReportDetailPage />} />

          {/* Wildcard to capture unknown entries */}
          <Route path="*" element={<Navigate to="/customers" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
