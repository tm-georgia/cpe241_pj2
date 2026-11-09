import React, { useState } from "react";
import { useCustomer } from "../hooks/useCustomer.js";
import DataTable from "../components/common/DataTable.jsx";
import Button from "../components/common/Button.jsx";
import CustomerForm from "../components/forms/CustomerForm.jsx";
import customerService from "../services/customerService.js";
import { Plus, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { formatDate } from "../utils/date.js";

export function CustomerPage() {
  const { customers, loading, refresh } = useCustomer();
  const [view, setView] = useState("list"); // list, form, detail
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);

  const handleRowClick = async (row) => {
    try {
      const detail = await customerService.getCustomerById(row.id);
      setCustomerDetails(detail);
      setView("detail");
    } catch (err) {
      console.error("Failed to load details", err);
    }
  };

  const handleAddClick = () => {
    setSelectedCustomer(null);
    setView("form");
  };

  const handleEditClick = (e, cust) => {
    e.stopPropagation();
    setSelectedCustomer(cust);
    setView("form");
  };

  const handleDeleteClick = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this customer record?")) {
      try {
        await customerService.deleteCustomer(id);
        setView("list");
        refresh();
      } catch (err) {
        alert(err.message || "Failed to delete customer");
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, formData);
      } else {
        await customerService.createCustomer(formData);
      }
      setView("list");
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to submit customer metadata");
    }
  };

  const columns = [
    { title: "Customer Code", key: "code", sortable: true },
    { title: "Name", key: "name", sortable: true },
    { title: "NRC Number", key: "nrc_no", sortable: true },
    { title: "Phone", key: "phone_no" },
    { title: "Address Line 1", key: "address_line1" },
    {
      title: "Actions",
      key: "actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button 
            onClick={(e) => handleEditClick(e, row)}
            variant="outline"
            className="p-1 px-2 border-slate-100 hover:text-blue-600 text-gray-500 rounded-lg"
          >
            <Edit size={14} />
          </Button>
          <Button 
            onClick={(e) => handleDeleteClick(e, row.id)}
            variant="outline"
            className="p-1 px-2 border-slate-100 hover:text-red-650 hover:text-red-650 text-gray-500 rounded-lg hover:border-red-100"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ];

  if (loading && view === "list") {
    return (
      <div className="flex justify-center items-center h-48 text-sm text-gray-400 font-medium">
        Loading customers database...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Database listing ({customers.length} Entries)
            </p>
            <Button 
              onClick={handleAddClick}
              icon={<Plus size={16} />}
            >
              Add Customer
            </Button>
          </div>

          <DataTable 
            columns={columns}
            data={customers}
            onRowClick={handleRowClick}
            searchKey="name"
            searchPlaceholder="Search customers by name..."
          />
        </div>
      )}

      {view === "form" && (
        <CustomerForm 
          initialData={selectedCustomer || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setView("list")}
        />
      )}

      {view === "detail" && customerDetails && (
        <div className="space-y-6">
          <button 
            onClick={() => setView("list")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 bg-white border border-gray-100 px-3 py-2 rounded-lg shadow-sm"
          >
            <ArrowLeft size={14} /> Back to listing
          </button>

          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                  {customerDetails.code}
                </span>
                <h3 className="font-extrabold text-gray-900 text-lg mt-1.5">{customerDetails.name}</h3>
              </div>
              <div className="flex gap-2">
                <Button onClick={(e) => handleEditClick(e, customerDetails)} variant="outline">
                  Edit Profile
                </Button>
                <Button onClick={(e) => handleDeleteClick(e, customerDetails.id)} variant="danger">
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-xs font-semibold">
              <div>
                <span className="text-gray-400 uppercase font-bold tracking-wider">NRC Number:</span>
                <p className="text-gray-900 font-black text-sm mt-0.5">{customerDetails.nrc_no}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold tracking-wider">Phone Number:</span>
                <p className="text-gray-900 font-black text-sm mt-0.5">{customerDetails.phone_no}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold tracking-wider">DOB:</span>
                <p className="text-gray-900 font-bold text-sm mt-0.5">
                  {formatDate(customerDetails.date_of_birth)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 uppercase font-bold tracking-wider">Primary address (Line 1):</span>
                <p className="text-gray-800 font-medium text-sm mt-0.5">{customerDetails.address_line1}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold tracking-wider">Secondary address (Line 2):</span>
                <p className="text-gray-800 font-medium text-sm mt-0.5">{customerDetails.address_line2 || "-"}</p>
              </div>
            </div>
          </div>

          {/* Linked Bank accounts details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-slate-900 text-sm">Linked Bank Accounts</h4>
            {customerDetails.accounts && customerDetails.accounts.length === 0 ? (
              <p className="text-slate-400 text-xs py-2">No savings or credit bank accounts linked to this client.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                    <tr>
                      <th className="px-5 py-3">Account No</th>
                      <th className="px-5 py-3">Open Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Available Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {customerDetails.accounts && customerDetails.accounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-blue-600 font-extrabold font-mono">{acc.account_no}</td>
                        <td className="px-5 py-3">{formatDate(acc.open_date)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${acc.status === "Active" ? "bg-emerald-100 text-emerald-800 border-emerald-200/20" : "bg-rose-100 text-rose-800 border-rose-200/20"}`}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-black text-slate-900 font-mono">
                          ฿{new Intl.NumberFormat().format(acc.current_balance)} Baht
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerPage;
