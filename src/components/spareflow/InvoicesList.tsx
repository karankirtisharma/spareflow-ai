import React, { useState, useEffect } from 'react';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, ChevronDown, FileDown,
  Search, Trash2, CheckCircle2, AlertCircle, Calendar, DollarSign, RefreshCw, FileSpreadsheet,
  Layers, PlusCircle, MinusCircle, User, CreditCard, ChevronRight, Download, X
} from 'lucide-react';
import { useInventoryStore, Invoice } from '../../stores/inventoryStore.js';
import { ImportInvoicesModal } from './ImportInvoicesModal.js';
import { motion, AnimatePresence } from 'motion/react';

export function InvoicesList() {
  const { 
    invoices, 
    customers, 
    items: productsList, 
    fetchInvoices, 
    addInvoice 
  } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice form state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [terms, setTerms] = useState("Due on Receipt");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [salesperson, setSalesperson] = useState("");
  const [subject, setSubject] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  
  // Invoice items state
  const [formItems, setFormItems] = useState<{ productId: string; qty: number; rate: number }[]>([
    { productId: "", qty: 1, rate: 0 }
  ]);
  
  // Tax / Discount / Adjustment state
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("%");
  const [taxType, setTaxType] = useState("TDS");
  const [taxName, setTaxName] = useState("None");
  const [adjustment, setAdjustment] = useState(0);

  // Status message
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Set default invoice number when opening new modal
  const handleOpenNewModal = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-2026-${randomSuffix}`);
    setCustomerId(customers[0]?.id || "");
    setOrderNumber("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setTerms("Due on Receipt");
    setDueDate(new Date().toISOString().split("T")[0]);
    setSalesperson("");
    setSubject("");
    setCustomerNotes("");
    setTermsConditions("Please make payment within the due date.");
    setFormItems([{ productId: productsList[0]?.id || "", qty: 1, rate: parseFloat(String(productsList[0]?.sales_price || 0)) }]);
    setDiscount(0);
    setDiscountType("%");
    setTaxType("TDS");
    setTaxName("None");
    setAdjustment(0);
    setFormError(null);
    setFormSuccess(null);
    setShowNewModal(true);
  };

  // Recalculate item rates when product selection changes
  const handleProductChange = (index: number, prodId: string) => {
    const selectedProd = productsList.find(p => String(p.id) === prodId);
    const updated = [...formItems];
    updated[index].productId = prodId;
    updated[index].rate = parseFloat(String(selectedProd?.sales_price || 0));
    setFormItems(updated);
  };

  const handleItemQtyChange = (index: number, val: number) => {
    const updated = [...formItems];
    updated[index].qty = Math.max(1, val);
    setFormItems(updated);
  };

  const handleItemRateChange = (index: number, val: number) => {
    const updated = [...formItems];
    updated[index].rate = Math.max(0, val);
    setFormItems(updated);
  };

  const addFormItemRow = () => {
    setFormItems([...formItems, { productId: productsList[0]?.id || "", qty: 1, rate: parseFloat(String(productsList[0]?.sales_price || 0)) }]);
  };

  const removeFormItemRow = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  // Calculations
  const subtotal = formItems.reduce((acc, item) => {
    return acc + (item.qty * item.rate);
  }, 0);

  let discountAmount = 0;
  if (discountType === "%") {
    discountAmount = (subtotal * discount) / 100;
  } else {
    discountAmount = discount;
  }

  let taxAmount = 0;
  if (taxName === "TDS - 1%") {
    taxAmount = (subtotal - discountAmount) * 0.01;
  } else if (taxName === "TDS - 2%") {
    taxAmount = (subtotal - discountAmount) * 0.02;
  }

  const grandTotal = subtotal - discountAmount + taxAmount + adjustment;

  // Submit form
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!invoiceNumber) {
      setFormError("Invoice number is required.");
      return;
    }

    const selectedCust = customers.find(c => String(c.id) === customerId);
    
    const finalPayload = {
      invoice_number: invoiceNumber,
      customer_id: customerId,
      customer_name: selectedCust?.name || "General Customer",
      order_number: orderNumber,
      invoice_date: invoiceDate,
      terms,
      due_date: dueDate,
      salesperson,
      subject,
      status: "unpaid",
      total: grandTotal,
      discount,
      discount_type: discountType,
      tax_type: taxType,
      tax_name: taxName,
      adjustment,
      customer_notes: customerNotes,
      terms_conditions: termsConditions,
      items: formItems.map(f => ({
        productId: Number(f.productId),
        qty: f.qty,
        rate: f.rate
      }))
    };

    setIsSubmitting(true);
    try {
      await addInvoice(finalPayload);
      setFormSuccess("Invoice created successfully!");
      setTimeout(() => {
        setShowNewModal(false);
      }, 1000);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      inv.invoice_number.toLowerCase().includes(searchLower) ||
      (inv.customerName || "").toLowerCase().includes(searchLower) ||
      (inv.subject || "").toLowerCase().includes(searchLower) ||
      (inv.salesperson || "").toLowerCase().includes(searchLower);
    
    if (statusFilter === "all") return matchSearch;
    return matchSearch && inv.status === statusFilter;
  });

  // KPI Calculations
  const kpiPaid = invoices.filter(i => i.status === 'paid').reduce((a, b) => a + Number(b.total), 0);
  const kpiUnpaid = invoices.filter(i => i.status === 'unpaid' || i.status === 'partially_paid').reduce((a, b) => a + Number(b.total), 0);
  const kpiOverdue = invoices.filter(i => i.status === 'overdue').reduce((a, b) => a + Number(b.total), 0);

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-full relative font-sans overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 shadow-3xs">
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="flex flex-col">
            <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
              Invoices Registry <ChevronDown className="w-4 h-4 mt-0.5 text-slate-400" />
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Manage and track billing collections</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Import Button */}
          <button 
            onClick={() => setShowImportModal(true)}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-[4px] text-[13px] font-bold flex items-center gap-1.5 shadow-3xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Import Invoices
          </button>

          {/* Create Button */}
          <button 
            onClick={handleOpenNewModal}
            className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
          
          <div className="h-5 w-px bg-slate-300 mx-1"></div>
          <button className="text-slate-500 hover:text-slate-850 p-1.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors">
             <Settings className="w-[17px] h-[17px]" />
          </button>
          <button className="text-slate-500 hover:text-slate-850 p-1.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors">
             <ListFilter className="w-[17px] h-[17px]" />
          </button>
        </div>
      </div>

      {/* Mini Dashboard Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 shrink-0">
        
        {/* Total Invoiced */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
            <strong className="text-[20px] font-extrabold text-slate-800 block mt-1">
              ₹{invoices.reduce((a, b) => a + Number(b.total), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Received Payments</span>
            <strong className="text-[20px] font-extrabold text-emerald-600 block mt-1">
              ₹{kpiPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unpaid / Open</span>
            <strong className="text-[20px] font-extrabold text-amber-600 block mt-1">
              ₹{kpiUnpaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Collections</span>
            <strong className="text-[20px] font-extrabold text-rose-600 block mt-1">
              ₹{kpiOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 pb-4 flex items-center justify-between gap-4 shrink-0">
        
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Search by invoice #, customer name, salesperson..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full bg-white border border-slate-250 rounded-[4px] text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-3xs"
          />
        </div>

        {/* Quick Filter tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          {[
            { id: "all", label: "All" },
            { id: "unpaid", label: "Unpaid" },
            { id: "paid", label: "Paid" },
            { id: "draft", label: "Draft" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-[12px] font-bold rounded-md transition-all cursor-pointer ${
                statusFilter === tab.id 
                  ? 'bg-white text-[#2485e8] shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto mx-6 mb-6 bg-white border border-slate-200 rounded-xl shadow-3xs">
        {filteredInvoices.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <FileDown className="w-12 h-12 text-slate-350 stroke-[1.5px] mb-3" />
            <h4 className="text-[14.5px] font-bold text-slate-700">No Invoices Found</h4>
            <p className="text-[12px] text-slate-400 mt-1 max-w-sm">
              Create a new invoice directly or import transactions via CSV or JSON files.
            </p>
            <div className="flex gap-2.5 mt-4">
              <button 
                onClick={handleOpenNewModal}
                className="bg-[#2485e8] text-white px-4 py-1.5 rounded text-[12.5px] font-bold cursor-pointer"
              >
                Create Invoice
              </button>
              <button 
                onClick={() => setShowImportModal(true)}
                className="bg-emerald-50 text-emerald-700 border border-emerald-250 px-4 py-1.5 rounded text-[12.5px] font-bold cursor-pointer"
              >
                Import CSV
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Salesperson</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr 
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-bold text-slate-800 font-mono tracking-tight text-[12.5px]">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[11px] font-bold shrink-0">
                        {inv.customerName?.charAt(0) || "C"}
                      </div>
                      <span className="font-semibold text-slate-700">{inv.customerName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[12px]">
                    {inv.invoiceDate}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[12px]">
                    {inv.dueDate || inv.invoiceDate}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                    {inv.subject || "—"}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {inv.salesperson || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wide border ${
                      inv.status === 'paid' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : inv.status === 'unpaid' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : inv.status === 'overdue'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-800 font-mono text-[13.5px]">
                    ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: NEW INVOICE */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center bg-slate-950/40 backdrop-blur-xs p-4 pt-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-250 w-full max-w-4xl overflow-hidden mb-12"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div>
                  <h3 className="text-[16px] font-extrabold text-slate-800">New Invoice Creation</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Input details to generate a billable ledger</p>
                </div>
                <button 
                  onClick={() => setShowNewModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoiceSubmit} className="p-6 space-y-6">
                
                {/* Form Fields: Grid 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Customer Selection */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Customer Name *</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      required
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Invoice # *</label>
                    <input 
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                    />
                  </div>

                  {/* Order Number */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Order Number (Sales Order #)</label>
                    <input 
                      type="text"
                      placeholder="e.g. SO-2041"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                    />
                  </div>

                </div>

                {/* Form Fields: Grid 2 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Invoice Date */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Invoice Date</label>
                    <input 
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                    />
                  </div>

                  {/* Terms */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Terms</label>
                    <select
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                    >
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Due Date</label>
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                    />
                  </div>

                  {/* Salesperson */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Salesperson</label>
                    <input 
                      type="text"
                      placeholder="e.g. John Doe"
                      value={salesperson}
                      onChange={(e) => setSalesperson(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                    />
                  </div>

                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Subject</label>
                  <input 
                    type="text"
                    placeholder="e.g. Spare parts supplies for Q2 fleet service"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                  />
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                        <th className="py-2.5 px-3">Item Details</th>
                        <th className="py-2.5 px-3 w-28">Quantity</th>
                        <th className="py-2.5 px-3 w-36">Rate</th>
                        <th className="py-2.5 px-3 w-36 text-right">Amount</th>
                        <th className="py-2.5 px-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((formItem, index) => (
                        <tr key={index}>
                          <td className="py-2.5 px-3">
                            <select
                              value={formItem.productId}
                              onChange={(e) => handleProductChange(index, e.target.value)}
                              required
                              className="bg-white border border-slate-250 text-[12.5px] text-slate-800 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                            >
                              {productsList.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <input 
                              type="number"
                              min="1"
                              value={formItem.qty}
                              onChange={(e) => handleItemQtyChange(index, parseInt(e.target.value) || 1)}
                              className="bg-white border border-slate-250 text-[12.5px] text-slate-800 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-none w-full font-mono text-center"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-[12px]">₹</span>
                              <input 
                                type="number"
                                min="0"
                                step="0.01"
                                value={formItem.rate}
                                onChange={(e) => handleItemRateChange(index, parseFloat(e.target.value) || 0)}
                                className="bg-white border border-slate-250 text-[12.5px] text-slate-800 rounded pl-6 pr-2.5 py-1.5 focus:border-blue-500 focus:outline-none w-full font-mono"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700 font-mono text-[13px]">
                            ₹{(formItem.qty * formItem.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeFormItemRow(index)}
                              disabled={formItems.length === 1}
                              className="text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer p-1"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-slate-50/50 p-2.5 border-t border-slate-150 flex justify-start">
                    <button
                      type="button"
                      onClick={addFormItemRow}
                      className="text-blue-600 hover:text-blue-800 text-[12px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Item Line
                    </button>
                  </div>
                </div>

                {/* Summary block: discount, TDS, totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-150">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-600 mb-1">Customer Notes</label>
                      <textarea
                        rows={2}
                        placeholder="Will appear on customer invoice"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="bg-white border border-slate-300 text-[12.5px] text-slate-800 rounded p-2.5 focus:border-blue-500 focus:outline-none w-full leading-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-600 mb-1">Terms & Conditions</label>
                      <textarea
                        rows={2}
                        placeholder="Contractual conditions"
                        value={termsConditions}
                        onChange={(e) => setTermsConditions(e.target.value)}
                        className="bg-white border border-slate-300 text-[12.5px] text-slate-800 rounded p-2.5 focus:border-blue-500 focus:outline-none w-full leading-normal"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-200 space-y-3">
                    {/* Subtotal */}
                    <div className="flex justify-between text-[13px] text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Discount row */}
                    <div className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="text-slate-500">Discount</span>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="number" 
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="bg-white border border-slate-250 text-[11.5px] text-slate-800 rounded px-1.5 py-0.5 w-16 font-mono text-center focus:outline-none focus:border-blue-500"
                        />
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value)}
                          className="bg-white border border-slate-250 text-[11px] text-slate-700 rounded py-0.5 px-1 focus:outline-none cursor-pointer"
                        >
                          <option value="%">%</option>
                          <option value="Flat">₹ Flat</option>
                        </select>
                      </div>
                    </div>

                    {/* TDS / Taxes */}
                    <div className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="text-slate-500">TDS/Tax Deduction</span>
                      <select
                        value={taxName}
                        onChange={(e) => setTaxName(e.target.value)}
                        className="bg-white border border-slate-250 text-[11.5px] text-slate-700 rounded py-1 px-2 focus:outline-none cursor-pointer shadow-3xs"
                      >
                        <option value="None">None</option>
                        <option value="TDS - 1%">TDS @ 1%</option>
                        <option value="TDS - 2%">TDS @ 2%</option>
                      </select>
                    </div>

                    {/* Adjustment */}
                    <div className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="text-slate-500">Adjustment (Fine/Credit)</span>
                      <input 
                        type="number" 
                        value={adjustment}
                        onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-250 text-[11.5px] text-slate-800 rounded px-1.5 py-0.5 w-24 font-mono text-right focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="h-px bg-slate-200 my-2"></div>

                    {/* Grand Total */}
                    <div className="flex justify-between text-[14.5px] font-extrabold text-slate-800">
                      <span>Total Amount (INR)</span>
                      <span className="font-mono text-blue-600">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                  </div>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[12px] rounded-md flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="text-slate-600 border border-slate-300 hover:bg-slate-50 px-4 py-1.5 rounded text-[13px] font-bold bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#2485e8] hover:bg-[#1a74d4] disabled:opacity-50 text-white font-bold text-[13px] px-5 py-1.5 rounded shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>Create Invoice</>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DETAIL DRAWER VIEW */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-3xs" onClick={() => setSelectedInvoice(null)}>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200"
            >
              <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#2485e8]">Invoice Details</span>
                  <h3 className="text-[16px] font-extrabold text-slate-800 font-mono mt-0.5">{selectedInvoice.invoice_number}</h3>
                </div>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status and Total */}
                <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Bill</span>
                    <strong className="text-[19px] font-black text-slate-800 font-mono mt-0.5 block">
                      ₹{Number(selectedInvoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-[4px] text-[10.5px] font-black uppercase tracking-wider border ${
                      selectedInvoice.status === 'paid' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                        : 'bg-amber-50 text-amber-700 border-amber-250'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[12.5px] border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Customer Name</span>
                    <span className="text-slate-700 font-bold mt-1 block">{selectedInvoice.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Salesperson</span>
                    <span className="text-slate-700 font-semibold mt-1 block">{selectedInvoice.salesperson || "Not Assigned"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Invoice Date</span>
                    <span className="text-slate-700 font-mono mt-1 block">{selectedInvoice.invoiceDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Due Date</span>
                    <span className="text-slate-700 font-mono mt-1 block">{selectedInvoice.dueDate || selectedInvoice.invoiceDate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Subject</span>
                    <span className="text-slate-700 font-medium mt-1 block">{selectedInvoice.subject || "No description provided"}</span>
                  </div>
                </div>

                {/* Items breakdown list */}
                <div className="space-y-3">
                  <h4 className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest block">Items Breakdown</h4>
                  <div className="border border-slate-150 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
                    {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, index) => {
                        const originalProd = productsList.find(p => Number(p.id) === item.productId);
                        return (
                          <div key={index} className="p-3 flex items-center justify-between text-[12.5px]">
                            <div>
                              <strong className="text-slate-700 font-semibold block">{originalProd?.name || `Product ID: ${item.productId}`}</strong>
                              <span className="text-[11px] text-slate-400 font-medium font-mono mt-0.5 block">
                                {item.qty} units × ₹{Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <strong className="text-slate-800 font-mono font-bold text-[13px]">
                              ₹{(item.qty * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </strong>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-[12px] italic">
                        No individual items specified. Single service order lump sum total.
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes and terms */}
                {selectedInvoice.customer_notes && (
                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-150 text-[12px] leading-relaxed">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Customer Notes</span>
                    <p className="text-slate-600 font-medium mt-0.5">{selectedInvoice.customer_notes}</p>
                  </div>
                )}

                {selectedInvoice.terms_conditions && (
                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-150 text-[12px] leading-relaxed">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Terms & Conditions</span>
                    <p className="text-slate-600 font-medium mt-0.5">{selectedInvoice.terms_conditions}</p>
                  </div>
                )}

              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center gap-2">
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="w-full text-slate-600 border border-slate-300 hover:bg-slate-100 font-bold text-[12.5px] py-2 rounded bg-white transition-colors cursor-pointer"
                >
                  Close Pane
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: IMPORT WIZARD */}
      {showImportModal && (
        <ImportInvoicesModal 
          onClose={() => setShowImportModal(false)}
          onImportComplete={async () => {
            await fetchInvoices();
            setShowImportModal(false);
          }}
        />
      )}

    </div>
  );
}
