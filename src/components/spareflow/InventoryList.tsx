import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { 
  Plus, Search, Warehouse, PackageOpen, ArrowRightLeft, 
  X, Calendar, ClipboardList, Info, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw 
} from 'lucide-react';
import { formatINR } from '../../utils/format.js';

export function InventoryList() {
  const { 
    items, 
    warehouses, 
    stockMovements, 
    locationInventory, 
    adjustStock, 
    transferStock,
    fetchInitialData 
  } = useInventoryStore();

  const [search, setSearch] = useState("");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Forms states
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustWarehouseId, setAdjustWarehouseId] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustError, setAdjustError] = useState("");

  const [transferProductId, setTransferProductId] = useState("");
  const [transferFromWhId, setTransferFromWhId] = useState("");
  const [transferToWhId, setTransferToWhId] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [transferError, setTransferError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError("");
    if (!adjustProductId || !adjustWarehouseId || !adjustQty) {
      setAdjustError("All fields are required.");
      return;
    }
    const qtyNum = Number(adjustQty);
    if (isNaN(qtyNum) || qtyNum === 0) {
      setAdjustError("Please enter a valid non-zero quantity.");
      return;
    }

    setIsSubmitting(true);
    const success = await adjustStock(adjustProductId, adjustWarehouseId, qtyNum, adjustNotes);
    setIsSubmitting(false);

    if (success) {
      setShowAdjustModal(false);
      // Reset
      setAdjustProductId("");
      setAdjustWarehouseId("");
      setAdjustQty("");
      setAdjustNotes("");
    } else {
      setAdjustError("Failed to apply stock adjustment on backend.");
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError("");
    if (!transferProductId || !transferFromWhId || !transferToWhId || !transferQty) {
      setTransferError("All fields are required.");
      return;
    }
    if (transferFromWhId === transferToWhId) {
      setTransferError("Source and Destination warehouses must be different.");
      return;
    }
    const qtyNum = Number(transferQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setTransferError("Please enter a positive transfer quantity.");
      return;
    }

    // Check available source inventory
    const sourceInv = locationInventory.find(li => 
      String(li.productId) === transferProductId && 
      String(li.warehouseId) === transferFromWhId
    );
    const available = sourceInv ? sourceInv.qtyOnHand : 0;
    if (available < qtyNum) {
      setTransferError(`Insufficient stock at source warehouse. Available: ${available}`);
      return;
    }

    setIsSubmitting(true);
    const success = await transferStock(transferProductId, transferFromWhId, transferToWhId, qtyNum, transferNotes);
    setIsSubmitting(false);

    if (success) {
      setShowTransferModal(false);
      setTransferProductId("");
      setTransferFromWhId("");
      setTransferToWhId("");
      setTransferQty("");
      setTransferNotes("");
    } else {
      setTransferError("Failed to process transaction transfer.");
    }
  };

  const getWarehouseName = (id: number | string) => {
    const wh = warehouses.find(w => String(w.id) === String(id));
    return wh ? wh.name : `Warehouse ID ${id}`;
  };

  const getProductName = (id: number | string) => {
    const prod = items.find(i => String(i.id) === String(id));
    return prod ? prod.name : `Item ID ${id}`;
  };

  return (
    <div className="p-6 space-y-6 flex-1 flex flex-col bg-[#f8fafc] text-slate-800 h-full overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-900 flex items-center gap-2">
            <PackageOpen className="w-6 h-6 text-teal-600" />
            Stock Adjustments & Transfers
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Conduct manual adjustments, request multi-warehouse transfers, and inspect precise stock movement logs.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => {
              setTransferError("");
              setShowTransferModal(true);
            }}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-500" /> Transfer Stock
          </button>
          <button 
            type="button"
            onClick={() => {
              setAdjustError("");
              setShowAdjustModal(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Adjust Stock
          </button>
          <button 
            type="button"
            onClick={() => fetchInitialData()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg shadow-xs transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Stock Balances + Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Product Stock Levels by Warehouse (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-teal-600" />
                Physical Stock by Location
              </h3>
              <div className="relative max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search item..." 
                  className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-teal-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#f8fafc] border-b border-slate-100">
                  <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-3">Item details</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-right">Available stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(item => {
                    const warehouseStocks = locationInventory.filter(li => String(li.productId) === String(item.id));
                    
                    return (
                      <React.Fragment key={item.id}>
                        <tr className="bg-slate-50/20 font-bold text-slate-900">
                          <td className="p-3" colSpan={2}>
                            {item.name} 
                            <span className="ml-2 font-mono font-normal text-slate-400 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.sku}
                            </span>
                          </td>
                          <td className="p-3 text-right text-emerald-700 font-extrabold bg-emerald-50/10">
                            Total: {item.qty_on_hand} {item.unit}
                          </td>
                        </tr>
                        {warehouseStocks.length > 0 ? (
                          warehouseStocks.map(stock => (
                            <tr key={stock.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-2 pl-6 text-slate-400">—</td>
                              <td className="p-2 text-slate-600 font-medium">
                                {getWarehouseName(stock.warehouseId)}
                              </td>
                              <td className="p-2 text-right font-semibold text-slate-700">
                                {stock.qtyOnHand} {item.unit}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="p-2 pl-6 text-slate-400 font-medium text-[11px]" colSpan={3}>
                              No physical stock matches at any warehouse location.
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-400 font-medium">
                        No products found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Stock Movement Audit Trail Log (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-4 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              Comprehensive Audit Trail
            </h3>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {stockMovements.map(mov => {
                const isPositive = mov.qty > 0;
                let badgeClass = "bg-amber-50 text-amber-700";
                let typeLabel = mov.movementType;

                if (mov.movementType === "purchase_receipt") {
                  badgeClass = "bg-emerald-50 text-emerald-700";
                  typeLabel = "Goods Receipt";
                } else if (mov.movementType === "sale_shipment") {
                  badgeClass = "bg-rose-50 text-rose-700";
                  typeLabel = "Shipment Out";
                } else if (mov.movementType === "stock_adjustment") {
                  badgeClass = "bg-blue-50 text-blue-700";
                  typeLabel = "Manual count";
                } else if (mov.movementType.includes("transfer")) {
                  badgeClass = "bg-indigo-50 text-indigo-700";
                  typeLabel = "Wh transfer";
                }

                return (
                  <div key={mov.id} className="p-3 border border-slate-50 rounded-lg hover:border-slate-100 transition-all text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${badgeClass}`}>
                        {typeLabel.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-800">
                      {getProductName(mov.productId)}
                    </div>

                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>Loc: {getWarehouseName(mov.warehouseId)}</span>
                      <span className={`font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isPositive ? '+' : ''}{mov.qty}
                      </span>
                    </div>

                    {mov.referenceId && (
                      <div className="text-[10px] font-mono text-slate-400">
                        Ref: {mov.referenceId} ({mov.referenceType})
                      </div>
                    )}

                    {mov.notes && (
                      <div className="text-[10px] italic text-slate-400 border-t border-slate-50 pt-1 mt-1">
                        "{mov.notes}"
                      </div>
                    )}
                  </div>
                );
              })}

              {stockMovements.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No stock transactions logged yet. Perform adjustments or process orders to build history.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Adjust Stock */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-teal-50/10">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <PackageOpen className="w-4 h-4 text-teal-600" /> Manual Stock Adjustment
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAdjustSubmit} className="p-4 space-y-4">
              {adjustError && (
                <div className="p-2 text-xs bg-red-50 text-red-600 rounded flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> {adjustError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Product</label>
                <select 
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-teal-500"
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                >
                  <option value="">-- Choose Product --</option>
                  {items.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Warehouse</label>
                <select 
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-teal-500"
                  value={adjustWarehouseId}
                  onChange={(e) => setAdjustWarehouseId(e.target.value)}
                >
                  <option value="">-- Choose Target Location --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quantity Change (Delta)</label>
                <input 
                  type="text" 
                  placeholder="e.g. +15 or -10"
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-teal-500 font-semibold"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                />
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium leading-none">
                  Input POSITIVE quantity to add stock, NEGATIVE to subtract count.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remarks / Notes</label>
                <textarea 
                  placeholder="Reason for adjustment (e.g. Cycle Count variance, damaged stock)"
                  className="w-full text-xs border border-slate-200 rounded-md p-2 h-16 focus:outline-hidden focus:border-teal-500"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold"
                >
                  {isSubmitting ? "Saving..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Transfer Stock */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/10">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> Internal Warehouse Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-4 space-y-4">
              {transferError && (
                <div className="p-2 text-xs bg-red-50 text-red-600 rounded flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> {transferError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Product</label>
                <select 
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-indigo-500"
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                >
                  <option value="">-- Choose Product --</option>
                  {items.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source location</label>
                  <select 
                    className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-indigo-500"
                    value={transferFromWhId}
                    onChange={(e) => setTransferFromWhId(e.target.value)}
                  >
                    <option value="">-- From --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dest location</label>
                  <select 
                    className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-indigo-500"
                    value={transferToWhId}
                    onChange={(e) => setTransferToWhId(e.target.value)}
                  >
                    <option value="">-- To --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quantity to Transfer</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5"
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-indigo-500 font-semibold"
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  min="1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remarks / Notes</label>
                <textarea 
                  placeholder="Reason for transfer (e.g. stock level balancing, fulfillment request)"
                  className="w-full text-xs border border-slate-200 rounded-md p-2 h-16 focus:outline-hidden focus:border-indigo-500"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold"
                >
                  {isSubmitting ? "Processing..." : "Process Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
