import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, 
  ChevronDown, Send, FileText, CheckCircle, Clock, Trash2, 
  X, AlertCircle, FileDown, Search, ArrowRight, User, 
  Calendar, Clipboard, HelpCircle as HelpIcon, Layers, Info, Check, Download, ShoppingBag, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function SalesOrdersList() {
  const { 
    salesOrders, 
    items: inventoryItems, 
    customers,
    addSalesOrder, 
    fetchSalesOrders,
    isLoading 
  } = useInventoryStore();

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State matches screenshot
  const [customerId, setCustomerId] = useState("");
  const [soNumber, setSoNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [expectedShipmentDate, setExpectedShipmentDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [salesperson, setSalesperson] = useState("");

  // Item table lines state
  const [lineItems, setLineItems] = useState<{ productId: string; qty: string; rate: string }[]>([
    { productId: '', qty: '1.00', rate: '0.00' }
  ]);

  // Bottom right metrics state
  const [discountValue, setDiscountValue] = useState("0");
  const [discountType, setDiscountType] = useState("%"); // % or ₹
  const [taxType, setTaxType] = useState<"TDS" | "TCS">("TDS");
  const [selectedTaxRate, setSelectedTaxRate] = useState("0"); // e.g. 0.05 for 5%
  const [adjustmentValue, setAdjustmentValue] = useState("0");
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsConditions, setTermsConditions] = useState("");

  // Populate sales orders on first render
  useEffect(() => {
    fetchSalesOrders();
  }, []);

  // Safe defaults when modal opens
  const openModal = () => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    setSoNumber(`SO-${randomSuffix}`);
    
    const today = new Date().toISOString().split('T')[0];
    setOrderDate(today);
    setExpectedShipmentDate("");

    // Default customer
    if (customers && customers.length > 0) {
      setCustomerId(customers[0].id);
    } else {
      setCustomerId("");
    }
    
    setReferenceNumber("");
    setPaymentTerms("Due on Receipt");
    setDeliveryMethod("Local Courier");
    setSalesperson("Admin User");
    setLineItems([{ productId: '', qty: '1.00', rate: '0.00' }]);
    setDiscountValue("0");
    setDiscountType("%");
    setTaxType("TDS");
    setSelectedTaxRate("0");
    setAdjustmentValue("0");
    setCustomerNotes("");
    setTermsConditions("");
    setFormError("");
    setShowCreateModal(true);
  };

  const addLineRow = () => {
    setLineItems(prev => [...prev, { productId: '', qty: '1.00', rate: '0.00' }]);
  };

  const removeLineRow = (idx: number) => {
    if (lineItems.length === 1) {
      setLineItems([{ productId: '', qty: '1.00', rate: '0.00' }]);
    } else {
      setLineItems(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleLineChange = (idx: number, field: 'productId' | 'qty' | 'rate', value: string) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i === idx) {
        let updated = { ...item, [field]: value };
        if (field === 'productId') {
          // Auto populate item rate from price
          const matchedItem = inventoryItems.find(it => String(it.id) === String(value));
          if (matchedItem) {
            updated.rate = String(matchedItem.sales_price || '0.00');
          }
        }
        return updated;
      }
      return item;
    }));
  };

  // Calculations
  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const q = Number(item.qty) || 0;
      const r = Number(item.rate) || 0;
      return sum + (q * r);
    }, 0);
  };

  const calculateDiscount = (sub: number) => {
    const disc = Number(discountValue) || 0;
    if (discountType === "%") {
      return (sub * disc) / 100;
    }
    return disc;
  };

  const calculateTax = (subAfterDisc: number) => {
    const rate = Number(selectedTaxRate) || 0;
    return subAfterDisc * rate;
  };

  const calculateGrandTotal = () => {
    const sub = calculateSubtotal();
    const disc = calculateDiscount(sub);
    const subAfterDisc = Math.max(0, sub - disc);
    const tax = calculateTax(subAfterDisc);
    const adj = Number(adjustmentValue) || 0;
    
    // TDS reduces the final payouts (withheld tax), TCS increases the billing invoice usually
    // We can compute beautiful Zoho subtotal accounting
    if (taxType === "TDS") {
      return Math.max(0, subAfterDisc - tax + adj);
    } else {
      return Math.max(0, subAfterDisc + tax + adj);
    }
  };

  const calculateTotalQty = () => {
    return lineItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  };

  // Submit Sales Order to database
  const handleSubmit = async (e: React.FormEvent, submitStatus: 'draft' | 'confirmed') => {
    e.preventDefault();
    setFormError("");

    if (!soNumber.trim()) {
      setFormError("Sales order number is required.");
      return;
    }

    if (!customerId) {
      setFormError("Please select a customer.");
      return;
    }

    // Filter valid selected rows
    const validLines = lineItems.filter(li => li.productId && Number(li.qty) > 0);
    if (validLines.length === 0) {
      setFormError("Please select at least one valid item and supply a quantity.");
      return;
    }

    const selectedCust = customers.find(c => String(c.id) === String(customerId));
    const grandT = calculateGrandTotal();

    setIsSubmitting(true);
    try {
      const payloadItems = validLines.map(vl => ({
        productId: Number(vl.productId),
        qtyOrdered: Number(vl.qty),
        qtyShipped: 0,
        unitPrice: Number(vl.rate)
      }));

      await addSalesOrder({
        so_number: soNumber.trim(),
        customer_id: customerId,
        customer_name: selectedCust ? selectedCust.name : "ABC Motors",
        status: submitStatus,
        order_date: orderDate || new Date().toISOString().split('T')[0],
        total: grandT,
        reference_number: referenceNumber,
        expected_shipment_date: expectedShipmentDate || null,
        payment_terms: paymentTerms,
        delivery_method: deliveryMethod,
        salesperson: salesperson,
        discount: Number(discountValue) || 0,
        discount_type: discountType,
        tax_type: taxType,
        tax_name: selectedTaxRate === "0.05" ? "GST 5%" : selectedTaxRate === "0.12" ? "GST 12%" : selectedTaxRate === "0.18" ? "GST 18%" : "None",
        adjustment: Number(adjustmentValue) || 0,
        customer_notes: customerNotes,
        terms_conditions: termsConditions,
        items: payloadItems as any
      });

      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to make Sales Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search filter
  const filteredSalesOrders = (salesOrders || []).filter(so => {
    const term = search.toLowerCase();
    return (
      so.so_number.toLowerCase().includes(term) ||
      (so.customer_name && so.customer_name.toLowerCase().includes(term)) ||
      (so.reference_number && so.reference_number.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative font-sans antialiased text-slate-800">
      
      {/* Top Header Controls bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer group">
            <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              All Sales Orders <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5" />
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lookup Input */}
          <div className="relative mr-2 hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Search Sales Orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-[4px] text-[13px] bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500 w-56 transition-all"
            />
          </div>

          <button 
            onClick={openModal}
            className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3px]" /> New
          </button>

          <div className="h-5 w-px bg-slate-300 mx-1.5"></div>

          <button className="text-slate-500 hover:text-slate-805 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="Settings">
            <Settings className="w-[17px] h-[17px]" />
          </button>

          <button className="text-slate-500 hover:text-slate-805 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="Filters">
            <ListFilter className="w-[17px] h-[17px]" />
          </button>

          <button className="text-slate-500 hover:text-slate-805 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="More Options">
            <MoreHorizontal className="w-[17px] h-[17px]" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          <button className="text-[#2485e8] p-1.5 hover:bg-blue-50 rounded-md transition-colors" title="Help Manual">
            <HelpIcon className="w-[17px] h-[17px]" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span>Active Sales Orders: <b>{salesOrders.length}</b></span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>Draft: <b>{salesOrders.filter(p => p.status === 'draft').length}</b></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#eca330]"></span>
          <span>Confirmed: <b>{salesOrders.filter(p => p.status === 'confirmed').length}</b></span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Shipped: <b>{salesOrders.filter(p => p.status === 'shipped').length}</b></span>
        </div>
        <div>
          <button onClick={() => fetchSalesOrders()} className="hover:text-blue-600 transition-colors font-semibold cursor-pointer">
            ↻ Refresh Logs
          </button>
        </div>
      </div>

      {/* Primary Flow View (Matches Screenshot 1 diagram exactly when empty, fallback when salesOrders is zero) */}
      {salesOrders.length === 0 ? (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex flex-col items-center">
          
          {/* Main prompt hero */}
          <div className="text-center mt-12 mb-10 max-w-lg">
            <h3 className="text-[20px] font-bold text-slate-800 tracking-tight mb-2.5">
              Start Managing Your Sales Activities!
            </h3>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
              Create, customize and send professional Sales Orders.
            </p>
            <button 
              onClick={openModal}
              className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-6 py-2.5 rounded-[4px] text-[13px] font-bold cursor-pointer transition-all shadow-sm transform hover:-translate-y-[1px]"
            >
              CREATE SALES ORDER
            </button>
          </div>

          {/* Life Cycle interactive graph flowchart (Matching screenshot diagram blueprint) */}
          <div className="w-full max-w-5xl bg-white rounded-lg border border-slate-200 p-8 shadow-xs mb-10">
            <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center mb-10 select-none">
              Life cycle of a Sales Order
            </h4>

            {/* FLOW DIAGRAM CONTAINER */}
            <div className="relative flex flex-col md:flex-row items-center justify-center gap-y-12 gap-x-3 md:gap-x-6 min-h-[220px]">
              
              {/* Columns representation */}
              <div className="flex flex-col gap-4 text-center">
                {/* 1. Customer Request */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-350 text-slate-650 px-4 py-2.5 rounded-[4px] shadow-2xs font-semibold text-[11px] w-48 justify-center uppercase tracking-wide">
                  <User className="w-3.5 h-3.5 text-[#2485e8]" />
                  Customer Request
                </div>

                {/* 2. Accepted Estimate */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-350 text-slate-650 px-4 py-2.5 rounded-[4px] shadow-2xs font-semibold text-[11px] w-48 justify-center uppercase tracking-wide">
                  <Clipboard className="w-3.5 h-3.5 text-emerald-500" />
                  Accepted Estimate
                </div>
              </div>

              {/* Dotted Arrow down/right connector */}
              <div className="hidden md:flex flex-col justify-center items-center gap-6 text-[#2485e8] font-bold">
                <span className="text-[14px]">⇢</span>
              </div>

              {/* 3. Create Sales Order (Hub core) */}
              <div className="group relative border-2 border-dashed border-[#2485e8] bg-blue-50/20 p-5 rounded-lg flex flex-col items-center justify-center text-center w-56">
                <div className="bg-blue-500 text-white rounded-full p-2 h-9 w-9 flex items-center justify-center font-bold mb-2">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Step 01</span>
                <span className="text-[13px] font-bold text-[#2485e8] uppercase">CREATE SALES ORDER</span>
                
                {/* Connector bubble */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-[8px] uppercase font-extrabold hidden md:block">
                  Convert
                </div>
              </div>

              {/* Arrow right */}
              <div className="hidden md:block text-slate-400 font-extrabold text-[15px]">➔</div>

              {/* 4. Confirm Sales Order */}
              <div className="border border-slate-300 bg-white p-4 rounded-lg flex flex-col items-center text-center w-48 shadow-2xs">
                <CheckCircle className="w-5 h-5 text-emerald-500 mb-1.5" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Step 02</span>
                <span className="text-[12px] font-semibold text-slate-700">CONFIRM SALES ORDER</span>
              </div>

              {/* Arrow right option fork */}
              <div className="hidden md:flex flex-col justify-center gap-1 text-[11px] font-bold text-amber-500 text-center">
                <span>Low Stock</span>
                <span className="text-slate-400 font-extrabold text-[15px]">➔</span>
              </div>

              {/* 5. Convert to Purchase Order (Fork) */}
              <div className="border border-amber-200 bg-amber-50/20 p-4 rounded-lg flex flex-col items-center text-center w-48 shadow-2xs">
                <ArrowUpRight className="w-5 h-5 text-amber-600 mb-1.5" />
                <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">Procurement</span>
                <span className="text-[11px] font-semibold text-slate-700">CONVERT TO PURCHASE ORDER</span>
              </div>

            </div>

            {/* Bottom auxiliary pipeline helper flow info */}
            <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-around text-[12px] text-slate-500">
              <div className="flex items-center gap-2 mb-3 sm:mb-0">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" />
                <span>Automatically updates <b>committed inventory</b> levels.</span>
              </div>
              <div className="flex items-center gap-2 mb-3 sm:mb-0">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" />
                <span>Enables swift single-click conversion to <b>Invoices</b>.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" />
                <span>Triggers rapid picking list and shipment.</span>
              </div>
            </div>

          </div>

          <div className="text-[12px] text-slate-400 italic mb-8">
            In the Sales Orders module, you can issue quotes, allocate stock buffers, and fulfill customer requests effortlessly.
          </div>
        </div>
      ) : (
        /* Real functional Sales Orders list table */
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#f8fafc] border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-[12px] text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-6 w-10 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="py-3 px-6">Sales Order#</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Customer Name</th>
                <th className="py-3 px-6">Reference#</th>
                <th className="py-3 px-6">Expected Delivery</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-right pr-12">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredSalesOrders.map(so => {
                return (
                  <tr key={so.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                    <td className="py-3.5 px-6 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-blue-600 hover:underline">
                      {so.so_number}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {so.order_date}
                    </td>
                    <td className="py-3.5 px-6 text-slate-750 font-medium">
                      {so.customer_name || "General Customer"}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {so.reference_number || <span className="text-slate-300 font-light">—</span>}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {so.expected_shipment_date || <span className="text-slate-300 font-light italic text-[12px]">Not set</span>}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                        so.status === 'shipped' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : so.status === 'confirmed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-105'
                          : 'bg-amber-50 text-amber-705 border border-amber-100'
                      }`}>
                        {so.status === 'shipped' ? (
                          <>
                            <Check className="w-3 h-3 stroke-[2.5]" /> Shipped
                          </>
                        ) : so.status === 'confirmed' ? (
                          <>
                            <CheckCircle className="w-3 h-3 stroke-[2.5]" /> Confirmed
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 stroke-[2.5]" /> Draft
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-slate-900 pr-12 font-mono">
                      ₹{Number(so.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {filteredSalesOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching sales orders found for "<b>{search}</b>".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW SALES ORDER DRAWER/MODAL (MATCHES EXACT SCREENSHOT SCHEMES) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-[#1e2229]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-[4px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col my-4 border border-slate-250 max-h-[96vh]"
            >
              
              {/* Modal Header */}
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                  <span className="text-[17px] font-bold text-slate-805">New Sales Order</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-400 hover:text-slate-650 cursor-pointer" />
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-sm cursor-pointer"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Modal Body Scroll Panel */}
              <div className="flex-1 overflow-y-auto bg-white p-6 space-y-6">
                
                {formError && (
                  <div className="p-3 text-[13px] bg-rose-50 border border-rose-200 text-rose-700 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> 
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={(e) => handleSubmit(e, 'confirmed')} className="space-y-6 text-[13px]">
                  
                  {/* Fields Container Grid: Left & Right alignment matching screenshot exactly */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-4">
                    
                    {/* Left Column Fieldsets */}
                    <div className="space-y-3">
                      
                      {/* Customer Name input */}
                      <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
                        <label className="text-red-650 font-semibold text-right text-[13px]">
                          Customer Name<span className="text-red-500 select-none">*</span>
                        </label>
                        <div className="flex gap-2">
                          <select 
                            required
                            className="flex-1 text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                          >
                            <option value="">Select or add a customer</option>
                            {customers.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                            ))}
                          </select>
                          <button 
                            type="button" 
                            title="Add Customer Account"
                            className="bg-blue-500 text-white p-2 rounded-[3px] hover:bg-blue-600 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Sales Order Code */}
                      <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
                        <label className="text-red-650 font-semibold text-right text-[13px]">
                          Sales Order#<span className="text-red-500 select-none">*</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            required
                            className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 pr-8 focus:outline-hidden focus:border-blue-500 font-mono font-medium text-slate-850"
                            value={soNumber}
                            onChange={(e) => setSoNumber(e.target.value)}
                          />
                          <Settings className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 cursor-pointer hover:text-slate-655" />
                        </div>
                      </div>

                      {/* Reference Number input */}
                      <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
                        <label className="text-slate-600 font-semibold text-right text-[13px] flex items-center justify-end gap-1">
                          Reference# <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5" title="Customer purchase order or reference tracking code" />
                        </label>
                        <input 
                          type="text"
                          className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder="Reference quotation ref"
                        />
                      </div>

                      {/* Sales Order Date */}
                      <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
                        <label className="text-red-650 font-semibold text-right text-[13px]">
                          Sales Order Date<span className="text-red-500 select-none">*</span>
                        </label>
                        <input 
                          type="date"
                          required
                          className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500 font-medium text-slate-800"
                          value={orderDate}
                          onChange={(e) => setOrderDate(e.target.value)}
                        />
                      </div>

                      {/* Expected Shipment Date */}
                      <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
                        <label className="text-slate-650 font-semibold text-right text-[13px]">Expected Shipment Date</label>
                        <input 
                          type="date"
                          className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                          value={expectedShipmentDate}
                          onChange={(e) => setExpectedShipmentDate(e.target.value)}
                        />
                      </div>

                      {/* Payment terms */}
                      <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
                        <label className="text-slate-650 font-semibold text-right text-[13px]">Payment Terms</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                        >
                          <option value="Due on Receipt">Due on Receipt</option>
                          <option value="Net 15">Net 15 Days</option>
                          <option value="Net 30">Net 30 Days</option>
                          <option value="Net 45">Net 45 Days</option>
                          <option value="Net 60">Net 60 Days</option>
                        </select>
                      </div>

                    </div>

                    {/* Right Column Fieldsets */}
                    <div className="space-y-3">
                      
                      {/* Delivery Method dropdown */}
                      <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
                        <label className="text-slate-650 font-semibold text-right text-[13px]">Delivery Method</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                          value={deliveryMethod}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                        >
                          <option value="">Select delivery method</option>
                          <option value="DHL">DHL Express</option>
                          <option value="FedEx">FedEx Delivery</option>
                          <option value="Local Courier">Local Road Transport</option>
                          <option value="Hand Delivery">Self Collector / Hand Deliver</option>
                        </select>
                      </div>

                      {/* Salesperson dropdown */}
                      <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
                        <label className="text-slate-650 font-semibold text-right text-[13px]">Salesperson</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                          value={salesperson}
                          onChange={(e) => setSalesperson(e.target.value)}
                        >
                          <option value="">Select or add salesperson</option>
                          <option value="Admin User">Admin User</option>
                          <option value="Pradeep Kumar">Pradeep Kumar (Store Keeper)</option>
                          <option value="Srinivas Rao">Srinivas Rao (Logistics manager)</option>
                          <option value="Amit Sharma">Amit Sharma (VP Accounts)</option>
                        </select>
                      </div>

                    </div>

                  </div>

                  {/* ITEM LINES DATAGRID TABLE (MATCHING SCREENSHOT 2/3) */}
                  <div className="border border-slate-200 rounded-[3px] overflow-hidden mt-6">
                    <table className="w-full text-left font-sans border-collapse">
                      <thead>
                        <tr className="bg-[#f8fafc] border-b border-slate-200 text-[12px] text-slate-500 font-semibold select-none">
                          <th className="py-2.5 px-4 font-bold">Item Details</th>
                          <th className="py-2.5 px-4 text-right w-40 font-bold">Quantity</th>
                          <th className="py-2.5 px-4 text-right w-48 font-bold flex items-center justify-end gap-1">
                            Rate <HelpIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5" title="Calculator rate tool available" />
                          </th>
                          <th className="py-2.5 px-6 text-right w-40 font-bold">Amount</th>
                          <th className="py-2.5 px-3 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {lineItems.map((line, idx) => {
                          const totalLineAmount = (Number(line.qty) || 0) * (Number(line.rate) || 0);
                          const matchingCatalogItem = inventoryItems.find(it => String(it.id) === String(line.productId));

                          return (
                            <tr key={idx} className="group hover:bg-slate-50/50">
                              {/* Item detail catalog selection link */}
                              <td className="py-3 px-4">
                                <select 
                                  required
                                  className="w-full text-[13px] border-none bg-transparent focus:outline-hidden text-slate-850 font-medium"
                                  value={line.productId}
                                  onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                                >
                                  <option value="">Type or click to select an item.</option>
                                  {inventoryItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                      {item.name} ({item.sku}) [On Hand: {item.qty_on_hand} {item.unit}]
                                    </option>
                                  ))}
                                </select>
                                {matchingCatalogItem && matchingCatalogItem.qty_on_hand < (Number(line.qty) || 0) && (
                                  <span className="text-[10px] text-amber-600 block pl-1 font-semibold">
                                    ⚠ Low Local Inventory stock warning! Available: {matchingCatalogItem.qty_on_hand} units only.
                                  </span>
                                )}
                              </td>
                              
                              {/* Qty field */}
                              <td className="py-3 px-4 w-40 text-right">
                                <input 
                                  type="number" 
                                  required
                                  min="0.01"
                                  step="any"
                                  className="w-full text-[13px] border border-slate-200 hover:border-slate-350 focus:border-blue-500 bg-white px-2.5 py-1 text-right rounded-[3px] focus:outline-hidden font-mono text-slate-800"
                                  value={line.qty}
                                  onChange={(e) => handleLineChange(idx, 'qty', e.target.value)}
                                  placeholder="1.00"
                                />
                              </td>

                              {/* Rate unit-price field input */}
                              <td className="py-3 px-4 w-48 text-right">
                                <input 
                                  type="number" 
                                  required
                                  min="0.00"
                                  step="any"
                                  className="w-full text-[13px] border border-slate-200 hover:border-slate-350 focus:border-blue-500 bg-white px-2.5 py-1 text-right rounded-[3px] focus:outline-hidden font-mono text-slate-800"
                                  value={line.rate}
                                  onChange={(e) => handleLineChange(idx, 'rate', e.target.value)}
                                  placeholder="0.00"
                                />
                              </td>

                              {/* Calculated total row amount */}
                              <td className="py-3 px-6 w-40 text-right font-bold text-slate-800 font-mono">
                                ₹{totalLineAmount.toFixed(2)}
                              </td>

                              {/* Remove line items button */}
                              <td className="py-3 px-3 text-center">
                                <button 
                                  type="button"
                                  onClick={() => removeLineRow(idx)}
                                  className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Remove line"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Row Buttons and Actions below item list */}
                  <div className="flex gap-3 pt-1">
                    <button 
                      type="button"
                      onClick={addLineRow}
                      className="text-[#2485e8] hover:text-[#1a74d4] font-bold text-[13px] flex items-center gap-1 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-[4px] hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Add New Row
                    </button>
                    
                    <button 
                      type="button"
                      className="text-slate-650 hover:text-slate-805 font-semibold text-[13px] flex items-center gap-1 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-[4px] hover:bg-slate-100 transition-colors pointer-events-none select-none"
                    >
                      Add Items in Bulk
                    </button>
                  </div>

                  {/* SPLIT DESIGN BOTTOM SECTION: NOTES + TERMS (LEFT) VS MATH BREAKDOWN (RIGHT) (Matches screenshot 3) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6">
                    
                    {/* Left Column (Customer notes, terms and conditions, file attachments dropzone) */}
                    <div className="space-y-4">
                      
                      {/* Customer Notes */}
                      <div>
                        <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Customer Notes</label>
                        <textarea 
                          className="w-full text-[13px] border border-slate-250 bg-white rounded-[4px] p-2.5 h-20 focus:outline-hidden focus:border-blue-500 placeholder-slate-400"
                          placeholder="Enter any notes to be displayed in your transaction..."
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                        />
                      </div>

                      {/* Terms & Conditions */}
                      <div>
                        <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Terms & Conditions</label>
                        <textarea 
                          className="w-full text-[13px] border border-slate-250 bg-white rounded-[4px] p-2.5 h-20 focus:outline-hidden focus:border-blue-500 placeholder-slate-400"
                          placeholder="Enter the terms and conditions of your business to be displayed in your transaction..."
                          value={termsConditions}
                          onChange={(e) => setTermsConditions(e.target.value)}
                        />
                      </div>

                      {/* File uploads component Zone */}
                      <div>
                        <span className="block text-[12px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Attach File(s) to Sales Order</span>
                        <div className="border border-dashed border-slate-300 rounded-[5px] p-6 text-center hover:bg-slate-50/20 transition-all select-none cursor-pointer">
                          <div className="flex flex-col items-center justify-center">
                            <Download className="w-8 h-8 text-slate-350 mb-2 rotate-180" />
                            <span className="block text-[12px] text-slate-650 font-bold">Upload File</span>
                            <span className="block text-[11px] text-slate-405 mt-1">You can upload a maximum of 10 files, 5MB each</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Right Column (Math subtotals, taxes, discounts, adjustments matching screenshot layout exactly) */}
                    <div className="bg-slate-50/70 p-6 rounded-lg border border-slate-200">
                      <div className="space-y-4">
                        
                        {/* Sub Total */}
                        <div className="flex justify-between items-center text-slate-600 font-medium">
                          <span>Sub Total</span>
                          <span className="font-mono font-bold text-slate-800">₹{calculateSubtotal().toFixed(2)}</span>
                        </div>

                        {/* Discount Input Option */}
                        <div className="grid grid-cols-[100px_1fr_80px] gap-2 items-center">
                          <span className="text-slate-600 font-medium">Discount</span>
                          <input 
                            type="number"
                            min="0"
                            className="text-[13px] border border-slate-250 bg-white rounded-[3px] p-1 text-right focus:outline-hidden focus:border-blue-500 font-mono"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                          />
                          <select 
                            className="text-[12px] border border-slate-250 bg-white rounded-[3px] p-1 focus:outline-hidden"
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value)}
                          >
                            <option value="%">% Percent</option>
                            <option value="₹">₹ Direct</option>
                          </select>
                        </div>

                        {/* Tax TDS / TCS Radio Selector block */}
                        <div className="pt-1.5 border-t border-slate-150/80">
                          <div className="flex items-center gap-4 text-slate-600 font-semibold mb-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="radio" 
                                name="tax_category" 
                                checked={taxType === "TDS"}
                                onChange={() => setTaxType("TDS")}
                                className="text-blue-500 focus:ring-blue-500" 
                              /> 
                              <span>TDS Tax withholding</span>
                            </label>
                            
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="radio" 
                                name="tax_category" 
                                checked={taxType === "TCS"}
                                onChange={() => setTaxType("TCS")}
                                className="text-blue-500 focus:ring-blue-500" 
                              /> 
                              <span>TCS Tax collection</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                            <span className="text-[12px] text-slate-500 font-medium">Select Tax</span>
                            <select 
                              className="text-[13px] border border-slate-250 bg-white rounded-[3px] p-1.5 focus:outline-hidden"
                              value={selectedTaxRate}
                              onChange={(e) => setSelectedTaxRate(e.target.value)}
                            >
                              <option value="0">None (0%)</option>
                              <option value="0.05">GST 5% Tax rate</option>
                              <option value="0.12">GST 12% Tax rate</option>
                              <option value="0.18">GST 18% Tax rate</option>
                              <option value="0.28">GST 28% Luxury Tax rate</option>
                            </select>
                          </div>
                        </div>

                        {/* Adjustment input value */}
                        <div className="grid grid-cols-[100px_1fr] gap-2 items-center pt-2 border-t border-slate-150/80">
                          <span className="text-slate-600 font-medium flex items-center gap-1">
                            Adjustment <HelpIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5" title="Rounding off or minor manual fee adjustments" />
                          </span>
                          <input 
                            type="number"
                            className="text-[13px] border border-slate-250 bg-white rounded-[3px] p-1.5 text-right focus:outline-hidden focus:border-blue-500 font-mono"
                            value={adjustmentValue}
                            onChange={(e) => setAdjustmentValue(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        {/* Grand Total output (styled beautifully in big blue font Zoho layout) */}
                        <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center text-slate-800">
                          <span className="text-[15px] font-bold">Total ( ₹ )</span>
                          <span className="text-[20px] font-bold text-blue-650 font-mono">
                            ₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* STICKY ACCESSIBLE DIALOG ACTION ACTIONS ACTION FOOTER (MATCHING BOTTOM BAR EXACTLY) */}
                  <div className="border-t border-slate-200 pt-5 flex flex-wrap justify-between items-center gap-4 bg-white">
                    <div className="flex items-center gap-2">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-[3px] text-[13px] font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        {isSubmitting ? "Saving..." : "Save and Send"}
                      </button>

                      <button 
                        type="button"
                        onClick={(e) => {
                          handleSubmit(e, 'draft');
                        }}
                        disabled={isSubmitting}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-[3px] text-[13px] font-semibold transition-colors cursor-pointer"
                      >
                        Save as Draft
                      </button>

                      <button 
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-[3px] text-[13px] font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Bottom right totals */}
                    <div className="flex items-center gap-6 text-[13px] text-slate-600 font-semibold pr-4">
                      <span>Total Quantity: <b className="font-mono text-slate-900">{calculateTotalQty()}</b></span>
                      <span>Total Amount: <b className="font-mono text-[15px] text-slate-900">₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></span>
                    </div>
                  </div>

                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
