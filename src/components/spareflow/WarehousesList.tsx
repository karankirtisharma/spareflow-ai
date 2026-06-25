import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { Plus, X, AlertTriangle, ChevronDown, Settings, ListFilter, MoreHorizontal, HelpCircle } from 'lucide-react';

export function WarehousesList() {
  const { warehouses, addWarehouse } = useInventoryStore();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please input a valid location name.");
      return;
    }

    setIsSubmitting(true);
    await addWarehouse({
      name: name.trim(),
      is_active: true
    });
    setIsSubmitting(false);

    setName("");
    setShowModal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative">
      
      {/* List Toolbar Navbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="flex flex-col">
            <h2 className="text-[17px] font-semibold text-slate-800 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
              Active Warehouses <ChevronDown className="w-4 h-4 mt-0.5" />
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setError("");
              setShowModal(true);
            }}
            className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-3.5 py-1.5 rounded-[4px] text-[13px] font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> New
          </button>
          
          <div className="h-5 w-px bg-slate-300 mx-1"></div>
          
          <button className="text-slate-500 hover:text-slate-800 p-1 bg-slate-100 hover:bg-slate-200 rounded">
            <Settings className="w-[18px] h-[18px]" />
          </button>
          
          <button className="text-slate-500 hover:text-slate-800 p-1 bg-slate-100 hover:bg-slate-200 rounded">
            <ListFilter className="w-[18px] h-[18px]" />
          </button>

          <button className="text-slate-500 hover:text-slate-800 p-1 bg-slate-100 hover:bg-slate-200 rounded">
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>
          
          <div className="h-5 w-px bg-slate-300 mx-1"></div>
          
          <button className="text-[#2485e8] p-1 bg-blue-50 rounded hidden sm:block">
            <HelpCircle className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-[#f9fafb] border-b border-slate-200 sticky top-0 z-10">
            <tr className="text-[12px] text-slate-500 tracking-wide font-medium">
              <th className="py-2.5 px-4 w-10 text-center">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th className="py-2.5 px-4 font-medium uppercase text-[11px] hover:bg-slate-100 cursor-pointer">Warehouse Name</th>
              <th className="py-2.5 px-4 font-medium uppercase text-[11px] hover:bg-slate-100 cursor-pointer">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {warehouses.map(wh => (
              <tr key={wh.id} className="text-[13px] hover:bg-[#f8fafc] transition-colors group border-b border-transparent hover:border-slate-200">
                <td className="py-2.5 px-4 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
                <td className="py-2.5 px-4">
                  <div className="font-medium text-blue-600 hover:underline cursor-pointer">{wh.name}</div>
                </td>
                <td className="py-2.5 px-4">
                  {wh.is_active ? 
                    <span className="text-emerald-600 font-medium text-[12px]">Active</span> :
                    <span className="text-slate-500 font-medium text-[12px]">Inactive</span>
                  }
                </td>
              </tr>
            ))}
            {warehouses.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 text-center text-slate-500 text-[13px]">
                  No warehouses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Create Warehouse */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[8px] shadow-2xl border border-slate-200 w-full max-w-[480px] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-[17px] font-semibold text-slate-800">
                New Warehouse
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[80vh]">
              <div className="p-5 overflow-y-auto space-y-6">
                
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded text-sm flex items-center gap-2 border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" /> 
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-slate-700 flex items-center gap-1">
                      Warehouse Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="w-full text-[13px] border border-slate-300 rounded-[4px] px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all hover:border-slate-400"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-[8px]">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium text-[13px] rounded-[4px] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#2485e8] hover:bg-[#1a74d4] text-white font-medium text-[13px] rounded-[4px] shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
