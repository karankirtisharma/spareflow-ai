import React, { useState, useRef } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { 
  Plus, Search, HelpCircle, Package, X, AlertTriangle, 
  ChevronDown, Settings, HelpCircle as HelpIcon, LayoutGrid, 
  List, Check, Trash2, ArrowRight, Upload, Info, RotateCcw,
  Sliders, Eye
} from 'lucide-react';
import { formatINR } from '../../utils/format.js';

export function ItemsList() {
  const { items, warehouses, addItem, fetchInitialData } = useInventoryStore();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Interactive Form States (Matching Screenshot 2 & 3 layout perfectly)
  const [goodsOrService, setGoodsOrService] = useState<'goods' | 'service'>('goods');
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [itemDetailsType, setItemDetailsType] = useState<'single' | 'variants'>('single');
  const [unit, setUnit] = useState("pcs");
  const [description, setDescription] = useState("");

  // Section Checkbox States
  const [salesInfoChecked, setSalesInfoChecked] = useState(true);
  const [salesPrice, setSalesPrice] = useState("");
  const [salesAccount, setSalesAccount] = useState("Sales");
  const [salesDesc, setSalesDesc] = useState("");

  const [purchaseInfoChecked, setPurchaseInfoChecked] = useState(true);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseAccount, setPurchaseAccount] = useState("Cost of Goods Sold");
  const [purchaseDesc, setPurchaseDesc] = useState("");
  const [preferredVendor, setPreferredVendor] = useState("");

  const [trackInventoryChecked, setTrackInventoryChecked] = useState(true);
  const [inventoryAccount, setInventoryAccount] = useState("Inventory Asset Account");
  const [inventoryValuation, setInventoryValuation] = useState("FIFO (First In, First Out)");
  const [reorderPoint, setReorderPoint] = useState("10");
  const [initialQty, setInitialQty] = useState("0");
  const [initialWarehouseId, setInitialWarehouseId] = useState("");

  const [returnableItem, setReturnableItem] = useState<'yes' | 'no'>('yes');
  
  // Dimensions and Weights
  const [dimL, setDimL] = useState("");
  const [dimW, setDimW] = useState("");
  const [dimH, setDimH] = useState("");
  const [dimUnit, setDimUnit] = useState("cm");
  const [weightVal, setWeightVal] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");

  // Image Upload File Previews
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [rearImage, setRearImage] = useState<string | null>(null);
  const [otherImages, setOtherImages] = useState<string[]>([]);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const rearInputRef = useRef<HTMLInputElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.sku && i.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(URL.createObjectURL(file));
    }
  };

  const handleRearUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRearImage(URL.createObjectURL(file));
    }
  };

  const handleOthersUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        urls.push(URL.createObjectURL(files[i]));
      }
      setOtherImages(prev => [...prev, ...urls].slice(0, 15));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name) {
      setFormError("Name is a required field.");
      return;
    }

    const defaultSku = sku || `ITEM-${Math.floor(1000 + Math.random() * 9000)}`;
    const costNum = Number(purchasePrice) || 0;
    const saleNum = Number(salesPrice) || 0;
    const ropNum = Number(reorderPoint) || 10;
    const qtyNum = Number(initialQty) || 0;

    setIsSubmitting(true);
    try {
      await addItem({
        name,
        sku: defaultSku.toUpperCase(),
        item_type: goodsOrService === 'goods' ? 'single' : 'service',
        unit,
        purchase_price: costNum,
        sales_price: saleNum,
        reorder_point: ropNum,
        qty_on_hand: qtyNum,
        is_tracked: trackInventoryChecked,
        initial_warehouse_id: warehouses[0]?.id
      });
      
      // Reset Form fields
      setName("");
      setSku("");
      setBrand("");
      setManufacturer("");
      setPurchasePrice("");
      setSalesPrice("");
      setReorderPoint("10");
      setInitialQty("0");
      setFrontImage(null);
      setRearImage(null);
      setOtherImages([]);
      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative font-sans antialiased">
      
      {/* Top Main List Toolbar Header (Zoho style padding & border) */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer group">
            <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              All Items <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5" />
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* List/Grid toggles */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded p-0.5 mr-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => {
              setFormError("");
              setShowCreateModal(true);
            }}
            className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3px]" /> New
          </button>
          
          <div className="h-5 w-px bg-slate-300 mx-1.5"></div>
          
          <button className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="Settings">
            <Settings className="w-[17px] h-[17px]" />
          </button>
          
          <button className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="Filters">
            <Sliders className="w-[17px] h-[17px]" />
          </button>
          
          <div className="h-5 w-px bg-slate-200 mx-1"></div>
          
          <button className="text-[#2485e8] p-1.5 hover:bg-blue-50 rounded-md transition-colors" title="Help Guide">
            <HelpIcon className="w-[17px] h-[17px]" />
          </button>
        </div>
      </div>

      {/* Main empty screen vs Table switcher */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
          <div className="w-full max-w-xl text-center flex flex-col items-center">
            
            {/* Masterpiece visual SVG layout matching Zoho empty shelves */}
            <div className="relative mb-6 select-none transition-transform hover:scale-103 duration-300">
              <svg className="w-56 h-56 mx-auto text-slate-300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Accent ambient cloud backplate */}
                <ellipse cx="100" cy="155" rx="75" ry="22" fill="#e2e8f0" opacity="0.4" />
                <ellipse cx="100" cy="155" rx="55" ry="15" fill="#cbd5e1" opacity="0.3" />

                {/* Vertical shelf beams */}
                <rect x="52" y="30" width="8" height="135" rx="3" fill="#cbd5e1" />
                <rect x="140" y="30" width="8" height="135" rx="3" fill="#cbd5e1" />

                {/* Horizontal planks */}
                <rect x="35" y="75" width="130" height="7" rx="1.5" fill="#94a3b8" />
                <rect x="35" y="120" width="130" height="7" rx="1.5" fill="#94a3b8" />

                {/* TOP SHELF ITEMS - Blue isometric high contrast box on left shelf */}
                {/* Box Backing */}
                <path d="M60 48 L75 52 L90 48 L75 44 Z" fill="#93c5fd" />
                <path d="M60 48 L75 52 V68 L60 64 Z" fill="#2563eb" />
                <path d="M75 52 L90 48 V64 L75 68 Z" fill="#3b82f6" />
                {/* Label highlight */}
                <rect x="63" y="52" width="6" height="5" fill="#eff6ff" opacity="0.8" transform="skewY(10)" />

                {/* Top support cylindrical orb */}
                <circle cx="120" cy="56" r="12" fill="#cbd5e1" />
                <circle cx="116" cy="52" r="3" fill="#f8fafc" opacity="0.7" />

                {/* BOTTOM SHELF ITEMS */}
                {/* Horizontal pipe piece on bottom shelf */}
                <rect x="62" y="102" width="30" height="12" rx="2" fill="#94a3b8" />
                <ellipse cx="92" cy="108" rx="3" ry="6" fill="#475569" />
                <ellipse cx="92" cy="108" rx="1.5" ry="3" fill="#1e293b" />

                {/* Metal hexagon bolt */}
                <polygon points="112,108 118,103 128,103 134,108 128,113 118,113" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="123" cy="108" r="3.5" fill="#f1f5f9" />
              </svg>
            </div>

            <h3 className="text-[18px] font-bold text-slate-800 tracking-tight mb-2">
              Create New Items
            </h3>
            <p className="text-[13px] text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
              Create single items or items with variants to start adding them to transactions and manage your inventory stock.
            </p>
            
            <button 
              onClick={() => {
                setFormError("");
                setShowCreateModal(true);
              }}
              className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:translate-y-[-1px]"
            >
              <Plus className="w-4 h-4 stroke-[3.5]" /> New Item
            </button>

          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Quick Stats bar */}
          <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-4">
              <span>Total Active Products: <b>{items.length}</b></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>In Stock Value calculated in Indian Rupees (INR)</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchInitialData()} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                <RotateCcw className="w-3 h-3" /> Sync Database
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {viewMode === 'list' ? (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr className="text-[12px] text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-6 w-10 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </th>
                    <th className="py-3 px-6">Item Name</th>
                    <th className="py-3 px-6">SKU Code</th>
                    <th className="py-3 px-6">Unit</th>
                    <th className="py-3 px-6 text-right">Cost Price</th>
                    <th className="py-3 px-6 text-right">Selling Price</th>
                    <th className="py-3 px-6 text-right">Qty Pack</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => (
                    <tr key={item.id} className="text-[13px] hover:bg-blue-50/40 transition-colors group cursor-pointer">
                      <td className="py-3 px-6 text-center">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="py-3 px-6 font-semibold text-blue-600 hover:underline">
                        {item.name}
                      </td>
                      <td className="py-3 px-6 text-slate-600 font-mono text-[12px]">{item.sku}</td>
                      <td className="py-3 px-6 text-slate-500 capitalize">{item.unit}</td>
                      <td className="py-3 px-6 text-right text-slate-600">{formatINR(item.purchase_price)}</td>
                      <td className="py-3 px-6 text-right font-medium text-slate-900">{formatINR(item.sales_price)}</td>
                      <td className="py-3 px-6 text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${item.qty_on_hand <= item.reorder_point ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {item.qty_on_hand}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-[13px]">
                        No match found for "<b>{search}</b>". Try another lookup search term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-slate-50/50 min-h-full">
                {filtered.map(item => (
                  <div key={item.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative group">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-slate-100 rounded text-slate-500"><Settings className="w-3.5 h-3.5" /></button>
                    </div>
                    <div>
                      <div className="w-full h-32 bg-slate-100 rounded mb-3 flex items-center justify-center text-slate-400 relative overflow-hidden border border-slate-100">
                        <Package className="w-8 h-8 opacity-40" />
                        <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-slate-800 text-white px-1.5 rounded">{item.sku}</span>
                      </div>
                      <h4 className="text-[14px] font-bold text-slate-800 leading-tight mb-1">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 uppercase tracking-widest">{item.unit}</p>
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-400">Selling Price</span>
                        <span className="text-[14px] font-bold text-slate-800">{formatINR(item.sales_price)}</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[11px] text-slate-400">Qty On Hand</span>
                        <span className="text-[13px] font-semibold text-slate-700">{item.qty_on_hand}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLY DETAILED NEW ITEM MODAL (MATCHING SCREENSHOT 2, 3, 4 LAYOUT EXACTLY) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#1e2229]/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col my-8 border border-slate-300 max-h-[92vh]">
            
            {/* Modal Heading Header bar */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[17px] font-bold text-slate-800">New Item</span>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal body (Duo Columns: Left fields list, Right image panels) */}
            <div className="flex-1 overflow-y-auto bg-[#fafbfc] p-6 lg:p-8">
              
              {formError && (
                <div className="mb-6 p-3 text-[13px] bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{formError}</span>
                </div>
              )}

              <form id="new-spareflow-item-form" onSubmit={handleSubmit} className="space-y-8 text-[13px]">
                
                {/* 1. Core Profile Header Row (Type, Name, Brand, Manufacturer, & Images) */}
                <div className="flex flex-col lg:flex-row gap-10">
                  {/* Left Column forms */}
                  <div className="flex-1 space-y-5">
                    
                    {/* Name block */}
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                      <label className="text-slate-600 font-semibold text-right">Name<span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Front Brake Pads"
                      />
                    </div>

                    {/* Radio: Type */}
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                      <div className="flex items-center justify-end gap-1">
                        <label className="text-slate-600 font-semibold">Type</label>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="goodsOrService"
                            checked={goodsOrService === 'goods'}
                            onChange={() => setGoodsOrService('goods')}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                          />
                          <span className="text-slate-700 font-medium">Goods</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="goodsOrService"
                            checked={goodsOrService === 'service'}
                            onChange={() => setGoodsOrService('service')}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                          />
                          <span className="text-slate-700 font-medium">Service</span>
                        </label>
                      </div>
                    </div>

                    {/* Dropdown: Brand */}
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                      <label className="text-slate-600 font-semibold text-right">Brand</label>
                      <select 
                        className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                      >
                        <option value="">Select or Add Brand</option>
                        <option value="Brembo">Brembo</option>
                        <option value="Bosch">Bosch</option>
                        <option value="TVS">TVS</option>
                        <option value="KBX">KBX</option>
                      </select>
                    </div>

                    {/* Dropdown: Manufacturer */}
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                      <label className="text-slate-600 font-semibold text-right">Manufacturer</label>
                      <select 
                        className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                      >
                        <option value="">Select or Add Manufacturer</option>
                        <option value="Bosch India">Bosch India</option>
                        <option value="Brembo Corp">Brembo Corp</option>
                        <option value="Subros">Subros</option>
                      </select>
                    </div>

                  </div>

                  {/* Right Column: Dynamic Image Pickers matching design template */}
                  <div className="w-full lg:w-[450px] p-4 bg-slate-50 rounded-md border border-slate-200">
                    <div className="text-[12px] font-bold text-slate-700 mb-2">Item Image Attachments</div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Front View */}
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500 font-semibold mb-1">Front View</span>
                        <div 
                          onClick={() => frontInputRef.current?.click()}
                          className="h-24 bg-white border border-dashed border-slate-300 rounded flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-slate-100 transition-colors group relative"
                        >
                          {frontImage ? (
                            <img src={frontImage} className="w-full h-full object-contain rounded" alt="Front Preview" />
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 mb-1" />
                              <span className="text-[10px] text-slate-400 text-center font-medium">Upload Front Image</span>
                            </>
                          )}
                          <input ref={frontInputRef} type="file" accept="image/*" className="hidden" onChange={handleFrontUpload} />
                        </div>
                      </div>

                      {/* Rear View */}
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500 font-semibold mb-1">Rear View</span>
                        <div 
                          onClick={() => rearInputRef.current?.click()}
                          className="h-24 bg-white border border-dashed border-slate-300 rounded flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-slate-100 transition-colors group relative"
                        >
                          {rearImage ? (
                            <img src={rearImage} className="w-full h-full object-contain rounded" alt="Rear Preview" />
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 mb-1" />
                              <span className="text-[10px] text-slate-400 text-center font-medium">Upload Rear Image</span>
                            </>
                          )}
                          <input ref={rearInputRef} type="file" accept="image/*" className="hidden" onChange={handleRearUpload} />
                        </div>
                      </div>

                      {/* Other drag & drop multiple images */}
                      <div className="col-span-2 flex flex-col mt-2">
                        <span className="text-[11px] text-slate-500 font-semibold mb-1">Other Images</span>
                        <div 
                          onClick={() => otherInputRef.current?.click()}
                          className="bg-white border border-dashed border-slate-300 rounded-md p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                        >
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mx-auto mb-1" />
                          <span className="block text-[11px] font-bold text-slate-700">Drag & Drop Images</span>
                          <span className="block text-[10px] text-slate-400 mt-1 leading-normal">
                            You can add up to 15 images including front, rear and other images, each not exceeding 5 MB.
                          </span>
                          <input ref={otherInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleOthersUpload} />
                        </div>
                        {otherImages.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {otherImages.map((src, idx) => (
                              <img key={idx} src={src} className="w-8 h-8 rounded border border-slate-200 object-cover" alt="prev" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. Item Details Section */}
                <div className="bg-white p-5 rounded-md border border-slate-200 space-y-4">
                  <h4 className="text-[14px] font-bold text-slate-800 border-b border-slate-100 pb-2">Item Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Item Type Row Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-semibold">Item Type</label>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setItemDetailsType('single')}
                          className={`flex-1 max-w-[160px] py-2 px-3 text-left rounded border flex items-center justify-between transition-all ${itemDetailsType === 'single' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-700'}`}
                        >
                          <span className="font-semibold text-[12px]">Single Item</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${itemDetailsType === 'single' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                            {itemDetailsType === 'single' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => setItemDetailsType('variants')}
                          className={`flex-1 max-w-[160px] py-2 px-3 text-left rounded border flex items-center justify-between transition-all ${itemDetailsType === 'variants' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-700'}`}
                        >
                          <span className="font-semibold text-[12px]">Contains Variants</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${itemDetailsType === 'variants' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                            {itemDetailsType === 'variants' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Unit Selector */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-semibold">Unit*</label>
                      <select 
                        required
                        className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      >
                        <option value="pcs">pcs</option>
                        <option value="box">box</option>
                        <option value="set">set</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>

                    {/* SKU Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-slate-500 font-semibold">SKU</label>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                      </div>
                      <input 
                        type="text" 
                        className="w-full text-[13px] border border-slate-300 rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs font-mono"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="e.g. BP-XYZ-12"
                      />
                    </div>
                  </div>

                  <div className="pt-2 text-left">
                    <button type="button" className="text-blue-600 hover:text-blue-800 font-bold text-[12px] hover:underline flex items-center gap-1">
                      + Add Identifier
                    </button>
                  </div>
                </div>

                {/* 3. Item Description Section */}
                <div className="bg-white p-5 rounded-md border border-slate-200 space-y-4">
                  <h4 className="text-[14px] font-bold text-slate-800 border-b border-slate-100 pb-2">Item Description</h4>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-semibold">Description</label>
                    <textarea 
                      className="w-full h-20 text-[13px] border border-slate-300 rounded p-2 focus:outline-hidden focus:border-blue-500 shadow-xs"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter a brief item description for invoices and orders."
                    />
                  </div>
                </div>

                {/* 4. Sales Information checkbox block */}
                <div className="bg-white p-5 rounded-md border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <input 
                      type="checkbox" 
                      id="salesInfoChecked"
                      checked={salesInfoChecked}
                      onChange={(e) => setSalesInfoChecked(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 rounded"
                    />
                    <label htmlFor="salesInfoChecked" className="text-[14px] font-bold text-slate-800 cursor-pointer select-none">Sales Information</label>
                  </div>
                  
                  {salesInfoChecked && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-semibold">Selling Price*</label>
                        <div className="flex items-center">
                          <span className="bg-slate-50 border border-slate-300 border-r-0 rounded-l px-2.5 py-1.5 text-[12px] text-slate-500 font-semibold">INR</span>
                          <input 
                            type="number" 
                            required={salesInfoChecked}
                            className="w-full text-[13px] border border-slate-300 rounded-r p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                            value={salesPrice}
                            onChange={(e) => setSalesPrice(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-semibold">Account*</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                          value={salesAccount}
                          onChange={(e) => setSalesAccount(e.target.value)}
                        >
                          <option value="Sales">Sales</option>
                          <option value="Trade Income">Trade Income</option>
                        </select>
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <label className="text-slate-500 font-semibold">Description</label>
                        <textarea 
                          className="w-full h-16 text-[12px] border border-slate-300 rounded p-2 focus:outline-hidden focus:border-blue-500 shadow-xs"
                          value={salesDesc}
                          onChange={(e) => setSalesDesc(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Purchase Information checkbox block */}
                <div className="bg-white p-5 rounded-md border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <input 
                      type="checkbox" 
                      id="purchaseInfoChecked"
                      checked={purchaseInfoChecked}
                      onChange={(e) => setPurchaseInfoChecked(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 rounded"
                    />
                    <label htmlFor="purchaseInfoChecked" className="text-[14px] font-bold text-slate-800 cursor-pointer select-none">Purchase Information</label>
                  </div>
                  
                  {purchaseInfoChecked && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-semibold">Cost Price*</label>
                        <div className="flex items-center">
                          <span className="bg-slate-50 border border-slate-300 border-r-0 rounded-l px-2.5 py-1.5 text-[12px] text-slate-500 font-semibold">INR</span>
                          <input 
                            type="number" 
                            required={purchaseInfoChecked}
                            className="w-full text-[13px] border border-slate-300 rounded-r p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-semibold">Account*</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                          value={purchaseAccount}
                          onChange={(e) => setPurchaseAccount(e.target.value)}
                        >
                          <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                          <option value="Materials Purchase">Materials Purchase</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 col-span-2">
                        <label className="text-slate-500 font-semibold">Preferred Vendor</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                          value={preferredVendor}
                          onChange={(e) => setPreferredVendor(e.target.value)}
                        >
                          <option value="">Select a Preferred Vendor</option>
                          <option value="Bosch">Bosch India</option>
                          <option value="Brembo">Brembo India</option>
                        </select>
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <label className="text-slate-500 font-semibold">Description</label>
                        <textarea 
                          className="w-full h-16 text-[12px] border border-slate-300 rounded p-2 focus:outline-hidden focus:border-blue-500 shadow-xs"
                          value={purchaseDesc}
                          onChange={(e) => setPurchaseDesc(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Track Inventory for this item checkbox section */}
                <div className="bg-white p-5 rounded-md border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="trackInventoryChecked"
                      checked={trackInventoryChecked}
                      onChange={(e) => setTrackInventoryChecked(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 rounded"
                    />
                    <label htmlFor="trackInventoryChecked" className="text-[14px] font-bold text-slate-800 cursor-pointer select-none">Track Inventory for this item</label>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                  </div>
                  
                  <p className="text-[11px] text-slate-400 leading-normal">
                    You cannot enable/disable inventory tracking once you've created transactions for this item
                  </p>

                  {trackInventoryChecked && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-semibold">Inventory Account*</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                          value={inventoryAccount}
                          onChange={(e) => setInventoryAccount(e.target.value)}
                        >
                          <option value="Inventory Asset Account">Inventory Asset Account</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-semibold">Inventory Valuation Method*</label>
                        <select 
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                          value={inventoryValuation}
                          onChange={(e) => setInventoryValuation(e.target.value)}
                        >
                          <option value="FIFO (First In, First Out)">FIFO (First In, First Out)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-semibold">Reorder Point</label>
                        <input 
                          type="number" 
                          className="w-full text-[13px] border border-slate-300 rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                          value={reorderPoint}
                          onChange={(e) => setReorderPoint(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-semibold">Opening Stock Quantity</label>
                        <input 
                          type="number" 
                          className="w-full text-[13px] border border-slate-300 rounded p-1.5 focus:outline-hidden focus:border-blue-500 shadow-xs"
                          value={initialQty}
                          onChange={(e) => setInitialQty(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Cancellation and Returns Section */}
                <div className="bg-white p-5 rounded-md border border-slate-200 space-y-4">
                  <h4 className="text-[14px] font-bold text-slate-800 border-b border-slate-100 pb-2">Cancellation and Returns</h4>
                  
                  <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                    <div className="flex items-center justify-end gap-1">
                      <label className="text-slate-600 font-semibold">Returnable Item</label>
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="returnableItem"
                          checked={returnableItem === 'yes'}
                          onChange={() => setReturnableItem('yes')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                        />
                        <span className="text-slate-700 font-medium">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="returnableItem"
                          checked={returnableItem === 'no'}
                          onChange={() => setReturnableItem('no')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                        />
                        <span className="text-slate-700 font-medium">No</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 8. Fulfillment Details Section */}
                <div className="bg-white p-5 rounded-md border border-slate-200 space-y-4">
                  <h4 className="text-[14px] font-bold text-slate-800 border-b border-slate-100 pb-2">Fulfillment Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dimensions Row */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-semibold block">Dimensions</label>
                      <div className="flex items-center">
                        <input 
                          type="text" 
                          className="w-16 border border-slate-300 px-2 py-1.5 text-center text-[12px] rounded-l focus:outline-hidden"
                          placeholder="L" 
                          value={dimL}
                          onChange={(e) => setDimL(e.target.value)}
                        />
                        <span className="bg-slate-50 border-y border-slate-300 px-1.5 text-[#94a3b8]">x</span>
                        <input 
                          type="text" 
                          className="w-16 border border-slate-300 px-2 py-1.5 text-center text-[12px] focus:outline-hidden"
                          placeholder="W" 
                          value={dimW}
                          onChange={(e) => setDimW(e.target.value)}
                        />
                        <span className="bg-slate-50 border-y border-slate-300 px-1.5 text-[#94a3b8]">x</span>
                        <input 
                          type="text" 
                          className="w-16 border border-slate-300 px-2 py-1.5 text-center text-[12px] focus:outline-hidden"
                          placeholder="H" 
                          value={dimH}
                          onChange={(e) => setDimH(e.target.value)}
                        />
                        <select 
                          className="bg-slate-50 border border-slate-300 border-l-0 rounded-r px-2 py-1.5 text-[12px] text-slate-600 font-semibold focus:outline-hidden"
                          value={dimUnit}
                          onChange={(e) => setDimUnit(e.target.value)}
                        >
                          <option value="cm">cm</option>
                          <option value="inch">inch</option>
                        </select>
                      </div>
                      <span className="block text-[10px] text-slate-400 mt-1">(Length X Width X Height)</span>
                    </div>

                    {/* Weight Row */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-semibold block">Weight</label>
                      <div className="flex items-center">
                        <input 
                          type="text" 
                          className="w-full max-w-[150px] border border-slate-300 px-3 py-1.5 text-[13px] rounded-l focus:outline-hidden"
                          placeholder="0.0"
                          value={weightVal}
                          onChange={(e) => setWeightVal(e.target.value)}
                        />
                        <select 
                          className="bg-slate-50 border border-slate-300 border-l-0 rounded-r px-2.5 py-1.5 text-[12px] text-slate-600 font-semibold focus:outline-hidden"
                          value={weightUnit}
                          onChange={(e) => setWeightUnit(e.target.value)}
                        >
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-white p-4 border-t border-slate-200 flex items-center justify-start gap-3">
              <button 
                type="submit" 
                form="new-spareflow-item-form"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#2485e8] hover:bg-[#1a74d4] text-white font-semibold text-[13px] rounded transition-colors shadow-sm cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[13px] rounded transition-colors shadow-xs"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
