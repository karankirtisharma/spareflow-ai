import React, { useState, useEffect } from 'react';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, ChevronDown, FileDown,
  Search, Trash2, CheckCircle2, AlertCircle, Calendar, RefreshCw, FileSpreadsheet,
  PlusCircle, MinusCircle, User, CreditCard, ChevronRight, Download, X,
  ArrowRight, ArrowLeftRight, Check, UploadCloud, Info, AlertTriangle, Layers, TrendingUp
} from 'lucide-react';
import { useInventoryStore, Item } from '../../stores/inventoryStore.js';
import { motion, AnimatePresence } from 'motion/react';

interface AdjustmentItem {
  productId: string;
  qtyAvailable: number;
  newQty: number;
  qtyAdjusted: number;
  currentValue: number;
  newValue: number;
  valueAdjusted: number;
}

interface AdjustmentRecord {
  id: string;
  mode: 'quantity' | 'value';
  referenceNumber: string;
  date: string;
  account: string;
  reason: string;
  warehouseId: string;
  description: string;
  status: 'Draft' | 'Adjusted';
  items: AdjustmentItem[];
  attachedFiles: string[];
}

export function InventoryAdjustmentsList() {
  const { 
    items: productsList, 
    warehouses, 
    locationInventory, 
    stockMovements,
    fetchItems, 
    fetchWarehouses, 
    fetchLocationInventory, 
    fetchStockMovements, 
    adjustStock 
  } = useInventoryStore();

  // Load adjustments from localStorage on mount
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showFifoModal, setShowFifoModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<AdjustmentRecord | null>(null);

  // New Adjustment Form State
  const [mode, setMode] = useState<'quantity' | 'value'>('quantity');
  const [referenceNumber, setReferenceNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [warehouseId, setWarehouseId] = useState("");
  const [account, setAccount] = useState("Cost of Goods Sold");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [formItems, setFormItems] = useState<AdjustmentItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Status message
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIFO Lot report search / filters
  const [fifoSearchProduct, setFifoSearchProduct] = useState("");

  // Initialize data
  useEffect(() => {
    fetchItems();
    fetchWarehouses();
    fetchLocationInventory();
    fetchStockMovements();

    // Load adjustments from localStorage
    const saved = localStorage.getItem('spareflow_inventory_adjustments');
    if (saved) {
      try {
        setAdjustments(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse adjustments", e);
      }
    } else {
      // Seed initial mock adjustments
      const mockAdjs: AdjustmentRecord[] = [
        {
          id: 'adj-1',
          mode: 'quantity',
          referenceNumber: 'ADJ-2026-0042',
          date: '2026-06-15',
          account: 'Cost of Goods Sold',
          reason: 'Cycle Count discrepancy',
          warehouseId: 'w1',
          description: 'Regular monthly audit adjustment for warehouse discrepancy',
          status: 'Adjusted',
          items: [
            {
              productId: productsList[0]?.id || '1',
              qtyAvailable: 45,
              newQty: 50,
              qtyAdjusted: 5,
              currentValue: 1200,
              newValue: 1200,
              valueAdjusted: 0
            }
          ],
          attachedFiles: []
        },
        {
          id: 'adj-2',
          mode: 'value',
          referenceNumber: 'ADJ-2026-0089',
          date: '2026-06-20',
          account: 'Inventory Asset',
          reason: 'Inventory Revaluation',
          warehouseId: 'w1',
          description: 'Yearly revaluation of obsolete filters',
          status: 'Draft',
          items: [
            {
              productId: productsList[1]?.id || '2',
              qtyAvailable: 10,
              newQty: 10,
              qtyAdjusted: 0,
              currentValue: 450,
              newValue: 400,
              valueAdjusted: -50
            }
          ],
          attachedFiles: ['obsolete_reval_doc.pdf']
        }
      ];
      setAdjustments(mockAdjs);
      localStorage.setItem('spareflow_inventory_adjustments', JSON.stringify(mockAdjs));
    }
  }, []);

  // Update localStorage helper
  const saveToLocalStorage = (list: AdjustmentRecord[]) => {
    setAdjustments(list);
    localStorage.setItem('spareflow_inventory_adjustments', JSON.stringify(list));
  };

  // Get live stock in warehouse
  const getQtyAvailable = (pId: string, wId: string) => {
    const prodIdNum = Number(pId);
    const whIdNum = Number(wId);
    if (!prodIdNum || !whIdNum) return 0;

    const locRec = locationInventory.find(li => Number(li.productId) === prodIdNum && Number(li.warehouseId) === whIdNum);
    if (locRec) return Number(locRec.qtyOnHand);

    const mainProd = productsList.find(p => Number(p.id) === prodIdNum);
    return mainProd ? Number(mainProd.qty_on_hand) : 0;
  };

  // Handle open New Adjustment modal
  const handleOpenNewModal = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setReferenceNumber(`ADJ-2026-${rand}`);
    setDate(new Date().toISOString().split("T")[0]);
    
    const initialWhId = warehouses[0]?.id || 'w1';
    setWarehouseId(String(initialWhId));
    setAccount("Cost of Goods Sold");
    setReason("Cycle Count discrepancy");
    setDescription("");
    setUploadedFiles([]);
    setFormError(null);
    setFormSuccess(null);

    // Default first product
    const defaultProduct = productsList[0];
    const qtyAvail = defaultProduct ? getQtyAvailable(String(defaultProduct.id), String(initialWhId)) : 0;
    const currentPrice = defaultProduct ? parseFloat(String(defaultProduct.purchase_price || 0)) : 0;

    setFormItems([
      {
        productId: defaultProduct ? String(defaultProduct.id) : "",
        qtyAvailable: qtyAvail,
        newQty: qtyAvail,
        qtyAdjusted: 0,
        currentValue: currentPrice,
        newValue: currentPrice,
        valueAdjusted: 0
      }
    ]);
    setShowNewModal(true);
  };

  // Recalculate quantities when warehouse changes
  const handleWarehouseChange = (wId: string) => {
    setWarehouseId(wId);
    const updated = formItems.map(item => {
      const qtyAvail = getQtyAvailable(item.productId, wId);
      return {
        ...item,
        qtyAvailable: qtyAvail,
        newQty: qtyAvail,
        qtyAdjusted: 0
      };
    });
    setFormItems(updated);
  };

  // Handle product select change
  const handleProductChange = (index: number, pId: string) => {
    const qtyAvail = getQtyAvailable(pId, warehouseId);
    const prod = productsList.find(p => String(p.id) === pId);
    const currentPrice = prod ? parseFloat(String(prod.purchase_price || 0)) : 0;
    
    const updated = [...formItems];
    updated[index] = {
      productId: pId,
      qtyAvailable: qtyAvail,
      newQty: qtyAvail,
      qtyAdjusted: 0,
      currentValue: currentPrice,
      newValue: currentPrice,
      valueAdjusted: 0
    };
    setFormItems(updated);
  };

  // dual-sync: Quantity Adjusted updates New Quantity
  const handleQtyAdjustedChange = (index: number, val: number) => {
    const updated = [...formItems];
    const item = updated[index];
    item.qtyAdjusted = val;
    item.newQty = item.qtyAvailable + val;
    setFormItems(updated);
  };

  // dual-sync: New Quantity updates Quantity Adjusted
  const handleNewQtyChange = (index: number, val: number) => {
    const updated = [...formItems];
    const item = updated[index];
    item.newQty = Math.max(0, val);
    item.qtyAdjusted = item.newQty - item.qtyAvailable;
    setFormItems(updated);
  };

  // dual-sync: Value Adjusted updates New Value
  const handleValueAdjustedChange = (index: number, val: number) => {
    const updated = [...formItems];
    const item = updated[index];
    item.valueAdjusted = val;
    item.newValue = Math.max(0, item.currentValue + val);
    setFormItems(updated);
  };

  // dual-sync: New Value updates Value Adjusted
  const handleNewValueChange = (index: number, val: number) => {
    const updated = [...formItems];
    const item = updated[index];
    item.newValue = Math.max(0, val);
    item.valueAdjusted = item.newValue - item.currentValue;
    setFormItems(updated);
  };

  const addRow = () => {
    const defaultProduct = productsList[0];
    const qtyAvail = defaultProduct ? getQtyAvailable(String(defaultProduct.id), warehouseId) : 0;
    const currentPrice = defaultProduct ? parseFloat(String(defaultProduct.purchase_price || 0)) : 0;

    setFormItems([
      ...formItems,
      {
        productId: defaultProduct ? String(defaultProduct.id) : "",
        qtyAvailable: qtyAvail,
        newQty: qtyAvail,
        qtyAdjusted: 0,
        currentValue: currentPrice,
        newValue: currentPrice,
        valueAdjusted: 0
      }
    ]);
  };

  const removeRow = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  // Add items in bulk modal action
  const handleAddBulkItems = (selectedProductIds: string[]) => {
    const newItems = selectedProductIds.map(pId => {
      const qtyAvail = getQtyAvailable(pId, warehouseId);
      const prod = productsList.find(p => String(p.id) === pId);
      const currentPrice = prod ? parseFloat(String(prod.purchase_price || 0)) : 0;
      return {
        productId: pId,
        qtyAvailable: qtyAvail,
        newQty: qtyAvail,
        qtyAdjusted: 0,
        currentValue: currentPrice,
        newValue: currentPrice,
        valueAdjusted: 0
      };
    });
    setFormItems([...formItems.filter(f => f.productId !== ""), ...newItems]);
    setShowBulkModal(false);
  };

  // File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        files.push(e.dataTransfer.files[i].name);
      }
      setUploadedFiles([...uploadedFiles, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        files.push(e.target.files[i].name);
      }
      setUploadedFiles([...uploadedFiles, ...files]);
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Form Submit: Save as Draft or Adjusted
  const handleSaveAdjustment = async (status: 'Draft' | 'Adjusted') => {
    setFormError(null);
    setFormSuccess(null);

    // Validate
    if (formItems.some(f => !f.productId)) {
      setFormError("Please select a product for all rows.");
      return;
    }

    if (!reason) {
      setFormError("Please select an adjustment reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      // If converting to Adjusted, call the backend stock movement API for each changed item
      if (status === 'Adjusted') {
        for (const item of formItems) {
          if (mode === 'quantity' && item.qtyAdjusted !== 0) {
            const success = await adjustStock(
              item.productId,
              warehouseId,
              item.qtyAdjusted,
              `Adjustment [${referenceNumber}]: ${reason}. ${description}`
            );
            if (!success) {
              throw new Error(`Failed to adjust stock in backend for item ID: ${item.productId}`);
            }
          }
        }
      }

      // Save adjustment document
      const newAdjustment: AdjustmentRecord = {
        id: `adj-${Date.now()}`,
        mode,
        referenceNumber,
        date,
        account,
        reason,
        warehouseId,
        description,
        status,
        items: formItems,
        attachedFiles: uploadedFiles
      };

      const updatedList = [newAdjustment, ...adjustments];
      saveToLocalStorage(updatedList);

      setFormSuccess(status === 'Adjusted' ? "Inventory adjusted successfully!" : "Draft saved successfully!");
      
      // Refresh current store items and inventory levels
      fetchItems();
      fetchLocationInventory();
      fetchStockMovements();

      setTimeout(() => {
        setShowNewModal(false);
      }, 1000);

    } catch (e: any) {
      setFormError(e.message || "An error occurred while saving the adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finalize an existing Draft adjustment
  const handleFinalizeDraft = async (draft: AdjustmentRecord) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      if (draft.mode === 'quantity') {
        for (const item of draft.items) {
          if (item.qtyAdjusted !== 0) {
            const success = await adjustStock(
              item.productId,
              draft.warehouseId,
              item.qtyAdjusted,
              `Finalized Draft [${draft.referenceNumber}]: ${draft.reason}. ${draft.description}`
            );
            if (!success) {
              throw new Error(`Failed backend adjustment for item ID: ${item.productId}`);
            }
          }
        }
      }

      // Update in list
      const updatedList = adjustments.map(adj => {
        if (adj.id === draft.id) {
          return { ...adj, status: 'Adjusted' as const };
        }
        return adj;
      });
      saveToLocalStorage(updatedList);
      
      // Update local state if detail drawer is open
      setSelectedAdjustment({ ...draft, status: 'Adjusted' });

      // Refresh quantities
      fetchItems();
      fetchLocationInventory();
      fetchStockMovements();

      alert("Adjustment successfully applied and synced with inventory databases!");

    } catch (e: any) {
      alert(e.message || "Failed to finalize adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete an adjustment record
  const handleDeleteAdjustment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this adjustment record from the registry?")) {
      const updated = adjustments.filter(a => a.id !== id);
      saveToLocalStorage(updated);
      setSelectedAdjustment(null);
    }
  };

  // Filter Adjustments list
  const filteredAdjustments = adjustments.filter(adj => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      adj.referenceNumber.toLowerCase().includes(searchLower) ||
      adj.reason.toLowerCase().includes(searchLower) ||
      adj.account.toLowerCase().includes(searchLower) ||
      adj.description.toLowerCase().includes(searchLower);

    let matchType = true;
    if (typeFilter !== 'all') {
      matchType = adj.mode === typeFilter;
    }

    let matchPeriod = true;
    if (periodFilter !== 'all') {
      const adjDate = new Date(adj.date);
      const now = new Date();
      if (periodFilter === 'this_month') {
        matchPeriod = adjDate.getMonth() === now.getMonth() && adjDate.getFullYear() === now.getFullYear();
      } else if (periodFilter === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        matchPeriod = adjDate.getMonth() === lastMonth && adjDate.getFullYear() === year;
      } else if (periodFilter === 'this_year') {
        matchPeriod = adjDate.getFullYear() === now.getFullYear();
      }
    }

    return matchSearch && matchType && matchPeriod;
  });

  // Calculate totals adjusted
  const totalAdjustmentsCount = adjustments.length;
  const completedAdjustmentsCount = adjustments.filter(a => a.status === 'Adjusted').length;
  const draftAdjustmentsCount = adjustments.filter(a => a.status === 'Draft').length;

  // FIFO Lot Calculations (for report)
  // Reconstruct FIFO lot queue from movements
  const getFifoLotsForProduct = (pId: string) => {
    const prodIdNum = Number(pId);
    if (!prodIdNum) return [];

    // Filter positive stock movements (purchases, receipts, stock_additions)
    const movements = [...stockMovements]
      .filter(sm => Number(sm.productId) === prodIdNum)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    interface FifoLot {
      id: string;
      date: string;
      initialQty: number;
      qtyRemaining: number;
      unitPrice: number;
      reference: string;
    }

    const lots: FifoLot[] = [];
    const prod = productsList.find(p => Number(p.id) === prodIdNum);
    const costPrice = prod ? parseFloat(String(prod.purchase_price || 0)) : 100;

    // First, reconstruct active positive additions as lots
    movements.forEach(m => {
      const qtyNum = Number(m.qty);
      if (qtyNum > 0) {
        lots.push({
          id: `lot-${m.id}`,
          date: m.createdAt.split('T')[0],
          initialQty: qtyNum,
          qtyRemaining: qtyNum,
          unitPrice: costPrice, // simplified standard cost or fetch from purchase orders if available
          reference: m.referenceId || "Direct Addition"
        });
      }
    });

    // Then, deduct negative movements from the oldest available lots
    movements.forEach(m => {
      let qtyNum = Number(m.qty);
      if (qtyNum < 0) {
        let deduction = Math.abs(qtyNum);
        for (let i = 0; i < lots.length; i++) {
          if (deduction <= 0) break;
          const lot = lots[i];
          if (lot.qtyRemaining > 0) {
            if (lot.qtyRemaining >= deduction) {
              lot.qtyRemaining -= deduction;
              deduction = 0;
            } else {
              deduction -= lot.qtyRemaining;
              lot.qtyRemaining = 0;
            }
          }
        }
      }
    });

    return lots;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-full relative font-sans overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 shadow-3xs">
        <div className="flex flex-col">
          <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-2">
            Inventory Adjustments
          </h2>
          <p className="text-[11.5px] text-slate-400 mt-0.5">Audit, revalue, and adjust warehouse quantities</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* FIFO cost lot tracking report link */}
          <button 
            onClick={() => setShowFifoModal(true)}
            className="border border-[#2485e8] hover:bg-blue-50 text-[#2485e8] px-3.5 py-1.5 rounded-[4px] text-[13px] font-bold flex items-center gap-1.5 shadow-3xs transition-colors cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-[#2485e8]" /> FIFO Cost Lot Tracking Report
          </button>

          {/* Create Button */}
          <button 
            onClick={handleOpenNewModal}
            className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Adjustment
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

      {/* Mini KPI Dashboard Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-4 shrink-0">
        
        {/* Total adjustments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Adjustments</span>
            <strong className="text-[20px] font-extrabold text-slate-800 block mt-1">
              {totalAdjustmentsCount} Documents
            </strong>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Finalized Adjustments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Adjusted & Applied</span>
            <strong className="text-[20px] font-extrabold text-emerald-600 block mt-1">
              {completedAdjustmentsCount} Applied
            </strong>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Draft adjustments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Drafts</span>
            <strong className="text-[20px] font-extrabold text-amber-500 block mt-1">
              {draftAdjustmentsCount} Drafts
            </strong>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filters & Search */}
      <div className="px-6 pb-4 flex items-center justify-between gap-4 shrink-0">
        
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Search by ref #, reason, account, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full bg-white border border-slate-250 rounded-[4px] text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-3xs"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Type */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-400 font-bold">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded text-[12.5px] py-1 px-2.5 font-semibold text-slate-600 cursor-pointer focus:outline-none"
            >
              <option value="all">All Modes</option>
              <option value="quantity">Quantity Adjustment</option>
              <option value="value">Value Adjustment</option>
            </select>
          </div>

          {/* Filter Period */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-400 font-bold">Period:</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded text-[12.5px] py-1 px-2.5 font-semibold text-slate-600 cursor-pointer focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
        </div>

      </div>

      {/* Main Table / Empty State */}
      <div className="flex-1 overflow-auto mx-6 mb-6 bg-white border border-slate-200 rounded-xl shadow-3xs">
        {filteredAdjustments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl">
            <Layers className="w-16 h-16 text-slate-300 stroke-[1.2px] mb-3" />
            <h3 className="text-[18px] font-extrabold text-slate-700">Keep Your Inventory Accurate</h3>
            <p className="text-[13px] text-slate-400 mt-1 max-w-md">
              Adjust your inventory to ensure accurate quantity and value. Create adjustments for damaged goods, revaluations, or cycle count discrepancy audits.
            </p>
            <div className="mt-5">
              <button 
                onClick={handleOpenNewModal}
                className="bg-[#2485e8] text-white hover:bg-[#1a74d4] px-5 py-2 rounded text-[13px] font-bold shadow-xs cursor-pointer"
              >
                CREATE ADJUSTMENT
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Reference Number</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Account</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdjustments.map((adj) => {
                const wh = warehouses.find(w => String(w.id) === adj.warehouseId);
                return (
                  <tr 
                    key={adj.id}
                    onClick={() => setSelectedAdjustment(adj)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {adj.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2485e8] font-mono tracking-tight">
                      {adj.referenceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 w-max ${
                        adj.mode === 'quantity' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        <ArrowLeftRight className="w-3 h-3" />
                        {adj.mode === 'quantity' ? 'Quantity' : 'Value'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {adj.account}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">
                      {adj.reason}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {wh?.name || "Main Warehouse"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wide border ${
                        adj.status === 'Adjusted' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {adj.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-600">
                      {adj.items.length} items
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={(e) => handleDeleteAdjustment(adj.id, e)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: NEW INVENTORY ADJUSTMENT */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center bg-slate-950/40 backdrop-blur-xs p-4 pt-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-250 w-full max-w-4xl overflow-hidden mb-12"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div>
                  <h3 className="text-[16px] font-extrabold text-slate-800">New Inventory Adjustment</h3>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">Adjust stock levels or asset value for stock auditing</p>
                </div>
                <button 
                  onClick={() => setShowNewModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                
                {/* Mode of adjustment */}
                <div className="flex items-center gap-6 py-1">
                  <span className="text-[13px] font-bold text-slate-500">Mode of adjustment</span>
                  
                  <label className="flex items-center gap-2 cursor-pointer text-[13.5px] font-bold text-slate-700">
                    <input 
                      type="radio" 
                      name="adjMode" 
                      checked={mode === 'quantity'} 
                      onChange={() => setMode('quantity')}
                      className="w-4 h-4 text-[#2485e8] cursor-pointer" 
                    />
                    Quantity Adjustment
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[13.5px] font-bold text-slate-700">
                    <input 
                      type="radio" 
                      name="adjMode" 
                      checked={mode === 'value'} 
                      onChange={() => setMode('value')}
                      className="w-4 h-4 text-[#2485e8] cursor-pointer" 
                    />
                    Value Adjustment
                  </label>
                </div>

                {/* Form Fields Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Reference Number */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Reference Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. ADJ-2026-9912"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Date *</label>
                    <input 
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                    />
                  </div>

                  {/* Warehouse */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Warehouse *</label>
                    <select
                      value={warehouseId}
                      onChange={(e) => handleWarehouseChange(e.target.value)}
                      required
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Form Fields Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Account */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Account *</label>
                    <select
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      required
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                    >
                      <option value="Cost of Goods Sold">Cost of Goods Sold (COGS)</option>
                      <option value="Inventory Asset">Inventory Asset Account</option>
                      <option value="Stock Discrepancy Expense">Stock Discrepancy Expense</option>
                      <option value="Exchange Gain/Loss">Exchange Gain/Loss</option>
                      <option value="Advertising and Marketing">Advertising and Marketing</option>
                    </select>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Reason *</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                    >
                      <option value="">Select a reason</option>
                      <option value="Cycle Count discrepancy">Cycle Count discrepancy</option>
                      <option value="Stock on fire">Stock on fire</option>
                      <option value="Damaged goods">Damaged goods</option>
                      <option value="Written off">Written off</option>
                      <option value="Inventory Revaluation">Inventory Revaluation</option>
                      <option value="Theft or Loss">Theft or Loss</option>
                      <option value="Obsolete Stock conversion">Obsolete Stock conversion</option>
                      <option value="Other">Other (Audit Adjustments)</option>
                    </select>
                  </div>

                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-bold text-slate-600">Description</label>
                    <span className="text-[10px] font-bold text-slate-400">{description.length}/500 chars</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Max. 500 characters describing this inventory re-audit"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded p-2.5 focus:border-blue-500 focus:outline-none w-full leading-normal"
                  />
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-3xs">
                  <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                    <span className="text-[12.5px] font-extrabold text-slate-700">Item Grid</span>
                    <button 
                      type="button" 
                      onClick={() => setShowBulkModal(true)}
                      className="text-[#2485e8] hover:text-[#1a74d4] text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      Bulk Actions / Select Items in Bulk
                    </button>
                  </div>

                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                      {mode === 'quantity' ? (
                        <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Item Details</th>
                          <th className="py-2.5 px-3 w-36 text-center">Quantity Available</th>
                          <th className="py-2.5 px-3 w-40 text-center">New Quantity on Hand</th>
                          <th className="py-2.5 px-3 w-40 text-center">Quantity Adjusted</th>
                          <th className="py-2.5 px-2 w-12 text-center">Action</th>
                        </tr>
                      ) : (
                        <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Item Details</th>
                          <th className="py-2.5 px-3 w-36 text-center">Current Asset Value</th>
                          <th className="py-2.5 px-3 w-40 text-center">New Asset Value</th>
                          <th className="py-2.5 px-3 w-40 text-center">Value Adjusted</th>
                          <th className="py-2.5 px-2 w-12 text-center">Action</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((formItem, index) => (
                        <tr key={index} className="hover:bg-slate-50/20">
                          {/* Item Details */}
                          <td className="py-2.5 px-3">
                            <select
                              value={formItem.productId}
                              onChange={(e) => handleProductChange(index, e.target.value)}
                              required
                              className="bg-white border border-slate-250 text-[12.5px] text-slate-800 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                            >
                              <option value="">Select an Item</option>
                              {productsList.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                              ))}
                            </select>
                          </td>

                          {/* Quantity Columns */}
                          {mode === 'quantity' ? (
                            <>
                              {/* Quantity Available */}
                              <td className="py-2.5 px-3 text-center bg-slate-50/50 text-slate-500 font-mono font-bold">
                                {formItem.qtyAvailable.toFixed(2)}
                              </td>

                              {/* New Quantity on Hand */}
                              <td className="py-2.5 px-3">
                                <input 
                                  type="number"
                                  min="0"
                                  value={formItem.newQty}
                                  onChange={(e) => handleNewQtyChange(index, parseFloat(e.target.value) || 0)}
                                  className="bg-white border border-slate-250 text-[12.5px] text-slate-800 rounded px-2.5 py-1 focus:border-blue-500 focus:outline-none w-full font-mono text-center"
                                />
                              </td>

                              {/* Quantity Adjusted */}
                              <td className="py-2.5 px-3">
                                <input 
                                  type="number"
                                  placeholder="Eg. +10, -10"
                                  value={formItem.qtyAdjusted === 0 ? "" : formItem.qtyAdjusted}
                                  onChange={(e) => handleQtyAdjustedChange(index, parseFloat(e.target.value) || 0)}
                                  className={`border text-[12.5px] rounded px-2.5 py-1 focus:outline-none w-full font-mono text-center ${
                                    formItem.qtyAdjusted > 0 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-250 focus:border-emerald-500' 
                                      : formItem.qtyAdjusted < 0 
                                      ? 'bg-rose-50 text-rose-800 border-rose-250 focus:border-rose-500' 
                                      : 'bg-white border-slate-250 focus:border-blue-500'
                                  }`}
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Current Value */}
                              <td className="py-2.5 px-3 text-center bg-slate-50/50 text-slate-500 font-mono font-bold">
                                ₹{formItem.currentValue.toFixed(2)}
                              </td>

                              {/* New Value */}
                              <td className="py-2.5 px-3">
                                <input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formItem.newValue}
                                  onChange={(e) => handleNewValueChange(index, parseFloat(e.target.value) || 0)}
                                  className="bg-white border border-slate-250 text-[12.5px] text-slate-800 rounded px-2.5 py-1 focus:border-blue-500 focus:outline-none w-full font-mono text-center"
                                />
                              </td>

                              {/* Value Adjusted */}
                              <td className="py-2.5 px-3">
                                <input 
                                  type="number"
                                  step="0.01"
                                  placeholder="Eg. +50, -50"
                                  value={formItem.valueAdjusted === 0 ? "" : formItem.valueAdjusted}
                                  onChange={(e) => handleValueAdjustedChange(index, parseFloat(e.target.value) || 0)}
                                  className={`border text-[12.5px] rounded px-2.5 py-1 focus:outline-none w-full font-mono text-center ${
                                    formItem.valueAdjusted > 0 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-250 focus:border-emerald-500' 
                                      : formItem.valueAdjusted < 0 
                                      ? 'bg-rose-50 text-rose-800 border-rose-250 focus:border-rose-500' 
                                      : 'bg-white border-slate-250 focus:border-blue-500'
                                  }`}
                                />
                              </td>
                            </>
                          )}

                          {/* Delete row */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(index)}
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

                  {/* Add Row Button */}
                  <div className="bg-slate-50/50 p-2.5 border-t border-slate-150 flex justify-start">
                    <button
                      type="button"
                      onClick={addRow}
                      className="text-blue-600 hover:text-blue-800 text-[12px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-4.5 h-4.5" /> Add New Row
                    </button>
                  </div>
                </div>

                {/* Attach File(s) Section */}
                <div className="space-y-2">
                  <label className="block text-[12.5px] font-bold text-slate-600">Attach File(s) to inventory adjustment</label>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-50/30 scale-[0.99]' 
                        : 'border-slate-250 hover:border-blue-400 bg-slate-50/20'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="adjFileInput"
                      multiple
                      className="hidden" 
                      onChange={handleFileSelect} 
                    />
                    <label htmlFor="adjFileInput" className="cursor-pointer flex flex-col items-center justify-center">
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5px]" />
                      <span className="text-[13px] font-bold text-slate-700">Drag & Drop files here, or <span className="text-[#2485e8] hover:underline">browse</span></span>
                      <span className="text-[11px] text-slate-400 mt-1 block">You can upload a maximum of 5 files, 10MB each</span>
                    </label>
                  </div>

                  {/* Uploaded Files Queue */}
                  {uploadedFiles.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Attached Files ({uploadedFiles.length})</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {uploadedFiles.map((fname, idx) => (
                          <div key={idx} className="bg-white px-2.5 py-1.5 rounded border border-slate-150 flex items-center justify-between text-[12px]">
                            <span className="font-medium text-slate-600 truncate max-w-[200px]" title={fname}>{fname}</span>
                            <button 
                              type="button" 
                              onClick={() => removeUploadedFile(idx)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Status messages */}
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[12.5px] rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[12.5px] rounded-md flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981] shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="text-slate-600 border border-slate-300 hover:bg-slate-100 px-4 py-1.5 rounded text-[13px] font-bold bg-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSaveAdjustment('Draft')}
                    className="text-slate-700 hover:bg-slate-100 border border-slate-300 bg-white font-bold text-[13px] px-4 py-1.5 rounded shadow-3xs cursor-pointer transition-colors"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSaveAdjustment('Adjusted')}
                    className="bg-[#2485e8] hover:bg-[#1a74d4] disabled:opacity-50 text-white font-bold text-[13px] px-5 py-1.5 rounded shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>Convert to Adjusted</>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL DRAWER / PANE */}
      <AnimatePresence>
        {selectedAdjustment && (
          <div 
            className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-3xs" 
            onClick={() => setSelectedAdjustment(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#2485e8]">Adjustment Record</span>
                  <h3 className="text-[16px] font-extrabold text-slate-800 font-mono mt-0.5">{selectedAdjustment.referenceNumber}</h3>
                </div>
                <button 
                  onClick={() => setSelectedAdjustment(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status Block */}
                <div className="flex items-center justify-between bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Mode of adjustment</span>
                    <strong className="text-[14.5px] font-bold text-slate-800 mt-1 block">
                      {selectedAdjustment.mode === 'quantity' ? 'Quantity Adjustment' : 'Value Adjustment'}
                    </strong>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-[4px] text-[10.5px] font-black uppercase tracking-wider border ${
                      selectedAdjustment.status === 'Adjusted' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                        : 'bg-amber-50 text-amber-700 border-amber-250'
                    }`}>
                      {selectedAdjustment.status}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[12.5px] border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Adjustment Date</span>
                    <span className="text-slate-700 font-bold mt-1 block font-mono">{selectedAdjustment.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Warehouse</span>
                    <span className="text-slate-700 font-semibold mt-1 block">
                      {warehouses.find(w => String(w.id) === selectedAdjustment.warehouseId)?.name || "Main Warehouse"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Account Ledger</span>
                    <span className="text-slate-700 font-semibold mt-1 block">{selectedAdjustment.account}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Audit Reason</span>
                    <span className="text-slate-700 font-bold text-rose-600 mt-1 block">{selectedAdjustment.reason}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Description Notes</span>
                    <span className="text-slate-700 font-medium mt-1 block bg-slate-50 p-2.5 rounded border border-slate-100">
                      {selectedAdjustment.description || "No descriptions specified"}
                    </span>
                  </div>
                </div>

                {/* Items breakdown list */}
                <div className="space-y-3">
                  <h4 className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest block">Items Adjusted</h4>
                  <div className="border border-slate-150 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
                    {selectedAdjustment.items.map((item, index) => {
                      const prod = productsList.find(p => String(p.id) === item.productId);
                      return (
                        <div key={index} className="p-3 flex items-center justify-between text-[12.5px]">
                          <div>
                            <strong className="text-slate-700 font-semibold block">{prod?.name || `Product ID: ${item.productId}`}</strong>
                            {selectedAdjustment.mode === 'quantity' ? (
                              <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                                Hand: <span className="font-mono text-slate-500">{item.qtyAvailable}</span> → New: <span className="font-mono text-slate-500">{item.newQty}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                                Price: <span className="font-mono text-slate-500">₹{item.currentValue}</span> → New: <span className="font-mono text-slate-500">₹{item.newValue}</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Adjusted amount badge */}
                          {selectedAdjustment.mode === 'quantity' ? (
                            <strong className={`font-mono font-extrabold text-[13.5px] ${
                              item.qtyAdjusted > 0 ? 'text-emerald-600' : item.qtyAdjusted < 0 ? 'text-rose-600' : 'text-slate-500'
                            }`}>
                              {item.qtyAdjusted > 0 ? `+${item.qtyAdjusted}` : item.qtyAdjusted} units
                            </strong>
                          ) : (
                            <strong className={`font-mono font-extrabold text-[13.5px] ${
                              item.valueAdjusted > 0 ? 'text-emerald-600' : item.valueAdjusted < 0 ? 'text-rose-600' : 'text-slate-500'
                            }`}>
                              {item.valueAdjusted > 0 ? `+₹${item.valueAdjusted}` : `₹${item.valueAdjusted}`}
                            </strong>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Attached Files List */}
                {selectedAdjustment.attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Attached Documents</span>
                    <div className="space-y-1.5">
                      {selectedAdjustment.attachedFiles.map((fname, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg flex items-center justify-between text-[12px]">
                          <span className="text-slate-600 font-medium">{fname}</span>
                          <button className="text-[#2485e8] hover:underline flex items-center gap-1 font-bold cursor-pointer">
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Footer Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center gap-2">
                {selectedAdjustment.status === 'Draft' ? (
                  <>
                    <button 
                      onClick={() => setSelectedAdjustment(null)}
                      className="w-1/3 text-slate-600 border border-slate-300 hover:bg-slate-100 font-bold text-[12.5px] py-2 rounded bg-white transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button 
                      onClick={() => handleFinalizeDraft(selectedAdjustment)}
                      disabled={isSubmitting}
                      className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12.5px] py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> finalising...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Convert to Adjusted Now
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setSelectedAdjustment(null)}
                    className="w-full text-slate-600 border border-slate-300 hover:bg-slate-100 font-bold text-[12.5px] py-2 rounded bg-white transition-colors cursor-pointer"
                  >
                    Close Pane
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: BULK SELECT ITEMS */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center bg-slate-950/45 backdrop-blur-xs p-4 pt-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-250 w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                <span className="text-[13.5px] font-black text-slate-800">Add Items in Bulk</span>
                <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <BulkItemSelector 
                products={productsList} 
                onSelect={handleAddBulkItems} 
                onCancel={() => setShowBulkModal(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: FIFO COST LOT TRACKING REPORT */}
      <AnimatePresence>
        {showFifoModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center bg-slate-950/40 backdrop-blur-xs p-4 pt-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-250 w-full max-w-3xl overflow-hidden mb-12"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div>
                  <h3 className="text-[15.5px] font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" /> FIFO Cost Lot Tracking Ledger
                  </h3>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">Audit-trail reconstruction showing First-In, First-Out costing loops</p>
                </div>
                <button onClick={() => setShowFifoModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                
                {/* Info Note */}
                <div className="bg-blue-50 border border-blue-150 p-3.5 rounded-lg text-[12px] text-blue-800 flex gap-2.5 leading-relaxed">
                  <Info className="w-4 h-4 text-[#2485e8] shrink-0 mt-0.5" />
                  <div>
                    <strong>First-In, First-Out Cost Principle:</strong> This ledger shows all inventory batches (lots) currently active or consumed, generated dynamically from the stock transaction log. Incoming batches retain their exact purchase value, and outgoing movements deduct from the oldest batches first.
                  </div>
                </div>

                {/* Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Select Product to Audit Lots</label>
                  <select
                    value={fifoSearchProduct}
                    onChange={(e) => setFifoSearchProduct(e.target.value)}
                    className="bg-white border border-slate-350 rounded p-2 text-[13px] text-slate-800 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- Choose a Product --</option>
                    {productsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                {/* Lot list table */}
                {fifoSearchProduct ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-[12.5px] font-extrabold text-slate-700">Active FIFO Lots Queue</h4>
                      <span className="text-[11.5px] text-slate-400">Showing batches for the selected item</span>
                    </div>

                    {getFifoLotsForProduct(fifoSearchProduct).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-[12.5px] italic border border-dashed border-slate-200 rounded-lg">
                        No active purchase or adjustment batches (lots) recorded for this item.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse text-[12.5px]">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9.5px]">
                            <tr>
                              <th className="py-2 px-3">Lot Received Date</th>
                              <th className="py-2 px-3">Batch Reference</th>
                              <th className="py-2 px-3 text-right">Unit Lot Cost</th>
                              <th className="py-2 px-3 text-center">Initial Qty</th>
                              <th className="py-2 px-3 text-center">Remaining Qty</th>
                              <th className="py-2 px-3 text-right">Remaining Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {getFifoLotsForProduct(fifoSearchProduct).map((lot) => (
                              <tr key={lot.id} className={lot.qtyRemaining === 0 ? 'bg-slate-50/50 opacity-40' : ''}>
                                <td className="py-2 px-3 text-slate-600 font-sans">{lot.date}</td>
                                <td className="py-2 px-3 font-semibold text-slate-800">{lot.reference}</td>
                                <td className="py-2 px-3 text-right text-slate-700">₹{lot.unitPrice.toFixed(2)}</td>
                                <td className="py-2 px-3 text-center text-slate-500">{lot.initialQty}</td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10.5px] ${
                                    lot.qtyRemaining > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {lot.qtyRemaining} units
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-slate-800">
                                  ₹{(lot.qtyRemaining * lot.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 text-[13px] italic border border-dashed border-slate-200 rounded-lg bg-slate-50/40">
                    Please choose an item above to reconstruct its active costing queues.
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button 
                  onClick={() => setShowFifoModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[13px] px-5 py-1.5 rounded cursor-pointer"
                >
                  Close Report
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Bulk Selector helper component
interface BulkSelectorProps {
  products: Item[];
  onSelect: (ids: string[]) => void;
  onCancel: () => void;
}

function BulkItemSelector({ products, onSelect, onCancel }: BulkSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-5 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        <input 
          type="text" 
          placeholder="Filter products list by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 pr-4 py-1.5 w-full border border-slate-300 rounded text-[12.5px] focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Checkboxes List */}
      <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-[12px] text-slate-400 italic">No products found.</div>
        ) : (
          filtered.map(p => (
            <label key={p.id} className="p-2.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer text-[12.5px] font-medium text-slate-700">
              <input 
                type="checkbox" 
                checked={selectedIds.includes(String(p.id))}
                onChange={() => handleToggle(String(p.id))}
                className="w-4 h-4 text-[#2485e8] rounded border-slate-300 cursor-pointer"
              />
              <div className="flex-1">
                <span className="block font-semibold text-slate-800">{p.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">{p.sku} | Unit: {p.unit}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 font-mono">Stock: {p.qty_on_hand}</span>
            </label>
          ))
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[12px] font-bold text-slate-500">{selectedIds.length} items selected</span>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={onCancel}
            className="text-slate-600 border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded text-[12.5px] font-bold cursor-pointer bg-white"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={() => onSelect(selectedIds)}
            disabled={selectedIds.length === 0}
            className="bg-[#2485e8] hover:bg-[#1a74d4] disabled:opacity-50 text-white font-bold text-[12.5px] px-4 py-1.5 rounded cursor-pointer"
          >
            Insert Selection
          </button>
        </div>
      </div>
    </div>
  );
}
