import React, { useState, useEffect } from 'react';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, ChevronDown, FileDown,
  Search, Trash2, CheckCircle2, AlertCircle, Calendar, RefreshCw, FileSpreadsheet,
  PlusCircle, MinusCircle, User, CreditCard, ChevronRight, Download, X,
  ArrowRight, ArrowLeftRight, Check, UploadCloud, Info, AlertTriangle, Layers,
  TrendingUp, Truck, Package, PackageOpen, ClipboardCheck, PlayCircle, Eye, HelpCircle as HelpIcon
} from 'lucide-react';
import { useInventoryStore, SalesOrder } from '../../stores/inventoryStore.js';
import { motion, AnimatePresence } from 'motion/react';

interface ShipmentRecord {
  id: string;
  shipmentNumber: string;
  salesOrderId: string;
  salesOrderNumber: string;
  packageId?: string;
  packageNumber?: string;
  customerId: string;
  customerName: string;
  shipDate: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  shippingCharges: number;
  notes?: string;
  status: 'shipped' | 'delivered';
  isCarrierShipment: boolean;
  warehouseId: string;
  createdAt: string;
}

interface ShipmentsListProps {
  onNavigateToSalesOrders?: () => void;
  onNavigateToPackages?: () => void;
}

export function ShipmentsList({ onNavigateToSalesOrders, onNavigateToPackages }: ShipmentsListProps) {
  const { 
    salesOrders, 
    items: inventoryItems, 
    warehouses,
    customers,
    fetchSalesOrders, 
    fetchItems, 
    fetchLocationInventory,
    fetchCustomers,
    shipSO
  } = useInventoryStore();

  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // View Mode: 'list' or 'create'
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);

  // Form State
  const [isCarrierShipment, setIsCarrierShipment] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [shipmentNumber, setShipmentNumber] = useState("");
  const [shipDate, setShipDate] = useState(new Date().toISOString().split("T")[0]);
  const [carrier, setCarrier] = useState("FedEx");
  const [customCarrier, setCustomCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shippingCharges, setShippingCharges] = useState("0");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [shipmentAlreadyDelivered, setShipmentAlreadyDelivered] = useState(false);
  const [sendStatusNotification, setSendStatusNotification] = useState(false);

  // Validation / Loading States
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Initial Data
  useEffect(() => {
    fetchSalesOrders();
    fetchItems();
    fetchLocationInventory();
    fetchCustomers();

    // Load shipments from local storage
    const savedShipments = localStorage.getItem('spareflow_shipments');
    if (savedShipments) {
      try {
        setShipments(JSON.parse(savedShipments));
      } catch (e) {
        console.error("Failed to parse shipments", e);
      }
    } else {
      const initial: ShipmentRecord[] = [];
      setShipments(initial);
      localStorage.setItem('spareflow_shipments', JSON.stringify(initial));
    }
  }, []);

  // Save to local storage
  const saveShipments = (list: ShipmentRecord[]) => {
    setShipments(list);
    localStorage.setItem('spareflow_shipments', JSON.stringify(list));
  };

  // Helper: Get Packages in Local Storage
  const getPackages = () => {
    const saved = localStorage.getItem('spareflow_packages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Filter packages based on selected SO & Customer
  const availablePackages = getPackages().filter((pkg: any) => {
    const matchSO = salesOrderId ? String(pkg.salesOrderId) === String(salesOrderId) : true;
    const matchCust = customerId ? String(pkg.customerId) === String(customerId) : true;
    const matchStatus = pkg.status === 'packed'; // Only packable / ready packages can be shipped
    return matchSO && matchCust && matchStatus;
  });

  // Handle Create Shipment Click
  const handleOpenCreateForm = () => {
    const rand = Math.floor(10000 + Math.random() * 90000);
    setShipmentNumber(`SHIP-2026-${rand}`);
    setCustomerId("");
    setSalesOrderId("");
    setPackageId("");
    setShipDate(new Date().toISOString().split("T")[0]);
    setCarrier("FedEx");
    setCustomCarrier("");
    setTrackingNumber(`TRK${Math.floor(10000000 + Math.random() * 90000000)}`);
    setTrackingUrl("");
    setShippingCharges("150");
    setWarehouseId(warehouses[0]?.id ? String(warehouses[0].id) : "");
    setNotes("");
    setShipmentAlreadyDelivered(false);
    setSendStatusNotification(false);
    setFormError(null);
    setViewMode('create');
  };

  // Handle Customer Selection
  const handleCustomerChange = (custId: string) => {
    setCustomerId(custId);
    setSalesOrderId("");
    setPackageId("");
  };

  // Handle Sales Order Selection
  const handleSalesOrderChange = (soId: string) => {
    setSalesOrderId(soId);
    setPackageId("");
    
    // Automatically set customer if not set
    const selectedSO = salesOrders.find(so => String(so.id) === String(soId));
    if (selectedSO && !customerId) {
      setCustomerId(String(selectedSO.customer_id));
    }
  };

  // Handle Package Selection
  const handlePackageChange = (pkgId: string) => {
    setPackageId(pkgId);
    
    // Auto-fill SO and Customer if package is chosen directly
    const pkgs = getPackages();
    const pkg = pkgs.find((p: any) => String(p.id) === String(pkgId));
    if (pkg) {
      setSalesOrderId(String(pkg.salesOrderId));
      setCustomerId(String(pkg.customerId));
    }
  };

  // Handle Save Shipment Form
  const handleSaveShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!salesOrderId) {
      setFormError("Sales Order is required.");
      return;
    }

    if (!warehouseId) {
      setFormError("Source Warehouse is required for stock accounting.");
      return;
    }

    if (!trackingNumber.trim()) {
      setFormError("Tracking number is required.");
      return;
    }

    const selectedSO = salesOrders.find(so => String(so.id) === String(salesOrderId));
    if (!selectedSO) {
      setFormError("Selected Sales Order was not found.");
      return;
    }

    const selectedCust = customers.find(c => String(c.id) === String(customerId || selectedSO.customer_id));
    const custName = selectedCust ? selectedCust.name : (selectedSO.customer_name || "General Customer");

    setIsSubmitting(true);
    try {
      let finalItemsToShip: { product_id: number, qty_shipped: number }[] = [];
      let associatedPkgNum = "";

      // 1. If package is chosen, ship those items
      if (packageId) {
        const pkgs = getPackages();
        const pkg = pkgs.find((p: any) => String(p.id) === String(packageId));
        if (pkg && pkg.items) {
          associatedPkgNum = pkg.packageNumber;
          finalItemsToShip = pkg.items.map((itm: any) => ({
            product_id: Number(itm.productId),
            qty_shipped: Number(itm.qtyToPack)
          }));

          // Mark package as shipped or delivered in packages storage
          const updatedPackages = pkgs.map((p: any) => {
            if (String(p.id) === String(packageId)) {
              return {
                ...p,
                status: shipmentAlreadyDelivered ? 'delivered' : 'shipped',
                carrier: carrier === 'other' ? customCarrier : carrier,
                trackingNumber,
                shipmentDate: shipDate,
                warehouseId
              };
            }
            return p;
          });
          localStorage.setItem('spareflow_packages', JSON.stringify(updatedPackages));
        }
      } else {
        // 2. Manual Shipment: Ship remaining items on the Sales Order directly
        if (selectedSO.items) {
          finalItemsToShip = selectedSO.items.map((itm: any) => {
            const remaining = Math.max(0, Number(itm.qtyOrdered) - Number(itm.qtyShipped || 0));
            return {
              product_id: Number(itm.productId),
              qty_shipped: remaining
            };
          }).filter(itm => itm.qty_shipped > 0);
        }

        if (finalItemsToShip.length === 0) {
          throw new Error("This sales order is already fully shipped. No items remaining to ship.");
        }
      }

      // Invoke server-side stock adjustment and sales order updates
      const success = await shipSO(salesOrderId, warehouseId, finalItemsToShip);
      if (!success) {
        throw new Error("Failed to process shipment on server. Check inventory levels for items.");
      }

      // Create new Shipment Record
      const newShipment: ShipmentRecord = {
        id: `ship-${Date.now()}`,
        shipmentNumber: shipmentNumber.trim(),
        salesOrderId: String(salesOrderId),
        salesOrderNumber: selectedSO.so_number,
        packageId: packageId || undefined,
        packageNumber: associatedPkgNum || undefined,
        customerId: String(customerId || selectedSO.customer_id),
        customerName: custName,
        shipDate,
        carrier: carrier === 'other' ? customCarrier : carrier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || undefined,
        shippingCharges: parseFloat(shippingCharges) || 0,
        notes: notes.trim() || undefined,
        status: shipmentAlreadyDelivered ? 'delivered' : 'shipped',
        isCarrierShipment,
        warehouseId,
        createdAt: new Date().toISOString()
      };

      const updatedShipments = [newShipment, ...shipments];
      saveShipments(updatedShipments);

      // Refresh sales orders and inventory states
      await fetchSalesOrders();
      await fetchItems();
      await fetchLocationInventory();

      // Show alert & switch back to list view
      alert(`Shipment ${shipmentNumber} created successfully! Inventory updated.`);
      setViewMode('list');
    } catch (e: any) {
      setFormError(e.message || "An error occurred during shipment processing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark status as delivered
  const handleMarkAsDelivered = (ship: ShipmentRecord) => {
    if (confirm(`Mark Shipment ${ship.shipmentNumber} as Delivered?`)) {
      const updated = shipments.map(s => {
        if (s.id === ship.id) {
          return { ...s, status: 'delivered' as const };
        }
        return s;
      });
      saveShipments(updated);

      // Also update associated package if exists
      if (ship.packageId) {
        const pkgs = getPackages();
        const updatedPkgs = pkgs.map((p: any) => {
          if (String(p.id) === String(ship.packageId)) {
            return { ...p, status: 'delivered' };
          }
          return p;
        });
        localStorage.setItem('spareflow_packages', JSON.stringify(updatedPkgs));
      }

      if (selectedShipment?.id === ship.id) {
        setSelectedShipment({ ...ship, status: 'delivered' });
      }
    }
  };

  // Delete shipment
  const handleDeleteShipment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this shipment? This deletes the historical log only.")) {
      const updated = shipments.filter(s => s.id !== id);
      saveShipments(updated);
      if (selectedShipment?.id === id) {
        setSelectedShipment(null);
      }
    }
  };

  // Filtering
  const filteredShipments = shipments.filter(ship => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      ship.shipmentNumber.toLowerCase().includes(query) ||
      ship.salesOrderNumber.toLowerCase().includes(query) ||
      ship.customerName.toLowerCase().includes(query) ||
      ship.carrier.toLowerCase().includes(query) ||
      ship.trackingNumber.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || ship.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-full relative font-sans overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 shadow-3xs">
        <div className="flex flex-col">
          <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-1.5">
            All Shipments <ChevronDown className="w-4 h-4 text-slate-400 mt-0.5 cursor-pointer" />
          </h2>
          <p className="text-[11.5px] text-slate-400 mt-0.5">Track outbound parts, dispatch logs, and transit status</p>
        </div>
        
        {viewMode === 'list' && (
          <div className="flex items-center gap-2.5">
            <span className="text-[12.5px] text-slate-500 flex items-center gap-1">
              View EasyPost Usage <span className="text-[#2485e8] font-bold font-mono italic">easypost</span>
            </span>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            {/* Create Button */}
            <button 
              onClick={handleOpenCreateForm}
              className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Shipment
            </button>
            
            <div className="h-5 w-px bg-slate-300 mx-1"></div>
            <button className="text-slate-500 hover:text-slate-850 p-1.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors">
               <Settings className="w-[17px] h-[17px]" />
            </button>
            <button className="text-slate-500 hover:text-slate-850 p-1.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors">
               <ListFilter className="w-[17px] h-[17px]" />
            </button>
          </div>
        )}

        {viewMode === 'create' && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCarrierShipment(!isCarrierShipment)}
              className="text-[#2485e8] hover:underline text-[13px] font-semibold"
            >
              {isCarrierShipment ? "Switch to manual shipment" : "Switch to carrier shipment"}
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className="text-slate-500 hover:text-slate-700 p-1 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'list' ? (
        shipments.length === 0 ? (
          /* Empty State exactly matching user screenshot */
          <div className="flex-1 overflow-auto flex flex-col justify-between p-8 bg-white">
            
            {/* Center Visual Callout */}
            <div className="flex-1 flex flex-col items-center justify-center py-10 max-w-2xl mx-auto">
              <h3 className="text-[24px] font-extrabold text-slate-800 text-center">Ship with Confidence and Accuracy</h3>
              <p className="text-[13.5px] text-slate-500 mt-1.5 text-center">Create shipment records and track delivery status for your orders.</p>
              
              <button 
                onClick={handleOpenCreateForm}
                className="bg-[#2485e8] hover:bg-[#1a74d4] text-white font-bold text-[13px] px-6 py-2.5 rounded-[4px] mt-6 shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
              >
                CREATE SHIPMENT
              </button>
            </div>

            {/* Life Cycle Timeline Section */}
            <div className="border-t border-slate-100 pt-8 pb-4">
              <h4 className="text-[14px] font-bold text-slate-700 text-center mb-6">Life cycle of Shipments</h4>
              
              <div className="flex flex-wrap items-center justify-center gap-3 max-w-5xl mx-auto text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                
                {/* 1. Sales Order Confirmed */}
                <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs">
                  <ClipboardCheck className="w-4 h-4 text-slate-400" /> Sales Order Confirmed
                </div>

                <div className="h-0.5 w-6 border-t border-slate-300"></div>

                {/* 2. Packages Created */}
                <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs">
                  <PackageOpen className="w-4 h-4 text-slate-400" /> Packages Created
                </div>

                <div className="h-0.5 w-6 border-t border-slate-300"></div>

                {/* 3. Create Shipment */}
                <div className="bg-white border-2 border-[#2485e8] text-[#2485e8] rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs">
                  <Layers className="w-4 h-4 text-[#2485e8]" /> Create Shipment
                </div>

                <div className="h-0.5 w-6 border-t border-slate-300"></div>

                {/* Branch options (Via Carrier / Manually) */}
                <div className="flex flex-col gap-2.5 relative py-2 px-1">
                  {/* Via Carrier */}
                  <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-1.5 flex items-center gap-2 shadow-3xs text-[10px] text-slate-500">
                    <Truck className="w-3.5 h-3.5 text-slate-400" /> Via Carrier
                  </div>
                  {/* Manually */}
                  <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-1.5 flex items-center gap-2 shadow-3xs text-[10px] text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Manually
                  </div>
                </div>

                <div className="h-0.5 w-6 border-t border-slate-300"></div>

                {/* 4. Shipped */}
                <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs text-slate-400">
                  <Truck className="w-4 h-4 text-slate-400" /> Shipped
                </div>

                <div className="h-0.5 w-6 border-t border-slate-300"></div>

                {/* 5. Delivered */}
                <div className="bg-slate-50 border border-slate-250 rounded-[4px] px-3 py-2 flex items-center gap-2 shadow-3xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> Delivered
                </div>

              </div>
            </div>

            {/* Bottom Bullet Points Section */}
            <div className="border-t border-slate-150 bg-slate-50/50 p-6 rounded-lg max-w-4xl mx-auto w-full mt-2">
              <h5 className="text-[12.5px] font-bold text-slate-700 uppercase tracking-wide">In the Shipments module, you can:</h5>
              <ul className="mt-3 text-[12.5px] text-slate-600 leading-relaxed list-none pl-0 space-y-2">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#2485e8] mt-0.5">✔</span>
                  <span>Generate and manage outbound shipments.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#2485e8] mt-0.5">✔</span>
                  <span>Track shipment status and delivery details.</span>
                </li>
              </ul>
            </div>

          </div>
        ) : (
          /* List View with real functional shipments */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Search and Filters */}
            <div className="px-6 py-4 flex items-center justify-between gap-4 bg-white border-b border-slate-150 shrink-0">
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search shipments by shipment#, SO#, customer, carrier..."
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
                  <option value="all">All Shipments</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-auto mx-6 my-4 bg-white border border-slate-200 rounded-xl shadow-3xs">
              {filteredShipments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <Truck className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-[14px] font-semibold text-slate-500">No shipments found matching your criteria.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Shipment Number</th>
                      <th className="py-3.5 px-4">Ship Date</th>
                      <th className="py-3.5 px-4">Sales Order#</th>
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Carrier</th>
                      <th className="py-3.5 px-4">Tracking#</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Charges</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShipments.map((ship) => (
                      <tr 
                        key={ship.id}
                        onClick={() => setSelectedShipment(ship)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-bold text-[#2485e8] font-mono tracking-tight">
                          {ship.shipmentNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {ship.shipDate}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {ship.salesOrderNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-755 font-semibold">
                          {ship.customerName}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {ship.carrier}
                        </td>
                        <td className="py-3 px-4 text-[#2485e8] font-mono text-[12px] font-semibold">
                          {ship.trackingNumber}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                            ship.status === 'delivered' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {ship.status === 'delivered' ? 'Delivered' : 'Shipped'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold font-mono text-slate-600">
                          ₹{ship.shippingCharges.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {ship.status === 'shipped' && (
                              <button
                                onClick={() => handleMarkAsDelivered(ship)}
                                className="text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded text-[11.5px] font-bold border border-emerald-200 cursor-pointer"
                              >
                                Deliver
                              </button>
                            )}
                            <button 
                              onClick={(e) => handleDeleteShipment(ship.id, e)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Delete log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )
      ) : (
        /* CREATE SHIPMENT SCREEN: Matches second screenshot closely */
        <div className="flex-1 overflow-auto bg-white p-6 md:p-8">
          <form onSubmit={handleSaveShipment} className="max-w-4xl mx-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[17px] font-bold text-slate-800">
                {isCarrierShipment ? "New Carrier Shipment" : "New Shipment Details"}
              </h3>
              <span className="text-xs text-slate-400 font-medium">* Required Fields</span>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-700 p-3.5 rounded-lg text-[13px] font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700 flex items-center gap-1">
                  Customer Name <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                </label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sales Order# */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700">
                  Sales Order# *
                </label>
                <select
                  value={salesOrderId}
                  onChange={(e) => handleSalesOrderChange(e.target.value)}
                  required
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                >
                  <option value="">Select Sales Order</option>
                  {salesOrders
                    .filter(so => !customerId || String(so.customer_id) === String(customerId))
                    .map(so => (
                      <option key={so.id} value={so.id}>{so.so_number} - {so.customer_name} ({so.status.toUpperCase()})</option>
                    ))
                  }
                </select>
              </div>

              {/* Package# */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700">
                  Package# *
                </label>
                <select
                  value={packageId}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                >
                  <option value="">-- Choose Packed Box --</option>
                  {availablePackages.map((pkg: any) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.packageNumber} ({pkg.items.length} items packed)</option>
                  ))}
                </select>
                <p className="text-[11.5px] text-slate-400 mt-1">
                  Only packages in 'Packed' status for this order are listed.
                </p>
              </div>

              {/* Source Warehouse */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700">
                  Source Warehouse *
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  required
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Shipment Order# */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Shipment Order# *</span>
                  <Settings className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
                </label>
                <input 
                  type="text"
                  required
                  value={shipmentNumber}
                  onChange={(e) => setShipmentNumber(e.target.value)}
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full font-mono font-bold"
                />
              </div>

              {/* Ship Date */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700">
                  Ship Date *
                </label>
                <input 
                  type="date"
                  required
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                />
              </div>

              {/* Carrier */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700">
                  Carrier *
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full cursor-pointer"
                >
                  <option value="FedEx">FedEx International</option>
                  <option value="DHL">DHL Express</option>
                  <option value="UPS">UPS Logistics</option>
                  <option value="Blue Dart">Blue Dart</option>
                  <option value="Delhivery">Delhivery Logistics</option>
                  <option value="other">Other (type below)</option>
                </select>
                
                {carrier === 'other' && (
                  <input 
                    type="text"
                    placeholder="Enter custom carrier name"
                    value={customCarrier}
                    onChange={(e) => setCustomCarrier(e.target.value)}
                    className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full mt-2"
                  />
                )}
              </div>

              {/* Tracking# */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700">
                  Tracking# *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Carrier waybill identification key"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full font-mono font-bold"
                />
              </div>

              {/* Tracking URL */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700">
                  Tracking URL
                </label>
                <input 
                  type="url"
                  placeholder="https://track.carrier.com/..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                />
              </div>

              {/* Shipping Charges */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700">
                  Shipping Charges (if any)
                </label>
                <input 
                  type="number"
                  min="0"
                  value={shippingCharges}
                  onChange={(e) => setShippingCharges(e.target.value)}
                  className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full font-mono text-right"
                />
              </div>

            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-slate-700">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Remarks or driver instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white border border-slate-300 text-[13.5px] text-slate-800 rounded p-2.5 focus:border-blue-500 focus:outline-none w-full leading-relaxed"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={shipmentAlreadyDelivered}
                  onChange={(e) => setShipmentAlreadyDelivered(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-[13px] font-semibold text-slate-700">Shipment already delivered</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={sendStatusNotification}
                  onChange={(e) => setSendStatusNotification(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-[13px] font-semibold text-slate-700">Send Status Notification</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="border-t border-slate-100 pt-5 flex items-center gap-3">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-5 py-2 rounded-[4px] text-[13.5px] font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <button 
                type="button"
                onClick={() => setViewMode('list')}
                className="bg-white border border-slate-250 text-slate-700 px-5 py-2 rounded-[4px] text-[13.5px] font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      )}

      {/* SHIPMENT DETAIL DRAWER */}
      <AnimatePresence>
        {selectedShipment && (
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
                      {selectedShipment.status}
                    </span>
                    <h3 className="text-[16px] font-extrabold text-slate-800">{selectedShipment.shipmentNumber}</h3>
                  </div>
                  <p className="text-[11.5px] text-slate-400 mt-1">Sales Order Ref: <b className="font-mono">{selectedShipment.salesOrderNumber}</b></p>
                </div>
                <button onClick={() => setSelectedShipment(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto text-[13.5px]">
                
                {/* Delivery Action Card */}
                {selectedShipment.status === 'shipped' && (
                  <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <Truck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900">Shipment is in Transit</h4>
                      <p className="text-[12.5px] text-amber-700/80 mt-1">Carrier waybill is active. Once the cargo arrives safely, mark the shipment status as Delivered.</p>
                      <button 
                        onClick={() => handleMarkAsDelivered(selectedShipment)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] px-3.5 py-1.5 rounded mt-3 cursor-pointer shadow-3xs"
                      >
                        MARK AS DELIVERED
                      </button>
                    </div>
                  </div>
                )}

                {selectedShipment.status === 'delivered' && (
                  <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900">Successfully Delivered</h4>
                      <p className="text-[12.5px] text-emerald-700/80 mt-1">This shipment has been completed and marked as safely received by the customer.</p>
                    </div>
                  </div>
                )}

                {/* Info Block */}
                <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-2.5 shadow-3xs">
                  <h4 className="font-bold text-slate-800 text-[12.5px] uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" /> Customer & Date Info
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 pt-1 text-[13px]">
                    <span className="text-slate-400">Customer Name:</span>
                    <strong className="text-slate-800 text-right">{selectedShipment.customerName}</strong>

                    <span className="text-slate-400">Shipment Date:</span>
                    <span className="text-slate-700 font-mono text-right">{selectedShipment.shipDate}</span>

                    {selectedShipment.packageNumber && (
                      <>
                        <span className="text-slate-400">Package Link:</span>
                        <span className="text-blue-600 font-mono text-right font-bold">{selectedShipment.packageNumber}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Carrier & Waybill details */}
                <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-2.5 shadow-3xs">
                  <h4 className="font-bold text-slate-800 text-[12.5px] uppercase tracking-wide flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-slate-400" /> Transit & Waybill details
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 pt-1 text-[13px]">
                    <span className="text-slate-400">Shipping Partner:</span>
                    <strong className="text-slate-800 text-right">{selectedShipment.carrier}</strong>

                    <span className="text-slate-400">Tracking Number:</span>
                    <strong className="text-[#2485e8] font-mono text-right">{selectedShipment.trackingNumber}</strong>

                    <span className="text-slate-400">Shipping Charges:</span>
                    <span className="text-slate-700 font-mono text-right">₹{selectedShipment.shippingCharges.toFixed(2)}</span>

                    {selectedShipment.trackingUrl && (
                      <>
                        <span className="text-slate-400">Tracking Webpage:</span>
                        <a 
                          href={selectedShipment.trackingUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-500 hover:underline font-medium text-right overflow-hidden text-ellipsis block whitespace-nowrap max-w-[180px]"
                        >
                          Open Tracking Link
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedShipment.notes && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wide block">Notes & Drivers Instructions</span>
                    <p className="text-slate-600 text-[12.5px] leading-relaxed italic">"{selectedShipment.notes}"</p>
                  </div>
                )}

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-250 bg-slate-50 flex items-center gap-2 justify-between shrink-0">
                <button 
                  onClick={(e) => handleDeleteShipment(selectedShipment.id, e)}
                  className="bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 px-3.5 py-1.5 rounded font-bold text-[12px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Log
                </button>

                <button 
                  onClick={() => setSelectedShipment(null)}
                  className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded font-bold text-[12px] cursor-pointer"
                >
                  Close Details
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
