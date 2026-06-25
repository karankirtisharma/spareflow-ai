import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, 
  ChevronDown, Send, FileText, CheckCircle, Clock, Trash2, 
  X, AlertCircle, FileDown, Search, ArrowRight, User, 
  Calendar, Clipboard, HelpCircle as HelpIcon, Layers, Info, Check, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PutawaysList() {
  const { 
    putaways, 
    items: inventoryItems, 
    warehouses, 
    addPutaway, 
    fetchPutaways,
    isLoading 
  } = useInventoryStore();

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [pwNumber, setPwNumber] = useState("");
  const [date, setDate] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [notes, setNotes] = useState("");

  // Putaway Line Items State
  const [lineItems, setLineItems] = useState<{ productId: string; qty: string }[]>([
    { productId: '', qty: '1.00' }
  ]);

  // Set default code and current date when modal opens
  const openModal = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setPwNumber(`PW-${randomSuffix}`);
    
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

  // Submit Putaway to Backend
  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'completed') => {
    e.preventDefault();
    setFormError("");

    if (!pwNumber.trim()) {
      setFormError("Putaway number is required.");
      return;
    }

    if (!warehouseId) {
      setFormError("Please select a target warehouse.");
      return;
    }

    // Validate and clean up line items
    const validLines = lineItems.filter(li => li.productId && Number(li.qty) > 0);
    if (validLines.length === 0) {
      setFormError("Please select at least one valid item and supply a quantity.");
      return;
    }

    const selectedWh = warehouses.find(w => String(w.id) === String(warehouseId));
    
    setIsSubmitting(true);
    try {
      const payloadItems = validLines.map(vl => ({
        productId: Number(vl.productId),
        qty: Number(vl.qty),
      }));

      await addPutaway({
        pw_number: pwNumber.trim(),
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
      setFormError(err?.message || "Failed to generate putaway");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search filter
  const filteredPutaways = putaways.filter(pw => {
    const term = search.toLowerCase();
    return (
      pw.pw_number.toLowerCase().includes(term) ||
      (pw.assignee && pw.assignee.toLowerCase().includes(term)) ||
      (pw.warehouse_name && pw.warehouse_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative font-sans antialiased">
      {/* Top Header bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer group">
            <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              All Putaways <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5" />
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lookup Input */}
          <div className="relative mr-2 hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Search Putaways..."
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
          <span>Total Putaways: <b>{putaways.length}</b></span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>Draft: <b>{putaways.filter(p => p.status === 'draft').length}</b></span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Completed: <b>{putaways.filter(p => p.status === 'completed').length}</b></span>
        </div>
        <div>
          <button onClick={() => fetchPutaways()} className="hover:text-blue-600 transition-colors">
            Sync Putaway Logs
          </button>
        </div>
      </div>

      {/* Main empty screen vs Table switcher */}
      {putaways.length === 0 ? (
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

                {/* Arrow pointing down info the rack */}
                <path d="M 100,25 L 100,68" stroke="#2485e8" strokeWidth="2.5" strokeDasharray="5 4" fill="none" />
                <polygon points="96,65 104,65 100,72" fill="#2485e8" />

                {/* Box ready to place */}
                <rect x="91" y="80" width="18" height="18" rx="2" fill="#93c5fd" stroke="#3b82f6" />
                <line x1="91" y1="89" x2="109" y2="89" stroke="#3b82f6" />
              </svg>
            </div>

            <h3 className="text-[18px] font-bold text-slate-800 tracking-tight mb-2">
              Optimize Received Goods Routing
            </h3>
            <p className="text-[13px] text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
              Create putaway sheets to easily transfer new item into dedicated storage racks.
            </p>
            
            <button 
              onClick={openModal}
              className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-5 py-2.5 rounded text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:translate-y-[-1px]"
            >
              CREATE PUTAWAY
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
                <th className="py-3 px-6">Putaway#</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Warehouse</th>
                <th className="py-3 px-6">Assignee</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-right">Items Count</th>
                <th className="py-3 px-6">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredPutaways.map(pw => {
                const totalQty = pw.items ? pw.items.reduce((sum, i) => sum + i.qty, 0) : 0;
                return (
                  <tr key={pw.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                    <td className="py-3.5 px-6 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-blue-600 hover:underline">
                      {pw.pw_number}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {pw.date}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 font-medium">
                      {pw.warehouse_name || "Primary Warehouse"}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {pw.assignee}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                        pw.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {pw.status === 'completed' ? (
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
                      {pw.items ? pw.items.length : 0} items ({totalQty} units)
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 max-w-xs truncate" title={pw.notes || ''}>
                      {pw.notes || <span className="italic text-slate-300 font-light">No notes</span>}
                    </td>
                  </tr>
                );
              })}
              {filteredPutaways.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching putaways found for "<b>{search}</b>".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* COMPREHENSIVE NEW PUTAWAY MODAL (MADE COLOR-MATCHED AND PIXEL PERFECT) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-[#1e2229]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-[4px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col my-8 border border-slate-200 max-h-[92vh]"
            >
              
              {/* Modal Header */}
              <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[17px] font-bold text-slate-850">New Putaway</span>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-sm"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto bg-white p-6 lg:p-8 space-y-6">
                
                {formError && (
                  <div className="p-3 text-[13px] bg-rose-50 border border-rose-200 text-rose-700 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> 
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={(e) => handleSubmit(e, 'completed')} className="space-y-6 text-[13px]">
                  
                  {/* Fields Container Grid matches exact screenshot styling constraints */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                    
                    {/* Left Column Fields */}
                    <div className="space-y-4">
                      {/* Putaway# Input */}
                      <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                        <label className="text-slate-600 font-semibold text-right">Putaway# <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <input 
                            type="text" 
                            required
                            className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 pr-8 focus:outline-hidden focus:border-blue-500 font-mono"
                            value={pwNumber}
                            onChange={(e) => setPwNumber(e.target.value)}
                          />
                          <Settings className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 cursor-pointer hover:text-slate-600" />
                        </div>
                      </div>

                      {/* Date Input */}
                      <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                        <label className="text-slate-600 font-semibold text-right">Date</label>
                        <input 
                          type="date"
                          className="w-full text-[13px] border border-slate-350 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>

                      {/* Warehouse Name Dropdown */}
                      <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                        <label className="text-slate-600 font-semibold text-right">Warehouse Name <span className="text-rose-500">*</span></label>
                        <select 
                          required
                          className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500"
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

                    {/* Right Column Fields */}
                    <div className="space-y-4">
                      {/* Assignee Input */}
                      <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                        <label className="text-slate-600 font-semibold text-right">Assignee</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-1.5 focus:outline-hidden focus:border-blue-500"
                          value={assignee}
                          onChange={(e) => setAssignee(e.target.value)}
                        >
                          <option value="Admin User">Admin User</option>
                          <option value="Pradeep Kumar">Pradeep Kumar (Store Keeper)</option>
                          <option value="Srinivas Rao">Srinivas Rao (Logistics manager)</option>
                        </select>
                      </div>

                      {/* Internal Notes textarea */}
                      <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                        <label className="text-slate-600 font-semibold text-right pt-1.5">Internal Notes</label>
                        <textarea 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded-[3px] p-2 h-20 focus:outline-hidden focus:border-blue-500 placeholder-slate-400"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>

                  </div>

                  {/* Scan Items header button */}
                  <div className="flex justify-end pt-1 bg-white">
                    <button type="button" className="text-blue-600 hover:text-blue-800 font-medium text-[12px] flex items-center gap-1 cursor-pointer">
                      <CheckCircle className="w-3.5 h-3.5" /> Scan Item
                    </button>
                  </div>

                  {/* Item table header */}
                  <div className="border border-slate-200 rounded-[3px] overflow-hidden">
                    <table className="w-full text-left font-sans border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[12px] text-slate-500 font-semibold select-none">
                          <th className="py-2.5 px-4 font-bold">Item Details</th>
                          <th className="py-2.5 px-4 text-right w-48 font-bold pr-10">Quantity transferred</th>
                          <th className="py-2.5 px-3 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {lineItems.map((line, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <select 
                                required
                                className="w-full text-[13px] border-none bg-transparent focus:outline-hidden text-slate-800 placeholder-slate-400"
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
                            </td>
                            <td className="py-3 px-4 w-48 pr-10 text-right">
                              <input 
                                type="number" 
                                required
                                min="0.01"
                                step="any"
                                className="w-full text-[13px] border-none bg-transparent text-right focus:outline-hidden font-mono text-slate-800"
                                value={line.qty}
                                onChange={(e) => handleLineChange(idx, 'qty', e.target.value)}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button 
                                type="button"
                                onClick={() => removeLineRow(idx)}
                                className="text-slate-300 hover:text-rose-600 p-1"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Items row button (matching bottom left click in screenshot) */}
                  <div className="pt-1.5">
                    <button 
                      type="button"
                      onClick={addLineRow}
                      className="text-blue-500 hover:text-blue-700 font-medium text-[13px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" /> Add Items
                    </button>
                  </div>

                  {/* Attachment dropsite */}
                  <div className="pt-2">
                    <span className="block text-[12px] font-semibold text-slate-500 mb-2">Attach File(s) to Putaway</span>
                    <div className="border border-dashed border-slate-350 rounded-[4px] p-6 text-center hover:bg-slate-50/30 transition-colors pointer-events-none select-none">
                      <div className="flex flex-col items-center justify-center">
                        <Download className="w-8 h-8 text-slate-300 mb-2 rotate-180" />
                        <span className="block text-[12px] text-slate-550 font-medium">Upload File</span>
                        <span className="block text-[11px] text-slate-400 mt-1">You can upload a maximum of 10 files, 10MB each</span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Actions - styled clean and neat */}
                  <div className="border-t border-slate-100 pt-5 flex justify-start items-center gap-2">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-2 rounded-[3px] text-[13px] font-semibold cursor-pointer transition-colors shadow-xs"
                    >
                      {isSubmitting ? "Generating..." : "Generate putaway"}
                    </button>

                    <button 
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-[3px] text-[13px] font-medium transition-colors"
                    >
                      Cancel
                    </button>
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
