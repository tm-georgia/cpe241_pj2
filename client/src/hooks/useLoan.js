import { useState, useEffect, useCallback } from "react";
import loanService from "../services/loanService.js";

export function useLoan() {
  const [loans, setLoans] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLoansInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loansData, typesData] = await Promise.all([
        loanService.getLoans(),
        loanService.getLoanTypes()
      ]);
      setLoans(loansData || []);
      setLoanTypes(typesData || []);
    } catch (err) {
      setError(err.message || "Failed to load loans details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoansInfo();
  }, [fetchLoansInfo]);

  return {
    loans,
    loanTypes,
    loading,
    error,
    refresh: fetchLoansInfo
  };
}
