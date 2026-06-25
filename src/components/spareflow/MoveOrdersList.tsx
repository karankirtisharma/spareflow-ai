import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, 
  ChevronDown, Send, FileText, CheckCircle, Clock, Trash2, 
  X, AlertCircle, FileDown, Search, ArrowRight, User, 
  Calendar, Clipboard, HelpCircle as HelpIcon, Layers, Info, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function MoveOrdersList() {
  const { 
    moveOrders, 
    items: inventoryItems, 
    warehouses, 
    addMoveOrder, 
    fetchMoveOrders,
    isLoading 
  } = useInventoryStore();

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [moNumber, setMoNumber] = useState("");
  const [date, setDate] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [notes, setNotes] = useState("");

  // Move Order Line Items State
  // Initialized with one empty row
  const [lineItems, setLineItems] = useState<{ productId: string; qty: string }[]>([
    { productId: '', qty: '1.00' }
  ]);

  // Set default code and current date when modal opens
  const openModal = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setMoNumber(`MO-${randomSuffix}`);
    
    const today = new Date().toISOString().split('T')[0];
    setDate(today);

    // Default to first warehouse
    if (warehouses && warehouses.length > 0) {
      setWarehouseId(warehouses[0].id);
    } else {
      setWarehouseId("");
    }
    setAssignee("Pradeep Kumar");
    setNotes("");
    setLineItems([{ productId: '', qty: '1.00' }]);
    setFormError("");
    setShowCreateModal(true);
  };

  const addLineRow = () => {
    setLineItems(prev => [...prev, { productId: '', qty: '1.00' }]);
  };

  const removeLineRow = (idx: number) => {
    if (lineItems.length === 1) {
      setLineItems([{ productId: '', qty: '1.00' }]);
    } else {
      setLineItems(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleLineChange = (idx: number, field: 'productId' | 'qty', value: string) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Submit Move Order to Store & Backend
  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'completed') => {
    e.preventDefault();
    setFormError("");

    if (!moNumber.trim()) {
      setFormError("Move Order number is required.");
      return;
    }

    if (!warehouseId) {
      setFormError("Please select a source warehouse.");
      return;
    }

    // Validate and clean up line items
    const validLines = lineItems.filter(li => li.productId && Number(li.qty) > 0);
    if (validLines.length === 0) {
      setFormError("Please select at least one valid item and supply a transfer quantity.");
      return;
    }

    const selectedWh = warehouses.find(w => w.id === warehouseId);
    
    setIsSubmitting(true);
    try {
      const payloadItems = validLines.map(vl => ({
        productId: Number(vl.productId),
        qty: Number(vl.qty),
      }));

      await addMoveOrder({
        mo_number: moNumber.trim(),
        date: date,
        warehouse_id: Number(warehouseId),
        warehouse_name: selectedWh ? selectedWh.name : "General Warehouse",
        assignee: assignee || "Unassigned",
        notes: notes || "",
        status: status,
        items: payloadItems as any
      });

      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to create Move Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search filter
  const filteredOrders = moveOrders.filter(mo => {
    const term = search.toLowerCase();
    return (
      mo.mo_number.toLowerCase().includes(term) ||
      (mo.assignee && mo.assignee.toLowerCase().includes(term)) ||
      (mo.warehouse_name && mo.warehouse_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative font-sans antialiased">
      {/* Top Header bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer group">
            <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              All Move Orders <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5" />
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lookup Input */}
          <div className="relative mr-2 hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Search Move Orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-[4px] text-[13px] bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500 w-56 transition-all"
            />
          </div>

          <button 
            onClick={openModal}
            className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3px]" /> New
          </button>

          <div className="h-5 w-px bg-slate-300 mx-1.5"></div>

          <button className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="Settings">
            <Settings className="w-[17px] h-[17px]" />
          </button>

          <button className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="Filters">
            <ListFilter className="w-[17px] h-[17px]" />
          </button>

          <button className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="More">
            <MoreHorizontal className="w-[17px] h-[17px]" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          <button className="text-[#2485e8] p-1.5 hover:bg-blue-50 rounded-md transition-colors" title="Help Guide">
            <HelpIcon className="w-[17px] h-[17px]" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span>Total Move Orders: <b>{moveOrders.length}</b></span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>Draft: <b>{moveOrders.filter(m => m.status === 'draft').length}</b></span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Completed Relocations: <b>{moveOrders.filter(m => m.status === 'completed').length}</b></span>
        </div>
        <div>
          <button onClick={() => fetchMoveOrders()} className="hover:text-blue-600 transition-colors">
            Sync Move Logs
          </button>
        </div>
      </div>

      {/* Main empty screen vs Table switcher */}
      {moveOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
          <div className="w-full max-w-xl text-center flex flex-col items-center">
            
            {/* Shelf/Relocate visual SVG */}
            <div className="relative mb-6 select-none transition-transform hover:scale-103 duration-300">
              <svg className="w-56 h-56 mx-auto text-slate-300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="100" cy="155" rx="75" ry="22" fill="#e2e8f0" opacity="0.4" />
                <ellipse cx="100" cy="155" rx="55" ry="15" fill="#cbd5e1" opacity="0.3" />

                {/* Warehouse Rack elements */}
                <rect x="52" y="30" width="8" height="135" rx="3" fill="#cbd5e1" />
                <rect x="140" y="30" width="8" height="135" rx="3" fill="#cbd5e1" />
                <rect x="35" y="75" width="130" height="7" rx="1.5" fill="#94a3b8" />
                <rect x="35" y="120" width="130" height="7" rx="1.5" fill="#94a3b8" />

                {/* Relocating Box Animation effect (Path pointing from left to right) */}
                <path d="M 68,95 Q 100,60 132,95" stroke="#2485e8" strokeWidth="2.5" strokeDasharray="5 4" fill="none" />
                {/* Arrowhead */}
                <polygon points="130,95 135,95 132,90" fill="#2485e8" />

                {/* Box 1 (Source) */}
                <rect x="58" y="98" width="16" height="16" rx="2" fill="#93c5fd" stroke="#3b82f6" />
                <line x1="58" y1="106" x2="74" y2="106" stroke="#3b82f6" />

                {/* Box 2 (Relocated Destination) */}
                <rect x="126" y="98" width="16" height="16" rx="2" fill="#bbf7d0" stroke="#22c55e" opacity="0.8" />
                <line x1="126" y1="106" x2="142" y2="106" stroke="#22c55e" opacity="0.8" />
              </svg>
            </div>

            <h3 className="text-[18px] font-bold text-slate-800 tracking-tight mb-2">
              Organize Your Inventory Efficiently
            </h3>
            <p className="text-[13px] text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
              Create move orders to relocate item within the same warehouse.
            </p>
            
            <button 
              onClick={openModal}
              className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-5 py-2.5 rounded text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:translate-y-[-1px]"
            >
              CREATE MOVE ORDER
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#f8fafc] border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-[12px] text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-6 w-10 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="py-3 px-6">Move Order#</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Warehouse</th>
                <th className="py-3 px-6">Assignee</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-right">Items Count</th>
                <th className="py-3 px-6">Internal Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredOrders.map(order => {
                const totalQty = order.items ? order.items.reduce((sum, i) => sum + i.qty, 0) : 0;
                return (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                    <td className="py-3.5 px-6 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-blue-600 hover:underline">
                      {order.mo_number}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {order.date}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 font-medium">
                      {order.warehouse_name || "Primary Warehouse"}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {order.assignee}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                        order.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {order.status === 'completed' ? (
                          <>
                            <Check className="w-3 h-3 stroke-[2.5]" /> Completed
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 stroke-[2.5]" /> Draft
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-semibold text-slate-800 pr-12">
                      {order.items ? order.items.length : 0} items ({totalQty} units)
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 max-w-xs truncate" title={order.notes || ''}>
                      {order.notes || <span className="italic text-slate-300 font-light">No notes</span>}
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching move orders found for "<b>{search}</b>".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* COMPREHENSIVE NEW MOVE ORDER MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-[#1e2229]/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-md shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col my-8 border border-slate-300 max-h-[92vh]"
            >
              
              {/* Modal Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <span className="text-[17px] font-bold text-slate-800">New Move Order</span>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto bg-[#fafbfc] p-6 lg:p-8">
                
                {formError && (
                  <div className="mb-6 p-3 text-[13px] bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> 
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={(e) => handleSubmit(e, 'completed')} className="space-y-6 text-[13px]">
                  
                  {/* Two Column Layout for Profile Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-md border border-slate-200 shadow-3xs">
                    
                    {/* Left fields */}
                    <div className="space-y-4">
                      {/* Move Order# with settings icon */}
                      <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                        <label className="text-slate-600 font-semibold text-right">Move Order# <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <input 
                            type="text" 
                            required
                            className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 pr-8 focus:outline-hidden focus:border-blue-500 font-mono"
                            value={moNumber}
                            onChange={(e) => setMoNumber(e.target.value)}
                            placeholder="e.g. MO-00001"
                          />
                          <Settings className="w-4 h-4 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5 cursor-pointer" />
                        </div>
                      </div>

                      {/* Date */}
                      <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                        <label className="text-slate-600 font-semibold text-right">Date</label>
                        <input 
                          type="date"
                          className="w-full text-[13px] border border-slate-200 bg-slate-50/50 rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>

                      {/* Warehouse Name Dropdown */}
                      <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                        <label className="text-slate-600 font-semibold text-right">Warehouse Name <span className="text-rose-500">*</span></label>
                        <select 
                          required
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                          value={warehouseId}
                          onChange={(e) => setWarehouseId(e.target.value)}
                        >
                          <option value="">Select a warehouse</option>
                          {warehouses.map(wh => (
                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right fields */}
                    <div className="space-y-4">
                      {/* Assignee Dropdown */}
                      <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                        <label className="text-slate-600 font-semibold text-right">Assignee</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                          value={assignee}
                          onChange={(e) => setAssignee(e.target.value)}
                        >
                          <option value="">Select User</option>
                          <option value="Admin User">Admin User</option>
                          <option value="Pradeep Kumar">Pradeep Kumar (Store Keeper)</option>
                          <option value="Srinivas Rao">Srinivas Rao (Logistics manager)</option>
                        </select>
                      </div>

                      {/* Internal Notes */}
                      <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                        <label className="text-slate-600 font-semibold text-right pt-1.5">Internal Notes</label>
                        <textarea 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-2 h-20 focus:outline-hidden focus:border-blue-500 placeholder-slate-400"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="relocation detail notes..."
                        />
                      </div>
                    </div>

                  </div>

                  {/* Scan Item Barcode Utility panel */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 px-4 flex items-center justify-between text-slate-500 text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span>Scan barcode or type item names directly below to assign relocation quantities.</span>
                    </div>
                    <button type="button" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline">
                      ⚡ Scan Item
                    </button>
                  </div>

                  {/* Move Order Table rows (Screenshot 2 style inside modern card) */}
                  <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-3xs">
                    <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-[12px] font-bold text-slate-700">
                      <span>Item Details</span>
                      <span>Quantity Transferred</span>
                    </div>

                    <div className="divide-y divide-slate-100 p-4 space-y-3">
                      {lineItems.map((line, idx) => (
                        <div key={idx} className="flex gap-4 items-center">
                          {/* Item Selector dropdown */}
                          <div className="flex-1">
                            <select 
                              required
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-2 focus:outline-hidden focus:border-blue-500"
                              value={line.productId}
                              onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                            >
                              <option value="">Type or click to select an item.</option>
                              {inventoryItems.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.name} ({item.sku}) [On Hand: {item.qty_on_hand}]
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Qty value input */}
                          <div className="w-40 flex items-center">
                            <input 
                              type="number" 
                              required
                              min="0.01"
                              step="any"
                              className="w-full text-[13px] border border-slate-300 rounded p-2 text-right focus:outline-hidden focus:border-blue-500 font-mono"
                              value={line.qty}
                              onChange={(e) => handleLineChange(idx, 'qty', e.target.value)}
                              placeholder="0.00"
                            />
                            <span className="bg-slate-50 border border-slate-300 border-l-0 rounded-r px-2 py-2 text-slate-400 font-medium text-[11px] select-none h-[38px] flex items-center">
                              Units
                            </span>
                          </div>

                          {/* Trash button */}
                          <button 
                            type="button"
                            onClick={() => removeLineRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-2 hover:bg-slate-50 rounded transition-all shrink-0"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {/* Add Row Button */}
                      <button 
                        type="button"
                        onClick={addLineRow}
                        className="text-blue-600 hover:text-blue-800 font-bold text-[13px] mt-2 flex items-center gap-1 hover:underline"
                      >
                        + Add New Row
                      </button>
                    </div>
                  </div>

                  {/* Attachment Box Dropzone */}
                  <div className="bg-white p-5 rounded-md border border-slate-200">
                    <span className="block text-[12px] font-semibold text-slate-600 mb-2">Attach File(s) to move order</span>
                    <div className="border border-dashed border-slate-300 rounded p-6 text-center hover:bg-slate-50/50 transition-colors pointer-events-none select-none">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span className="block text-[12px] font-bold text-slate-600">Drag & Drop Files</span>
                      <span className="block text-[11px] text-slate-400 mt-1">Upload files under 10 MB each, up to 10 files total</span>
                    </div>
                  </div>

                  {/* Form Footer Actions (Screenshot 2 bottom style) */}
                  <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
                    <div>
                      {/* Help indicator or similar */}
                      <span className="text-[12px] text-slate-400 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-500" /> Relocation movements do not affect cumulative stock counts.
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={(e) => handleSubmit(e, 'draft')}
                        disabled={isSubmitting}
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-[13px] font-bold select-none cursor-pointer transition-colors"
                      >
                        Save as Draft
                      </button>
                      
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-[13px] font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
                      >
                        {isSubmitting ? "Saving..." : "Save as Completed"}
                      </button>

                      <button 
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded text-[13px] font-semibold transition-colors"
                      >
                        Cancel
                      </button>
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
