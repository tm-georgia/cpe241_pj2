import { useState, useEffect, useCallback } from "react";
import customerService from "../services/customerService.js";

export function useCustomer() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      setError(err.message || "Failed to load customers list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refresh: fetchCustomers
  };
}
