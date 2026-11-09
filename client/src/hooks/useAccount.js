import { useState, useEffect, useCallback } from "react";
import accountService from "../services/accountService.js";

export function useAccount() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getAccounts();
      setAccounts(data || []);
    } catch (err) {
      setError(err.message || "Failed to load accounts list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    refresh: fetchAccounts
  };
}
