import React, { useState, useEffect } from 'react';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, ChevronDown, FileDown,
  Search, Trash2, CheckCircle2, AlertCircle, Calendar, RefreshCw, FileSpreadsheet,
  PlusCircle, MinusCircle, User, CreditCard, ChevronRight, Download, X,
  ArrowRight, ArrowLeftRight, Check, UploadCloud, Info, AlertTriangle, Layers,
  TrendingUp, Truck, Package, PackageOpen, ClipboardCheck, PlayCircle, Eye
} from 'lucide-react';
import { useInventoryStore, SalesOrder } from '../../stores/inventoryStore.js';
import { motion, AnimatePresence } from 'motion/react';

interface PackageItem {
  productId: string;
  productName: string;
  sku: string;
  qtyOrdered: number;
  qtyToPack: number;
}

interface PackageRecord {
  id: string;
  packageNumber: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  status: 'packed' | 'shipped' | 'delivered';
  items: PackageItem[];
  carrier?: string;
  trackingNumber?: string;
  shippingCharge?: number;
  shipmentDate?: string;
  warehouseId?: string;
  notes?: string;
}

interface PackagesListProps {
  onNavigateToSalesOrders?: () => void;
}

export function PackagesList({ onNavigateToSalesOrders }: PackagesListProps) {
  const { 
    salesOrders, 
    items: inventoryItems, 
    warehouses,
    fetchSalesOrders, 
    fetchItems, 
    fetchLocationInventory,
    shipSO,
    updateSalesOrderStatus
  } = useInventoryStore();

  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageRecord | null>(null);

  // Form State
  const [selectedSOId, setSelectedSOId] = useState("");
  const [packageNumber, setPackageNumber] = useState("");
  const [packageDate, setPackageDate] = useState(new Date().toISOString().split("T")[0]);
  const [formItems, setFormItems] = useState<PackageItem[]>([]);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ship Form State
  const [carrier, setCarrier] = useState("FedEx");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCharge, setShippingCharge] = useState("0");
  const [shipmentDate, setShipmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [warehouseId, setWarehouseId] = useState("");
  const [shipError, setShipError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesOrders();
    fetchItems();
    fetchLocationInventory();

    // Load from local storage
    const saved = localStorage.getItem('spareflow_packages');
    if (saved) {
      try {
        setPackages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load packages", e);
      }
    } else {
      // Seed some starting packages if there is history
      const mockPkgs: PackageRecord[] = [];
      setPackages(mockPkgs);
      localStorage.setItem('spareflow_packages', JSON.stringify(mockPkgs));
    }
  }, []);

  const saveToLocalStorage = (list: PackageRecord[]) => {
    setPackages(list);
    localStorage.setItem('spareflow_packages', JSON.stringify(list));
  };

  const handleOpenCreateModal = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPackageNumber(`PKG-2026-${rand}`);
    setPackageDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setFormError(null);
    setFormSuccess(null);

    // Filter sales orders that are draft or confirmed
    const packableOrders = salesOrders.filter(so => so.status === 'draft' || so.status === 'confirmed');
    if (packableOrders.length > 0) {
      handleSOChange(packableOrders[0].id);
    } else {
      setSelectedSOId("");
      setFormItems([]);
    }
    setShowCreateModal(true);
  };

  const handleSOChange = (soId: string) => {
    setSelectedSOId(soId);
    const so = salesOrders.find(s => s.id === soId);
    if (so && so.items) {
      const itemsToPack = so.items.map(itm => {
        const product = inventoryItems.find(p => Number(p.id) === Number(itm.productId));
        const qtyOrdered = Number(itm.qtyOrdered);
        const qtyShipped = Number(itm.qtyShipped || 0);
        const remainingToPack = Math.max(0, qtyOrdered - qtyShipped);

        return {
          productId: String(itm.productId),
          productName: product ? product.name : `Product ID: ${itm.productId}`,
          sku: product ? product.sku : 'N/A',
          qtyOrdered,
          qtyToPack: remainingToPack
        };
      });
      setFormItems(itemsToPack);
    } else {
      setFormItems([]);
    }
  };

  const handleQtyToPackChange = (index: number, val: number) => {
    const updated = [...formItems];
    const maxVal = updated[index].qtyOrdered;
    updated[index].qtyToPack = Math.min(maxVal, Math.max(0, val));
    setFormItems(updated);
  };

  const handleCreatePackage = async () => {
    setFormError(null);
    setFormSuccess(null);

    if (!selectedSOId) {
      setFormError("Please select a sales order first.");
      return;
    }

    if (formItems.length === 0 || formItems.every(itm => itm.qtyToPack <= 0)) {
      setFormError("Quantity to pack must be greater than zero for at least one item.");
      return;
    }

    const so = salesOrders.find(s => s.id === selectedSOId);
    if (!so) {
      setFormError("Selected Sales Order not found.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Rule: In case a package is created for a sales order in 'Draft' status, 
      // the sales order automatically gets updated to 'Confirmed' status.
      if (so.status === 'draft') {
        const success = await updateSalesOrderStatus(so.id, 'confirmed');
        if (!success) {
          throw new Error("Failed to automatically confirm the sales order on the server.");
        }
      }

      const newPkg: PackageRecord = {
        id: `pkg-${Date.now()}`,
        packageNumber,
        salesOrderId: so.id,
        salesOrderNumber: so.so_number,
        customerId: so.customer_id,
        customerName: so.customer_name || "General Customer",
        date: packageDate,
        status: 'packed',
        items: formItems.filter(itm => itm.qtyToPack > 0),
        notes
      };

      const updated = [newPkg, ...packages];
      saveToLocalStorage(updated);

      setFormSuccess("Package created successfully with 'Packed' status!");
      fetchSalesOrders();

      setTimeout(() => {
        setShowCreateModal(false);
      }, 1000);
    } catch (e: any) {
      setFormError(e.message || "An error occurred during package creation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenShipModal = (pkg: PackageRecord) => {
    setSelectedPackage(pkg);
    setCarrier("FedEx");
    setTrackingNumber(`TRK${Math.floor(10000000 + Math.random() * 90000000)}`);
    setShippingCharge("150");
    setShipmentDate(new Date().toISOString().split("T")[0]);
    
    const defaultWh = warehouses[0]?.id || 'w1';
    setWarehouseId(String(defaultWh));
    setShipError(null);
    setShowShipModal(true);
  };

  const handleProcessShipment = async () => {
    setShipError(null);
    if (!selectedPackage) return;

    if (!warehouseId) {
      setShipError("Source warehouse is required to ship packages.");
      return;
    }

    if (!trackingNumber.trim()) {
      setShipError("Tracking number is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform packed items into ship format: { product_id: number, qty_shipped: number }
      const shippedPayload = selectedPackage.items.map(itm => ({
        product_id: Number(itm.productId),
        qty_shipped: Number(itm.qtyToPack)
      }));

      // Call the standard backend shipSO API which deducts stock and logs audit trail!
      const success = await shipSO(selectedPackage.salesOrderId, warehouseId, shippedPayload);
      if (!success) {
        throw new Error("Insufficient stock or failed to process shipment on server.");
      }

      // Update package status to shipped
      const updatedPackages = packages.map(pkg => {
        if (pkg.id === selectedPackage.id) {
          return {
            ...pkg,
            status: 'shipped' as const,
            carrier,
            trackingNumber,
            shippingCharge: parseFloat(shippingCharge) || 0,
            shipmentDate,
            warehouseId
          };
        }
        return pkg;
      });
      saveToLocalStorage(updatedPackages);

      // Also update selectedPackage in details view
      setSelectedPackage({
        ...selectedPackage,
        status: 'shipped',
        carrier,
        trackingNumber,
        shippingCharge: parseFloat(shippingCharge) || 0,
        shipmentDate,
        warehouseId
      });

      setShowShipModal(false);
      fetchSalesOrders();
      fetchItems();
      fetchLocationInventory();

      alert("Package successfully shipped! Inventory quantities automatically updated.");
    } catch (e: any) {
      setShipError(e.message || "Failed to process shipment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsDelivered = (pkg: PackageRecord) => {
    if (confirm(`Mark Package ${pkg.packageNumber} as Delivered?`)) {
      const updated = packages.map(p => {
        if (p.id === pkg.id) {
          return { ...p, status: 'delivered' as const };
        }
        return p;
      });
      saveToLocalStorage(updated);
      setSelectedPackage({ ...pkg, status: 'delivered' });
    }
  };

  const handleDeletePackage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this package from history?")) {
      const updated = packages.filter(p => p.id !== id);
      saveToLocalStorage(updated);
      if (selectedPackage?.id === id) {
        setSelectedPackage(null);
      }
    }
  };

  const filteredPackages = packages.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      p.packageNumber.toLowerCase().includes(searchLower) ||
      p.salesOrderNumber.toLowerCase().includes(searchLower) ||
      p.customerName.toLowerCase().includes(searchLower) ||
      (p.carrier && p.carrier.toLowerCase().includes(searchLower)) ||
      (p.trackingNumber && p.trackingNumber.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-full relative font-sans overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 shadow-3xs">
        <div className="flex flex-col">
          <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-2">
            All Packages
          </h2>
          <p className="text-[11.5px] text-slate-400 mt-0.5">Track shipping container lots and dispatch logistics</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Create Button */}
          <button 
            onClick={handleOpenCreateModal}
            className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Package
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

      {/* Main Body */}
      {packages.length === 0 ? (
        /* Empty State matching screenshot exactly */
        <div className="flex-1 overflow-auto flex flex-col justify-between p-8 bg-white">
          
          {/* Center visual card */}
          <div className="flex-1 flex flex-col items-center justify-center py-10 max-w-2xl mx-auto">
            <h3 className="text-[24px] font-extrabold text-slate-800 text-center">Start Creating Packages!</h3>
            <p className="text-[13.5px] text-slate-500 mt-1.5 text-center">Create packages and ship them via carrier.</p>
            
            <button 
              onClick={onNavigateToSalesOrders || handleOpenCreateModal}
              className="bg-[#2485e8] hover:bg-[#1a74d4] text-white font-bold text-[13px] px-6 py-2.5 rounded-[4px] mt-6 shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
            >
              Go to Sales Order
            </button>
          </div>

          {/* Life Cycle of a Package Block */}
          <div className="border-t border-slate-100 pt-8 pb-4">
            <h4 className="text-[14px] font-bold text-slate-700 text-center mb-6">Life cycle of a Package</h4>
            
            {/* Horizontal timeline chart */}
            <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              
              {/* Confirmed SO */}
              <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs">
                <ClipboardCheck className="w-4 h-4 text-[#2485e8]" /> CONFIRMED SO
              </div>

              <div className="h-0.5 w-8 border-t-2 border-dashed border-slate-300"></div>

              {/* New Package */}
              <div className="bg-white border-2 border-[#2485e8] text-[#2485e8] rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs">
                <PackageOpen className="w-4 h-4 text-[#2485e8]" /> NEW PACKAGE
              </div>

              <div className="h-0.5 w-8 border-t-2 border-dashed border-slate-300"></div>

              {/* Not Shipped */}
              <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs text-slate-400">
                <AlertCircle className="w-4 h-4 text-slate-400" /> NOT SHIPPED
              </div>

              <div className="h-0.5 w-8 border-t-2 border-dashed border-slate-300"></div>

              {/* Shipped */}
              <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs text-slate-400">
                <Truck className="w-4 h-4 text-slate-400" /> SHIPPED
              </div>

              <div className="h-0.5 w-8 border-t-2 border-dashed border-slate-300"></div>

              {/* Delivered */}
              <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-slate-400" /> DELIVERED
              </div>

            </div>
          </div>

          {/* Module Help / Bullet Points Section */}
          <div className="border-t border-slate-150 bg-slate-50/50 p-6 rounded-lg max-w-4xl mx-auto w-full mt-2">
            <h5 className="text-[12.5px] font-bold text-slate-700 uppercase tracking-wide">In the Packages module, you can:</h5>
            <ul className="mt-3 text-[12.5px] text-slate-600 leading-relaxed list-none pl-0 space-y-2">
              <li className="flex items-start gap-2.5">
                <span className="text-[#2485e8] mt-0.5">✔</span>
                <span>A package can only be created from a sales order that is in <b>'Confirmed'</b> status. In case a package is created for a sales order in 'Draft' status, the sales order automatically gets updated to 'Confirmed' status. <a href="#" className="text-[#2485e8] hover:underline font-bold">Learn More</a></span>
              </li>
            </ul>
          </div>

        </div>
      ) : (
        /* Real functional Packages list */
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Search and Filters */}
          <div className="px-6 py-4 flex items-center justify-between gap-4 bg-white border-b border-slate-150 shrink-0">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search packages by #, SO#, customer, carrier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-full bg-white border border-slate-250 rounded-[4px] text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-3xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-400 font-bold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded text-[12.5px] py-1 px-2.5 font-semibold text-slate-600 cursor-pointer focus:outline-none"
              >
                <option value="all">All Packages</option>
                <option value="packed">Packed (Not Shipped)</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Packages Table */}
          <div className="flex-1 overflow-auto mx-6 my-4 bg-white border border-slate-200 rounded-xl shadow-3xs">
            {filteredPackages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <Package className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-[14px] font-semibold text-slate-500">No packages found matching your criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Package Number</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Sales Order#</th>
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-4">Carrier</th>
                    <th className="py-3.5 px-4">Tracking#</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Items</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPackages.map((pkg) => (
                    <tr 
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-bold text-[#2485e8] font-mono tracking-tight">
                        {pkg.packageNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {pkg.date}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {pkg.salesOrderNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-755 font-semibold">
                        {pkg.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {pkg.carrier || <span className="text-slate-300 font-normal">—</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[12px]">
                        {pkg.trackingNumber || <span className="text-slate-300 font-normal">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                          pkg.status === 'delivered' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : pkg.status === 'shipped'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {pkg.status === 'delivered' ? 'Delivered' : pkg.status === 'shipped' ? 'Shipped' : 'Packed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-600">
                        {pkg.items.reduce((sum, item) => sum + item.qtyToPack, 0)} items
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={(e) => handleDeletePackage(pkg.id, e)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Delete package"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* MODAL: NEW PACKAGE CREATION */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center bg-slate-950/40 backdrop-blur-xs p-4 pt-8 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-250 w-full max-w-3xl overflow-hidden mb-12"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div>
                  <h3 className="text-[16px] font-extrabold text-slate-800">New Package Slip</h3>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">Bundle ordered parts into logical shipping packages</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded text-[12.5px] font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded text-[12.5px] font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {formSuccess}
                  </div>
                )}

                {/* Sales Order Dropdown */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1">Select Sales Order *</label>
                  <select
                    value={selectedSOId}
                    onChange={(e) => handleSOChange(e.target.value)}
                    className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer font-medium"
                  >
                    <option value="">-- Choose Sales Order --</option>
                    {salesOrders.map(so => (
                      <option key={so.id} value={so.id}>
                        {so.so_number} - {so.customer_name} ({so.status.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Package Number */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1">Package Number *</label>
                    <input 
                      type="text"
                      value={packageNumber}
                      onChange={(e) => setPackageNumber(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full font-mono font-bold"
                    />
                  </div>

                  {/* Package Date */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1">Package Date *</label>
                    <input 
                      type="date"
                      value={packageDate}
                      onChange={(e) => setPackageDate(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                    />
                  </div>
                </div>

                {/* Items to Pack Grid */}
                {selectedSOId && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mt-4">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                      <span className="text-[12.5px] font-extrabold text-slate-700">Line Items to Pack</span>
                    </div>

                    <table className="w-full text-left border-collapse text-[12.5px]">
                      <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Item Details</th>
                          <th className="py-2 px-3 text-center w-28">Qty Ordered</th>
                          <th className="py-2 px-3 text-center w-36">Qty to Pack</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formItems.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-400 italic">No line items found.</td>
                          </tr>
                        ) : (
                          formItems.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/20">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-700">{item.productName}</div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.sku}</div>
                              </td>
                              <td className="py-2.5 px-3 text-center font-semibold text-slate-500 font-mono">
                                {item.qtyOrdered}
                              </td>
                              <td className="py-2.5 px-3">
                                <input 
                                  type="number"
                                  min="0"
                                  max={item.qtyOrdered}
                                  value={item.qtyToPack}
                                  onChange={(e) => handleQtyToPackChange(index, parseInt(e.target.value) || 0)}
                                  className="bg-white border border-slate-250 text-[12.5px] text-slate-800 rounded px-2 py-1 focus:border-blue-500 focus:outline-none w-full font-mono text-center"
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Internal Notes */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1">Package Notes / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Provide logistics comments or special assembly notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded p-2 focus:border-blue-500 focus:outline-none w-full leading-normal"
                  />
                </div>
              </div>

              {/* Action Footer */}
              <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-[3px] text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreatePackage}
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-[3px] text-[13px] font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save and Pack"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAWER: PACKAGE DETAILS & SHIPPING WORKFLOW */}
      <AnimatePresence>
        {selectedPackage && !showShipModal && (
          <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-3xs flex justify-end">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="bg-white border-l border-slate-200 w-full max-w-lg h-full shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#2485e8] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                      {selectedPackage.status}
                    </span>
                    <h3 className="text-[16px] font-extrabold text-slate-800">{selectedPackage.packageNumber}</h3>
                  </div>
                  <p className="text-[11.5px] text-slate-400 mt-1">Associated SO: <b className="font-mono">{selectedPackage.salesOrderNumber}</b></p>
                </div>
                <button onClick={() => setSelectedPackage(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto text-[13.5px]">
                
                {/* Status action banners */}
                {selectedPackage.status === 'packed' && (
                  <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                    <Truck className="w-5 h-5 text-[#2485e8] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900">Package Ready to Ship</h4>
                      <p className="text-[12.5px] text-blue-700/80 mt-1">This box is packed and ready. Process the shipping labels, assign a courier agent, and decrease physical warehouse inventory.</p>
                      <button 
                        onClick={() => handleOpenShipModal(selectedPackage)}
                        className="bg-[#2485e8] hover:bg-[#1a74d4] text-white font-bold text-[12px] px-3.5 py-1.5 rounded mt-3 cursor-pointer shadow-3xs"
                      >
                        SHIP THIS PACKAGE
                      </button>
                    </div>
                  </div>
                )}

                {selectedPackage.status === 'shipped' && (
                  <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900">Package Dispatched</h4>
                      <p className="text-[12.5px] text-emerald-700/80 mt-1">Shipped via <b>{selectedPackage.carrier}</b> (Tracking: <b className="font-mono">{selectedPackage.trackingNumber}</b>). Safe transit is underway.</p>
                      <button 
                        onClick={() => handleMarkAsDelivered(selectedPackage)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] px-3.5 py-1.5 rounded mt-3 cursor-pointer shadow-3xs"
                      >
                        MARK AS DELIVERED
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer Details */}
                <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-2.5 shadow-3xs">
                  <h4 className="font-bold text-slate-800 text-[12.5px] uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" /> Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 pt-1 text-[13px]">
                    <span className="text-slate-400">Customer Name:</span>
                    <strong className="text-slate-800 text-right">{selectedPackage.customerName}</strong>

                    <span className="text-slate-400">Package Date:</span>
                    <span className="text-slate-700 font-mono text-right">{selectedPackage.date}</span>
                  </div>
                </div>

                {/* Shipment Details if exists */}
                {(selectedPackage.status === 'shipped' || selectedPackage.status === 'delivered') && (
                  <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-2.5 shadow-3xs">
                    <h4 className="font-bold text-slate-800 text-[12.5px] uppercase tracking-wide flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-slate-400" /> Carrier & Transit Details
                    </h4>
                    <div className="grid grid-cols-2 gap-y-2 pt-1 text-[13px]">
                      <span className="text-slate-400">Shipping Partner:</span>
                      <strong className="text-slate-800 text-right">{selectedPackage.carrier}</strong>

                      <span className="text-slate-400">Tracking Number:</span>
                      <strong className="text-[#2485e8] font-mono text-right">{selectedPackage.trackingNumber}</strong>

                      <span className="text-slate-400">Shipping Cost:</span>
                      <span className="text-slate-700 font-mono text-right">₹{selectedPackage.shippingCharge?.toFixed(2)}</span>

                      <span className="text-slate-400">Dispatched Date:</span>
                      <span className="text-slate-700 font-mono text-right">{selectedPackage.shipmentDate}</span>
                    </div>
                  </div>
                )}

                {/* Package Contents */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-800 text-[12.5px] uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-400" /> Package Contents
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse text-[12.5px]">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-3 text-center w-24">Packed Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPackage.items.map((itm, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-700 block">{itm.productName}</span>
                              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{itm.sku}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-600">
                              {itm.qtyToPack}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {selectedPackage.notes && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wide block">Notes</span>
                    <p className="text-slate-600 text-[12.5px] leading-relaxed italic">"{selectedPackage.notes}"</p>
                  </div>
                )}

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-250 bg-slate-50 flex items-center gap-2 justify-between shrink-0">
                <button 
                  onClick={(e) => handleDeletePackage(selectedPackage.id, e)}
                  className="bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 px-3.5 py-1.5 rounded font-bold text-[12px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Package
                </button>

                <button 
                  onClick={() => setSelectedPackage(null)}
                  className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded font-bold text-[12px] cursor-pointer"
                >
                  Close Details
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: SHIPMENT DETAILS DIALOG */}
      <AnimatePresence>
        {showShipModal && selectedPackage && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-250 w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                <h3 className="text-[14px] font-extrabold text-slate-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" /> Dispatch Carrier labels
                </h3>
                <button onClick={() => setShowShipModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {shipError && (
                  <div className="bg-red-50 text-red-700 p-2.5 rounded text-[12px] font-bold">
                    {shipError}
                  </div>
                )}

                {/* Warehouse */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Source Warehouse *</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    required
                    className="bg-white border border-slate-300 text-[12.5px] text-slate-800 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                  >
                    <option value="">-- Choose Warehouse --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                {/* Carrier */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Carrier Partner *</label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="bg-white border border-slate-300 text-[12.5px] text-slate-800 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                  >
                    <option value="FedEx">FedEx International</option>
                    <option value="DHL">DHL Express</option>
                    <option value="UPS">UPS Logistics</option>
                    <option value="Blue Dart">Blue Dart</option>
                    <option value="Delhivery">Delhivery Logistics</option>
                    <option value="Self Pickup">Self Pickup</option>
                  </select>
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Tracking / Waybill Number *</label>
                  <input 
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="bg-white border border-slate-300 text-[12.5px] text-slate-800 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-none w-full font-mono font-bold"
                  />
                </div>

                {/* Shipping charge */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Shipping Cost (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    value={shippingCharge}
                    onChange={(e) => setShippingCharge(e.target.value)}
                    className="bg-white border border-slate-300 text-[12.5px] text-slate-800 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-none w-full font-mono text-center"
                  />
                </div>

                {/* Shipment Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Shipment Date *</label>
                  <input 
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => setShipmentDate(e.target.value)}
                    className="bg-white border border-slate-300 text-[12.5px] text-slate-800 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex items-center justify-end gap-2">
                <button 
                  onClick={() => setShowShipModal(false)}
                  className="bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded text-[12.5px] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProcessShipment}
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4.5 py-1.5 rounded text-[12.5px] font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting ? "Processing..." : "Process Shipment"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
