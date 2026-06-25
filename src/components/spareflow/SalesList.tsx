import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { 
  Plus, Search, Filter, ShoppingBag, Info, X, 
  Trash2, Eye, Calendar, User, Package, CreditCard, Ship, AlertTriangle 
} from 'lucide-react';
import { formatINR } from '../../utils/format.js';

export function SalesList() {
  const { 
    salesOrders, 
    customers, 
    items: products, 
    warehouses,
    locationInventory,
    addSalesOrder, 
    shipSO,
    fetchInitialData
  } = useInventoryStore();

  const [search, setSearch] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [selectedSO, setSelectedSO] = useState<any>(null);

  // Form: Create SO state
  const [customerId, setCustomerId] = useState("");
  const [soNumber, setSoNumber] = useState(`SO-${Math.floor(2000 + Math.random() * 8000)}`);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [soItems, setSoItems] = useState<Array<{ productId: string; qtyOrdered: string; unitPrice: string }>>([]);
  const [createError, setCreateError] = useState("");

  // Form: Ship items state
  const [shipWarehouseId, setShipWarehouseId] = useState("");
  const [shippedQtys, setShippedQtys] = useState<Record<string, string>>({}); // productId -> qtyShipped
  const [shipError, setShipError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCustomerName = (cid: string) => {
    const c = customers.find(cust => cust.id === cid);
    return c ? c.name : "ABC Motors";
  };

  const getProductName = (pid: number | string) => {
    const prod = products.find(p => String(p.id) === String(pid));
    return prod ? prod.name : `Product ID ${pid}`;
  };

  const filtered = salesOrders.filter(so => 
    so.so_number.toLowerCase().includes(search.toLowerCase()) || 
    getCustomerName(so.customer_id).toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'packed': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'shipped': return 'bg-[#eef2ff] text-[#4f46e5] border-[#c7d2fe]';
      case 'invoiced': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // SO item creators help
  const handleAddSOItemRow = () => {
    setSoItems([...soItems, { productId: "", qtyOrdered: "1", unitPrice: "0" }]);
  };

  const handleRemoveSOItemRow = (index: number) => {
    setSoItems(soItems.filter((_, i) => i !== index));
  };

  const handleSOItemChange = (index: number, key: string, value: string) => {
    const updated = [...soItems];
    updated[index] = { ...updated[index], [key]: value };
    
    // Automatically match the pricing tier if productId was updated
    if (key === 'productId') {
      const selectedProd = products.find(p => String(p.id) === String(value));
      if (selectedProd) {
        updated[index].unitPrice = String(selectedProd.sales_price || 0);
      }
    }
    setSoItems(updated);
  };

  const calcSOTotal = () => {
    return soItems.reduce((sum, row) => {
      const q = Number(row.qtyOrdered) || 0;
      const p = Number(row.unitPrice) || 0;
      return sum + (q * p);
    }, 0);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!customerId || soItems.length === 0) {
      setCreateError("Please select a customer and append at least one item row.");
      return;
    }

    for (const row of soItems) {
      if (!row.productId || Number(row.qtyOrdered) <= 0 || Number(row.unitPrice) <= 0) {
        setCreateError("Please fill out complete fields for each product row with positive quantity and price.");
        return;
      }
    }

    setIsSubmitting(true);
    const custObj = customers.find(c => c.id === customerId);

    await addSalesOrder({
      so_number: soNumber,
      customer_id: customerId,
      customer_name: custObj?.name || 'General Customer',
      order_date: orderDate,
      status: 'confirmed', // Confirmed order
      total: calcSOTotal(),
      items: soItems.map(si => ({
        productId: Number(si.productId),
        qtyOrdered: Number(si.qtyOrdered),
        unitPrice: Number(si.unitPrice)
      })) as any
    });

    setIsSubmitting(false);
    setShowCreateModal(false);
    setCustomerId("");
    setSoNumber(`SO-${Math.floor(2000 + Math.random() * 8000)}`);
    setSoItems([]);
  };

  // Shipments handlers
  const handleOpenShipModal = (so: any) => {
    setSelectedSO(so);
    const initialQtys: Record<string, string> = {};
    if (so.items) {
      so.items.forEach((si: any) => {
        const remaining = Math.max(0, si.qtyOrdered - si.qtyShipped);
        initialQtys[String(si.productId)] = String(remaining);
      });
    }
    setShippedQtys(initialQtys);
    setShipWarehouseId(warehouses[0]?.id || "");
    setShipError("");
    setShowShipModal(true);
    setShowDetailsModal(false);
  };

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShipError("");
    if (!shipWarehouseId) {
      setShipError("Please choose a source dispatch warehouse location.");
      return;
    }

    const shipLines = Object.entries(shippedQtys).map(([pId, qtyStr]) => ({
      product_id: Number(pId),
      qty_shipped: Number(qtyStr) || 0
    })).filter(line => line.qty_shipped > 0);

    if (shipLines.length === 0) {
      setShipError("Please input a positive dispatch count for at least one item.");
      return;
    }

    // Verify stock availability at selected source warehouse first to flag shortfalls
    for (const line of shipLines) {
      const warehouseStock = locationInventory.find(li => 
        String(li.productId) === String(line.product_id) && 
        String(li.warehouseId) === String(shipWarehouseId)
      );
      const available = warehouseStock ? warehouseStock.qtyOnHand : 0;
      if (available < line.qty_shipped) {
        setShipError(`Fulfillment Halt: Item ${getProductName(line.product_id)} only has ${available} stock at source warehouse.`);
        return;
      }
    }

    setIsSubmitting(true);
    const success = await shipSO(selectedSO.id, shipWarehouseId, shipLines);
    setIsSubmitting(false);

    if (success) {
      setShowShipModal(false);
      setSelectedSO(null);
    } else {
      setShipError("Failed to issue parts. Backend update discarded.");
    }
  };

  return (
    <div className="p-6 space-y-6 flex-1 flex flex-col bg-[#f8fafc] text-slate-800 h-full overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-sky-500" />
            Sales Orders
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Track customer orders, confirm transactions, and dispatch orders from physical warehouse locations.
          </p>
        </div>
        <button 
          onClick={() => {
            setCreateError("");
            setShowCreateModal(true);
          }}
          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Toolbar Search */}
      <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input 
            type="text" 
            placeholder="Search SO # or Customer Name..." 
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-3xs flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8fafc] border-b border-slate-100 sticky top-0 z-10">
            <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="py-3 px-4">Order Date</th>
              <th className="py-3 px-4">SO Number</th>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Dispatch Status</th>
              <th className="py-3 px-4 text-right">Order Total</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(so => (
              <tr key={so.id} className="text-xs hover:bg-slate-50/50 transition-colors group">
                <td className="py-3 px-4 text-slate-500 font-medium">{so.order_date}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{so.so_number}</td>
                <td className="py-3 px-4 font-semibold text-slate-700">{getCustomerName(so.customer_id)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(so.status)}`}>
                    {so.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                  {formatINR(so.total)}
                </td>
                <td className="py-3 px-4 text-center flex items-center justify-center gap-1.5">
                  <button 
                    onClick={() => {
                      setSelectedSO(so);
                      setShowDetailsModal(true);
                    }}
                    className="text-slate-500 hover:text-sky-600 p-1 rounded hover:bg-sky-50 cursor-pointer"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {so.status !== 'shipped' && so.status !== 'cancelled' && (
                    <button 
                      onClick={() => handleOpenShipModal(so)}
                      className="text-slate-500 hover:text-[#4f46e5] p-1 rounded hover:bg-[#eef2ff] cursor-pointer"
                      title="Ship items / Issue Stock"
                    >
                      <Ship className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                  <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No sales orders found matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DIALOG 1: Create Sales Order */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/10">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-sky-500" /> Issue Sales Order
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Customer</label>
                    <select 
                      className="w-full text-xs border border-slate-200 p-2 rounded-md focus:outline-hidden focus:border-sky-500"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SO Number</label>
                    <input 
                      type="text" 
                      className="w-full text-xs border border-slate-200 p-2 rounded-md font-semibold text-slate-700 bg-slate-50"
                      value={soNumber}
                      onChange={(e) => setSoNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order Date</label>
                    <input 
                      type="date" 
                      className="w-full text-xs border border-slate-200 p-2 rounded-md focus:outline-hidden focus:border-sky-500"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-sky-500" /> Selected baskets
                    </span>
                    <button 
                      type="button" 
                      onClick={handleAddSOItemRow}
                      className="text-xs font-bold text-sky-600 flex items-center gap-1 hover:text-sky-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>

                  <div className="space-y-2 mt-3">
                    {soItems.map((row, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <div className="col-span-5 space-y-0.5">
                          <select 
                            className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-hidden bg-white"
                            value={row.productId}
                            onChange={(e) => handleSOItemChange(index, 'productId', e.target.value)}
                          >
                            <option value="">-- Choose Product --</option>
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
                            onChange={(e) => handleSOItemChange(index, 'qtyOrdered', e.target.value)}
                            min="1"
                          />
                        </div>
                        <div className="col-span-3 space-y-0.5">
                          <input 
                            type="number" 
                            placeholder="Selling Price"
                            className="w-full text-xs border border-slate-200 rounded p-1.5 text-right bg-white"
                            value={row.unitPrice}
                            onChange={(e) => handleSOItemChange(index, 'unitPrice', e.target.value)}
                            min="0"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSOItemRow(index)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {soItems.length === 0 && (
                      <p className="text-[11px] text-center text-slate-400 py-6 italic">No line items added yet. Click 'Add Row'.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer block */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">SO Valuation Sum</span>
                  <span className="text-lg font-extrabold text-[#4f46e5]">{formatINR(calcSOTotal())}</span>
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
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 font-bold text-xs text-white rounded-md shadow-xs animate-pulse-once"
                  >
                    {isSubmitting ? "Generating..." : "Confirm Order"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: View SO Details */}
      {showDetailsModal && selectedSO && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Sales Order Details</h3>
                <span className="text-[10px] font-mono font-bold text-slate-500">{selectedSO.so_number}</span>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wide">Client Profile</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {getCustomerName(selectedSO.customer_id)}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wide">Sales Booking Date</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {selectedSO.order_date}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wide">Dispatch Checklist</span>
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f8fafc] border-b border-slate-100">
                      <tr className="text-[10px] uppercase text-slate-400 font-bold">
                        <th className="p-2">Item details</th>
                        <th className="p-2 text-center">Ordered</th>
                        <th className="p-2 text-center">Shipped</th>
                        <th className="p-2 text-right">Selling Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedSO.items?.map((item: any) => (
                        <tr key={item.id} className="text-[11px]">
                          <td className="p-2 font-bold text-slate-800">{getProductName(item.productId)}</td>
                          <td className="p-2 text-center font-semibold text-slate-600">{item.qtyOrdered}</td>
                          <td className="p-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${Number(item.qtyShipped) >= Number(item.qtyOrdered) ? 'bg-[#eef2ff] text-[#4f46e5]' : 'bg-amber-50 text-amber-600'}`}>
                              {item.qtyShipped}
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
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total amount booked</span>
                <span className="text-base font-extrabold text-slate-900">{formatINR(selectedSO.total)}</span>
              </div>
              <div className="flex gap-2">
                {selectedSO.status !== 'shipped' && selectedSO.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleOpenShipModal(selectedSO)}
                    className="px-3 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-md shadow-xs flex items-center gap-1"
                  >
                    <Ship className="w-3.5 h-3.5" /> Pick & Ship
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

      {/* DIALOG 3: Goods Issue / Ship Form */}
      {showShipModal && selectedSO && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/15">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-[#4f46e5]" /> Dispatch Goods / Pick Note
                </h3>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">Under Sales Contract: {selectedSO.so_number}</span>
              </div>
              <button onClick={() => setShowShipModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleShipSubmit} className="p-4 space-y-4">
              {shipError && (
                <div className="p-2 text-xs bg-red-50 text-red-600 rounded flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> {shipError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Source Warehouse</label>
                <select 
                  className="w-full text-xs border border-slate-200 p-2 rounded-md focus:outline-hidden focus:border-indigo-500 bg-white"
                  value={shipWarehouseId}
                  onChange={(e) => setShipWarehouseId(e.target.value)}
                >
                  <option value="">-- Choose Picking Location --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Qtys to Issue & Ship</label>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {selectedSO.items?.map((item: any) => {
                    const remaining = Math.max(0, item.qtyOrdered - item.qtyShipped);
                    
                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="col-span-7">
                          <span className="text-xs font-bold text-slate-800 block leading-tight">{getProductName(item.productId)}</span>
                          <span className="text-[10px] text-slate-500 font-semibold block leading-none mt-0.5">
                            Ordered: {item.qtyOrdered} | Dispatched: {item.qtyShipped}
                          </span>
                        </div>
                        <div className="col-span-5 flex items-center gap-1">
                          <input 
                            type="number" 
                            className="w-full text-xs text-center border border-slate-200 bg-white p-1 rounded font-bold"
                            value={shippedQtys[String(item.productId)] || ""}
                            onChange={(e) => setShippedQtys({
                              ...shippedQtys,
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
                  onClick={() => setShowShipModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 bg-white font-bold text-xs rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-md shadow-xs"
                >
                  {isSubmitting ? "Dispatching..." : "Process Shipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
