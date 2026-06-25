import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { 
  Plus, Search, Filter, ShoppingCart, Info, X, 
  Trash2, Eye, Calendar, User, Package, CreditCard, ClipboardCheck, AlertTriangle 
} from 'lucide-react';
import { formatINR } from '../../utils/format.js';

export function PurchasesList() {
  const { 
    purchaseOrders, 
    vendors, 
    items: products, 
    warehouses,
    addPurchaseOrder, 
    receivePO,
    fetchInitialData
  } = useInventoryStore();

  const [search, setSearch] = useState("");
  
  // Custom Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  // Create PO form state
  const [vendorId, setVendorId] = useState("");
  const [poNumber, setPoNumber] = useState(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [poItems, setPoItems] = useState<Array<{ productId: string; qtyOrdered: string; unitPrice: string }>>([]);
  const [createError, setCreateError] = useState("");

  // Receive items form state
  const [receiveWarehouseId, setReceiveWarehouseId] = useState("");
  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>({}); // productId -> qtyReceived
  const [receiveError, setReceiveError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getVendorName = (vid: string) => {
    const v = vendors.find(vendor => vendor.id === vid);
    return v ? v.name : "Bosch India Ltd";
  };

  const getProductName = (pid: number | string) => {
    const prod = products.find(p => String(p.id) === String(pid));
    return prod ? prod.name : `Product ID ${pid}`;
  };

  const filtered = purchaseOrders.filter(po => 
    po.po_number.toLowerCase().includes(search.toLowerCase()) || 
    getVendorName(po.vendor_id).toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'partially_received': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'received': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'billed': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // PO creation helpers
  const handleAddPOItemRow = () => {
    setPoItems([...poItems, { productId: "", qtyOrdered: "1", unitPrice: "0" }]);
  };

  const handleRemovePOItemRow = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handlePOItemChange = (index: number, key: string, value: string) => {
    const updated = [...poItems];
    updated[index] = { ...updated[index], [key]: value };
    setPoItems(updated);
  };

  const calcPOTotal = () => {
    return poItems.reduce((sum, row) => {
      const q = Number(row.qtyOrdered) || 0;
      const p = Number(row.unitPrice) || 0;
      return sum + (q * p);
    }, 0);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!vendorId || poItems.length === 0) {
      setCreateError("Please select a vendor and add at least one line item.");
      return;
    }

    // Verify row selections
    for (const item of poItems) {
      if (!item.productId || Number(item.qtyOrdered) <= 0 || Number(item.unitPrice) <= 0) {
        setCreateError("Each item row must have a valid selected product, quantity greater than 0, and cost price.");
        return;
      }
    }

    setIsSubmitting(true);
    const vendorObj = vendors.find(v => v.id === vendorId);
    
    await addPurchaseOrder({
      po_number: poNumber,
      vendor_id: vendorId,
      vendor_name: vendorObj?.name || 'General Vendor',
      order_date: orderDate,
      status: 'sent', // Autopromote to Sent for operational execution
      total: calcPOTotal(),
      items: poItems.map(pi => ({
        productId: Number(pi.productId),
        qtyOrdered: Number(pi.qtyOrdered),
        unitPrice: Number(pi.unitPrice)
      })) as any
    });

    setIsSubmitting(false);
    setShowCreateModal(false);
    setVendorId("");
    setPoNumber(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
    setPoItems([]);
  };

  // Goods receipt helper
  const handleOpenReceiveModal = (po: any) => {
    setSelectedPO(po);
    const initialQtys: Record<string, string> = {};
    if (po.items) {
      po.items.forEach((pi: any) => {
        const remaining = Math.max(0, pi.qtyOrdered - pi.qtyReceived);
        initialQtys[String(pi.productId)] = String(remaining);
      });
    }
    setReceivedQtys(initialQtys);
    setReceiveWarehouseId(warehouses[0]?.id || "");
    setReceiveError("");
    setShowReceiveModal(true);
    setShowDetailsModal(false);
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveError("");
    if (!receiveWarehouseId) {
      setReceiveError("Please choose a receiving warehouse location.");
      return;
    }

    const receiptLines = Object.entries(receivedQtys).map(([pId, qtyStr]) => ({
      product_id: Number(pId),
      qty_received: Number(qtyStr) || 0
    })).filter(line => line.qty_received > 0);

    if (receiptLines.length === 0) {
      setReceiveError("Please enter a positive value for at least one item to receive.");
      return;
    }

    setIsSubmitting(true);
    const success = await receivePO(selectedPO.id, receiveWarehouseId, receiptLines);
    setIsSubmitting(false);

    if (success) {
      setShowReceiveModal(false);
      setSelectedPO(null);
    } else {
      setReceiveError("Fail to log goods receipt in database.");
    }
  };

  return (
    <div className="p-6 space-y-6 flex-1 flex flex-col bg-[#f8fafc] text-slate-800 h-full overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-500" />
            Purchase Orders
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Procure spare parts, receive line items into warehouse locations, and audit order fulfillment.
          </p>
        </div>
        <button 
          onClick={() => {
            setCreateError("");
            setShowCreateModal(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      {/* Search toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input 
            type="text" 
            placeholder="Search PO # or Vendor..." 
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* PO table list */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-3xs flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8fafc] border-b border-slate-100 sticky top-0 z-10">
            <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="py-3 px-4">Order Date</th>
              <th className="py-3 px-4">PO Number</th>
              <th className="py-3 px-4">Vendor Name</th>
              <th className="py-3 px-4">Fulfillment Status</th>
              <th className="py-3 px-4 text-right">Order Total</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(po => (
              <tr key={po.id} className="text-xs hover:bg-slate-50/50 transition-colors group">
                <td className="py-3 px-4 text-slate-500 font-medium">{po.order_date}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{po.po_number}</td>
                <td className="py-3 px-4 font-semibold text-slate-700">{getVendorName(po.vendor_id)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(po.status)}`}>
                    {po.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                  {formatINR(po.total)}
                </td>
                <td className="py-3 px-4 text-center flex items-center justify-center gap-1.5">
                  <button 
                    onClick={() => {
                      setSelectedPO(po);
                      setShowDetailsModal(true);
                    }}
                    className="text-slate-500 hover:text-orange-500 p-1 rounded hover:bg-orange-50 cursor-pointer"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {po.status !== 'received' && po.status !== 'cancelled' && (
                    <button 
                      onClick={() => handleOpenReceiveModal(po)}
                      className="text-slate-500 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50 cursor-pointer"
                      title="Receive items"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                  <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No purchase orders found matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DIALOG 1: Create PO Form */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-orange-50/10">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-orange-500" /> Issue Purchase Order
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {createError && (
                  <div className="p-2 text-xs bg-red-50 text-red-600 rounded flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-4 h-4" /> {createError}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Vendor</label>
                    <select 
                      className="w-full text-xs border border-slate-200 p-2 rounded-md focus:outline-hidden focus:border-orange-500"
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                    >
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PO Number</label>
                    <input 
                      type="text" 
                      className="w-full text-xs border border-slate-200 p-2 rounded-md font-semibold text-slate-700 bg-slate-50"
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order Date</label>
                    <input 
                      type="date" 
                      className="w-full text-xs border border-slate-200 p-2 rounded-md focus:outline-hidden focus:border-orange-500"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-orange-500" /> Line Items
                    </span>
                    <button 
                      type="button" 
                      onClick={handleAddPOItemRow}
                      className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:text-orange-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>

                  <div className="space-y-2 mt-3">
                    {poItems.map((row, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <div className="col-span-5 space-y-0.5">
                          <select 
                            className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-hidden bg-white"
                            value={row.productId}
                            onChange={(e) => handlePOItemChange(index, 'productId', e.target.value)}
                          >
                            <option value="">-- Product --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3 space-y-0.5">
                          <input 
                            type="number" 
                            placeholder="Qty"
                            className="w-full text-xs border border-slate-200 rounded p-1.5 text-center bg-white"
                            value={row.qtyOrdered}
                            onChange={(e) => handlePOItemChange(index, 'qtyOrdered', e.target.value)}
                            min="1"
                          />
                        </div>
                        <div className="col-span-3 space-y-0.5">
                          <input 
                            type="number" 
                            placeholder="Cost Price"
                            className="w-full text-xs border border-slate-200 rounded p-1.5 text-right bg-white"
                            value={row.unitPrice}
                            onChange={(e) => handlePOItemChange(index, 'unitPrice', e.target.value)}
                            min="0"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemovePOItemRow(index)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {poItems.length === 0 && (
                      <p className="text-[11px] text-center text-slate-400 py-6 italic">No line items added yet. Click 'Add Row'.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer block */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">PO Total Amount</span>
                  <span className="text-lg font-extrabold text-slate-900">{formatINR(calcPOTotal())}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-700 bg-white rounded-md hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 font-bold text-xs text-white rounded-md shadow-xs"
                  >
                    {isSubmitting ? "Generating..." : "Generate Order"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: View PO Details Modal */}
      {showDetailsModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Purchase Order Details</h3>
                <span className="text-[10px] font-mono font-bold text-slate-500">{selectedPO.po_number}</span>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wide">Vendor Partner</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {getVendorName(selectedPO.vendor_id)}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wide">Issued Date</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {selectedPO.order_date}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wide">Line Items & Fulfillment Status</span>
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f8fafc] border-b border-slate-100">
                      <tr className="text-[10px] uppercase text-slate-400 font-bold">
                        <th className="p-2">Product Name</th>
                        <th className="p-2 text-center">Ordered</th>
                        <th className="p-2 text-center">Received</th>
                        <th className="p-2 text-right">Unit cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedPO.items?.map((item: any) => (
                        <tr key={item.id} className="text-[11px]">
                          <td className="p-2 font-bold text-slate-800">{getProductName(item.productId)}</td>
                          <td className="p-2 text-center font-semibold text-slate-600">{item.qtyOrdered}</td>
                          <td className="p-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${Number(item.qtyReceived) >= Number(item.qtyOrdered) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                              {item.qtyReceived}
                            </span>
                          </td>
                          <td className="p-2 text-right font-medium text-emerald-600">{formatINR(item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Val</span>
                <span className="text-base font-extrabold text-slate-900">{formatINR(selectedPO.total)}</span>
              </div>
              <div className="flex gap-2">
                {selectedPO.status !== 'received' && selectedPO.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleOpenReceiveModal(selectedPO)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center gap-1"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" /> Receive Goods
                  </button>
                )}
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 bg-white font-bold text-xs rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 3: Goods Receipt Form */}
      {showReceiveModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/15">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-emerald-600" /> Log Goods Receipt (Receipt Advice)
                </h3>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">Allocated against: {selectedPO.po_number}</span>
              </div>
              <button onClick={() => setShowReceiveModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="p-4 space-y-4">
              {receiveError && (
                <div className="p-2 text-xs bg-red-50 text-red-600 rounded flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> {receiveError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Dest Warehouse (Loc)</label>
                <select 
                  className="w-full text-xs border border-slate-200 p-2 rounded-md focus:outline-hidden focus:border-emerald-500 bg-white"
                  value={receiveWarehouseId}
                  onChange={(e) => setReceiveWarehouseId(e.target.value)}
                >
                  <option value="">-- Choose Warehouse Location --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Qtys to Receive</label>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {selectedPO.items?.map((item: any) => {
                    const remaining = Math.max(0, item.qtyOrdered - item.qtyReceived);
                    
                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="col-span-7">
                          <span className="text-xs font-bold text-slate-800 block leading-tight">{getProductName(item.productId)}</span>
                          <span className="text-[10px] text-slate-500 font-semibold block leading-none mt-0.5">
                            Ordered: {item.qtyOrdered} | Received: {item.qtyReceived}
                          </span>
                        </div>
                        <div className="col-span-5 flex items-center gap-1">
                          <input 
                            type="number" 
                            className="w-full text-xs text-center border border-slate-200 bg-white p-1 rounded font-bold"
                            value={receivedQtys[String(item.productId)] || ""}
                            onChange={(e) => setReceivedQtys({
                              ...receivedQtys,
                              [String(item.productId)]: e.target.value
                            })}
                            placeholder="0"
                            min="0"
                            max={String(remaining)}
                          />
                          <span className="text-[9px] font-semibold text-slate-400">units</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowReceiveModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 bg-white font-bold text-xs rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-xs"
                >
                  {isSubmitting ? "Processing..." : "Complete Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
