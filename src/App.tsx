import React, { useState, useEffect } from "react";
import { 
  Building2, LayoutDashboard, Database, KeyRound, UserCheck, 
  ArrowRight, Activity, Terminal, Settings, Code, Sparkles, 
  TrendingUp, ShoppingCart, ShoppingBag, CheckCircle, Package, 
  UserPlus, ChevronDown, ChevronRight, HelpCircle, FileText, 
  MapPin, Sliders, PlayCircle, Library, Zap, Cpu, Home,
  Boxes, Inbox, FileSpreadsheet, Folder, Plus, Search,
  Bell, LayoutGrid, User, AlertTriangle, Check
} from "lucide-react";

import { ArchDocs } from "./components/ArchDocs.js";
import { Playground } from "./components/Playground.js";
import { ProductionDashboard } from "./components/ProductionDashboard.jsx";

// Import Spareflow Components
import { ItemsList } from "./components/spareflow/ItemsList.jsx";
import { PurchasesList } from "./components/spareflow/PurchasesList.jsx";
import { SalesList } from "./components/spareflow/SalesList.jsx";
import { InventoryList } from "./components/spareflow/InventoryList.jsx";
import { WarehousesList } from "./components/spareflow/WarehousesList.jsx";
import { useInventoryStore } from "./stores/inventoryStore.js";

// New Components (we will create these)
import { CustomersList } from "./components/spareflow/CustomersList.jsx";
import { SalesOrdersList } from "./components/spareflow/SalesOrdersList.jsx";
import { InvoicesList } from "./components/spareflow/InvoicesList.jsx";
import { InventoryAdjustmentsList } from "./components/spareflow/InventoryAdjustmentsList.jsx";
import { MoveOrdersList } from "./components/spareflow/MoveOrdersList.jsx";
import { PutawaysList } from "./components/spareflow/PutawaysList.jsx";
import { PackagesList } from "./components/spareflow/PackagesList.jsx";
import { ShipmentsList } from "./components/spareflow/ShipmentsList.jsx";
import { SettingsPage } from "./components/spareflow/SettingsPage.jsx";

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  apiVersion: string;
}

interface AuthSession {
  user: {
    full_name: string;
    email: string;
    role: string;
  };
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [activeMenu, setActiveMenu] = useState<string>("home");
  const [prevMenu, setPrevMenu] = useState<string>("home");
  const [activeOrgName, setActiveOrgName] = useState<string>("XYZ Parts");
  const [activeOrgId, setActiveOrgId] = useState<string>("org1");
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showOrgPopover, setShowOrgPopover] = useState<boolean>(false);
  const [activeUserRole, setActiveUserRole] = useState<string>("Admin");
  const [currentUser, setCurrentUser] = useState<{ full_name: string; email: string; role: string } | null>(null);

  // High fidelity interactive states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [showPlusDropdown, setShowPlusDropdown] = useState<boolean>(false);
  const [showBellDropdown, setShowBellDropdown] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [showAppsGridDropdown, setShowAppsGridDropdown] = useState<boolean>(false);

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Low inventory warning: 'Front Brake Pads' reached reorder threshold.", time: "10m ago", read: false },
    { id: 2, text: "Sales Order SO-10492 has been processed & packed.", time: "1h ago", read: false },
    { id: 3, text: "Entity switch completed to active workspace successfully.", time: "3h ago", read: true },
    { id: 4, text: "Linter checks executed successfully for Spareflow modules.", time: "1d ago", read: true }
  ]);

  // Collapsible navigational sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    items: false,
    inventory: false,
    sales: true,
    purchases: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Fetch API Health on startup
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error("API offline:", err));
  }, []);

  // Fetch Spareflow initial DB records
  const fetchInitialData = useInventoryStore((state) => state.fetchInitialData);
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Listen to session changes populated by the login sandbox playground
  useEffect(() => {
    const checkSession = () => {
      // 1. Load active organization name
      const activeId = localStorage.getItem('spareflow_settings_active_org_id') || "org1";
      setActiveOrgId(activeId);
      const orgsStr = localStorage.getItem('spareflow_settings_orgs');
      if (orgsStr) {
        try {
          const orgs = JSON.parse(orgsStr);
          setOrganizations(orgs);
          const activeOrg = orgs.find((o: any) => o.id === activeId);
          if (activeOrg) {
            setActiveOrgName(activeOrg.name);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const defaultOrgs = [
          { id: "org1", name: "XYZ Parts", companyId: "60073295223" },
          { id: "org2", name: "Metro Auto Spares", companyId: "60073295224" },
          { id: "org3", name: "Sanjay Motors", companyId: "60073295225" }
        ];
        setOrganizations(defaultOrgs);
        setActiveOrgName("XYZ Parts");
      }

      // 2. Load active user & role
      const activeUserId = localStorage.getItem('spareflow_settings_active_user_id') || "usr1";
      const usersStr = localStorage.getItem('spareflow_settings_users');
      const rolesStr = localStorage.getItem('spareflow_settings_roles');
      if (usersStr && rolesStr) {
        try {
          const users = JSON.parse(usersStr);
          const roles = JSON.parse(rolesStr);
          const activeUser = users.find((u: any) => u.id === activeUserId);
          if (activeUser) {
            const activeRole = roles.find((r: any) => r.id === activeUser.roleId);
            const userObj = {
              full_name: activeUser.name,
              email: activeUser.email,
              role: activeRole?.name || "Admin"
            };
            setCurrentUser(userObj);
            setActiveUserRole(activeRole?.name || "Admin");
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Fallback
      const glob = (window as any).__spareflow_session as AuthSession | undefined;
      if (glob && glob.user) {
        setCurrentUser({
          full_name: glob.user.full_name,
          email: glob.user.email,
          role: glob.user.role
        });
        setActiveUserRole(glob.user.role);
      } else {
        setCurrentUser(null);
        setActiveUserRole("Admin");
      }
    };

    checkSession();
    window.addEventListener("spareflow_session_update", checkSession);
    return () => {
      window.removeEventListener("spareflow_session_update", checkSession);
    };
  }, []);

  const allInventoryItems = useInventoryStore((state) => state.items);
  const searchedItems = searchQuery.trim()
    ? allInventoryItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="h-screen w-screen flex flex-col font-sans antialiased text-slate-800 bg-[#f4f5f7] overflow-hidden select-none">
      {/* TOP NAVBAR - SPAREFLOW INVENTORY */}
      <div className="bg-[#1e2235] text-slate-100 flex items-center justify-between px-4 py-2 border-b border-[#2b3046] shrink-0 relative z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveMenu("home")}>
            <Boxes className="w-5 h-5 text-blue-400 animate-pulse" />
            <h1 className="font-semibold text-lg tracking-tight hover:text-blue-300 transition-colors">Spareflow</h1>
            <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-mono font-bold uppercase mt-0.5">INV</span>
          </div>
        </div>
        
        {/* Interactive Global Search bar */}
        <div className="flex-1 flex max-w-2xl px-6 relative">
          <div className="flex items-center flex-1 bg-[#282d46] border border-[#39405f] rounded overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <div className="px-3 py-1.5 flex items-center gap-2 border-r border-[#39405f] text-[#8e98bc] cursor-pointer hover:bg-[#343a57]">
              <Search className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Quick search products (e.g. brake pads, SKU)..." 
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-white placeholder-[#8e98bc] outline-hidden w-full"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }}
                className="px-2.5 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Interactive Search Matches Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)}></div>
              <div className="absolute top-full left-6 right-6 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 text-slate-800 max-h-80 overflow-y-auto z-50 p-2">
                <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-md">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Results ({searchedItems.length})</span>
                  <button onClick={() => setShowSearchDropdown(false)} className="text-[10px] text-blue-600 font-bold hover:underline">Close</button>
                </div>
                {searchedItems.length > 0 ? (
                  <div className="divide-y divide-slate-50 mt-1">
                    {searchedItems.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setActiveMenu("items");
                          setSearchQuery("");
                          setShowSearchDropdown(false);
                        }}
                        className="p-2.5 hover:bg-blue-50/60 rounded-md cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku} | Unit: {item.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-slate-700">₹{item.sales_price}</p>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${item.qty_on_hand <= item.reorder_point ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            Stock: {item.qty_on_hand}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No active product matching "<b>{searchQuery}</b>" was found.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Top Navbar Action Buttons */}
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-300 mr-2">
            Role: <span className="font-bold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800">{activeUserRole}</span>
          </div>
          
          {/* 1. INTERACTIVE PLUS DROP-DOWN (QUICK SHORTCUTS) */}
          <div className="relative">
            <button 
              onClick={() => setShowPlusDropdown(!showPlusDropdown)}
              className="bg-blue-600 hover:bg-blue-700 w-7 h-7 rounded flex items-center justify-center transition-colors shadow-sm"
              title="Quick Add Menu"
            >
              <Plus className={`w-4 h-4 text-white transition-transform ${showPlusDropdown ? 'rotate-45' : 'rotate-0'}`} />
            </button>

            {showPlusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPlusDropdown(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1.5 text-slate-800">
                  <div className="px-3 py-1 border-b border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Quick Actions</span>
                  </div>
                  {[
                    { label: "New Item", icon: ShoppingBag, target: "items" },
                    { label: "New Customer", icon: UserPlus, target: "customers" },
                    { label: "New Sales Order", icon: ShoppingCart, target: "sales_orders" },
                    { label: "New Invoice", icon: FileText, target: "invoices" },
                    { label: "New Stock Adjustment", icon: Package, target: "inventory_adjustments" }
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveMenu(action.target);
                        setShowPlusDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-slate-700 font-medium"
                    >
                      <action.icon className="w-3.5 h-3.5 text-slate-400" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <UserPlus 
              onClick={() => setActiveMenu("customers")}
              className="w-4.5 h-4.5 text-[#8e98bc] hover:text-white cursor-pointer transition-colors" 
              title="Add New Customer"
            />
            
            {/* 2. INTERACTIVE NOTIFICATIONS BELL */}
            <div className="relative">
              <Bell 
                onClick={() => setShowBellDropdown(!showBellDropdown)}
                className={`w-4.5 h-4.5 cursor-pointer transition-colors ${showBellDropdown ? 'text-white' : 'text-[#8e98bc] hover:text-white'}`} 
              />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[7.5px] text-white flex items-center justify-center font-bold animate-bounce shadow-sm">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}

              {showBellDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBellDropdown(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-slate-800">
                    <div className="bg-[#f8f9fa] border-b border-slate-150 p-3 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SYSTEM ALERTS</span>
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        }}
                        className="text-[10.5px] text-[#2485e8] font-bold hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                          }}
                          className={`p-3 text-left hover:bg-slate-50/60 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-[11.5px] leading-relaxed ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                              {notif.text}
                            </p>
                            {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-[#2485e8] shrink-0 mt-1"></span>}
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono mt-1 block">{notif.time}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-slate-100 text-center bg-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold">Spareflow Monitoring Engine active</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Settings 
              onClick={() => {
                setPrevMenu(activeMenu);
                setActiveMenu("settings");
              }}
              className={`w-4.5 h-4.5 hover:text-white cursor-pointer transition-colors ${activeMenu === "settings" ? "text-white animate-spin-slow" : "text-[#8e98bc]"}`} 
              title="System Configuration Settings"
            />

            {/* 3. INTERACTIVE PROFILE & SIMULATE ROLE DROPDOWN */}
            <div className="relative">
              <div 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-7 h-7 rounded-full bg-pink-650 hover:bg-pink-700 flex items-center justify-center text-white font-bold cursor-pointer text-[13px] shadow-3xs hover:scale-105 transition-transform"
                title={`Logged in as ${currentUser?.full_name || "Pradeep Kumar"} (${activeUserRole})`}
              >
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "P"}
              </div>

              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 text-slate-800 p-3">
                    <div className="border-b border-slate-100 pb-2.5 mb-2 text-left">
                      <h4 className="font-bold text-[13px] text-slate-800 truncate">{currentUser?.full_name || "Pradeep Kumar"}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || "pradeep@spareflow.in"}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">{activeUserRole}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Simulate Auth Access Role</span>
                      {[
                        { role: "Admin", desc: "Full permissions" },
                        { role: "Manager", desc: "Read & edit access" },
                        { role: "Read-Only", desc: "Strict view limits" }
                      ].map((rObj) => (
                        <button
                          key={rObj.role}
                          onClick={() => {
                            setActiveUserRole(rObj.role);
                            if (currentUser) {
                              setCurrentUser({ ...currentUser, role: rObj.role });
                            }
                            setShowProfileDropdown(false);
                          }}
                          className={`w-full text-left p-1.5 rounded text-[11.5px] transition-colors flex items-center justify-between ${activeUserRole === rObj.role ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <div>
                            <span className="block">{rObj.role}</span>
                            <span className="text-[9px] text-slate-400 font-normal">{rObj.desc}</span>
                          </div>
                          {activeUserRole === rObj.role && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 mt-2.5 pt-2 flex justify-between items-center text-[11px]">
                      <button 
                        onClick={() => {
                          setPrevMenu(activeMenu);
                          setActiveMenu("settings");
                          setShowProfileDropdown(false);
                        }}
                        className="text-[#2485e8] font-semibold hover:underline"
                      >
                        Account Settings
                      </button>
                      <button 
                        onClick={() => {
                          alert("Session simulation reset successfully.");
                          setShowProfileDropdown(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 font-medium"
                      >
                        Reset Session
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 4. INTERACTIVE APPS GRID DROPDOWN */}
            <div className="relative">
              <LayoutGrid 
                onClick={() => setShowAppsGridDropdown(!showAppsGridDropdown)}
                className={`w-4.5 h-4.5 cursor-pointer transition-colors ${showAppsGridDropdown ? 'text-white' : 'text-[#8e98bc] hover:text-white'}`} 
                title="Spareflow Apps Switcher"
              />

              {showAppsGridDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAppsGridDropdown(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-800 p-3">
                    <div className="border-b border-slate-100 pb-2 mb-2 text-left">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Spareflow Workspace Suite</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 cursor-pointer flex flex-col items-center justify-center">
                        <Boxes className="w-5 h-5 text-blue-500 mb-1" />
                        <span className="font-bold text-[11px] text-blue-900">Inventory</span>
                        <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded mt-0.5 font-bold uppercase">Active</span>
                      </div>
                      <div 
                        onClick={() => { alert("Spareflow Books is a premium addon workspace. Syncing accounting module next."); setShowAppsGridDropdown(false); }}
                        className="p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 cursor-pointer flex flex-col items-center justify-center transition-all"
                      >
                        <FileText className="w-5 h-5 text-indigo-400 mb-1" />
                        <span className="font-semibold text-[11px] text-slate-700">Books</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">Integrate</span>
                      </div>
                      <div 
                        onClick={() => { alert("Spareflow Commerce storefront allows sync of real products to website."); setShowAppsGridDropdown(false); }}
                        className="p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 cursor-pointer flex flex-col items-center justify-center transition-all"
                      >
                        <ShoppingCart className="w-5 h-5 text-emerald-400 mb-1" />
                        <span className="font-semibold text-[11px] text-slate-700">Commerce</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">Explore</span>
                      </div>
                      <div 
                        onClick={() => { alert("Spareflow CRM handles lead workflows."); setShowAppsGridDropdown(false); }}
                        className="p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 cursor-pointer flex flex-col items-center justify-center transition-all"
                      >
                        <UserCheck className="w-5 h-5 text-amber-400 mb-1" />
                        <span className="font-semibold text-[11px] text-slate-700">CRM</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">Link</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - ZOHO / SPAREFLOW STYLE */}
        <nav className={`bg-[#f8f9fa] border-r border-[#e5e7eb] flex flex-col shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-[64px]' : 'w-[15rem]'}`}>
          {/* Org Switcher at the very top of the Left Sidebar */}
          <div className="p-3 border-b border-[#e5e7eb] relative">
            {isSidebarCollapsed ? (
              <div 
                onClick={() => setShowOrgPopover(!showOrgPopover)}
                className="w-10 h-10 mx-auto rounded-lg bg-white border border-slate-250 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-3xs text-[#2485e8]"
                title={`Org: ${activeOrgName} (Click to Switch)`}
              >
                <Building2 className="w-5 h-5" />
              </div>
            ) : (
              <div 
                onClick={() => setShowOrgPopover(!showOrgPopover)}
                className="flex items-center justify-between gap-1.5 cursor-pointer hover:bg-slate-200/50 transition-colors text-[13px] text-slate-800 bg-white px-3 py-2 rounded-lg border border-slate-250 shadow-3xs"
                title="Click to switch organization / shop profile"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-[#2485e8] shrink-0" />
                  <span className="font-bold truncate text-slate-700">{activeOrgName}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
            )}

            {showOrgPopover && (
              <>
                {/* Backdrop overlay */}
                <div className="fixed inset-0 z-40" onClick={() => setShowOrgPopover(false)}></div>
                
                {/* Popover Card */}
                <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-800">
                  {/* Title / Header */}
                  <div className="bg-[#f8f9fa] border-b border-slate-150 p-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">CHOOSE YOUR WORKSPACE</span>
                    <h4 className="font-bold text-[11px] text-slate-800">Switch active entity</h4>
                  </div>

                  {/* List of orgs */}
                  <div className="p-1 max-h-56 overflow-y-auto divide-y divide-slate-50">
                    {organizations.map((org) => {
                      const isActive = org.id === activeOrgId;
                      return (
                        <div 
                          key={org.id}
                          onClick={() => {
                            // Switch org
                            localStorage.setItem('spareflow_settings_active_org_id', org.id);
                            // Switch the general config companyName
                            const savedGen = localStorage.getItem('spareflow_settings_general');
                            const generalConfig = savedGen ? JSON.parse(savedGen) : { companyName: "XYZ Parts" };
                            const updatedGen = { ...generalConfig, companyName: org.name };
                            localStorage.setItem('spareflow_settings_general', JSON.stringify(updatedGen));
                            
                            window.dispatchEvent(new Event("spareflow_session_update"));
                            setShowOrgPopover(false);
                          }}
                          className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors text-left ${isActive ? 'bg-blue-50/70 border border-blue-100/50' : 'hover:bg-slate-50'}`}
                        >
                          <div className={`p-1.5 rounded-md shrink-0 ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[11.5px] block truncate ${isActive ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'}`}>
                                {org.name}
                              </span>
                              {isActive && (
                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-extrabold shrink-0">ACTIVE</span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono block">ID: {org.companyId || "60073295223"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer link */}
                  <div className="bg-[#f8f9fa] border-t border-slate-150 p-2.5 flex justify-between items-center text-[11px]">
                    <button 
                      onClick={() => {
                        setPrevMenu(activeMenu);
                        setActiveMenu("settings");
                        setShowOrgPopover(false);
                      }}
                      className="text-[#2485e8] font-bold hover:underline cursor-pointer"
                    >
                      Manage Orgs
                    </button>
                    <span className="text-[9.5px] text-slate-400 font-mono font-bold">Spareflow</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="py-3 flex-1 flex flex-col gap-0.5 overflow-y-auto">
            
            {/* Home */}
            <button
              onClick={() => setActiveMenu("home")}
              className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-all ${
                activeMenu === "home" ? "bg-blue-50 text-blue-600 font-medium border-l-[3px] border-blue-600 pl-[13px]" : "text-[#4b5563] hover:bg-slate-100 border-l-[3px] border-transparent font-normal pl-4"
              }`}
              title="Home Dashboard"
            >
              <Home className="w-[18px] h-[18px] shrink-0 text-slate-500" strokeWidth={1.5} />
              {!isSidebarCollapsed && <span>Home</span>}
            </button>

            {/* Items Section */}
            <div>
              {isSidebarCollapsed ? (
                <button 
                  onClick={() => setActiveMenu("items")}
                  className={`w-full flex items-center justify-center py-2.5 text-[13px] transition-colors ${
                    activeMenu === "items" ? "bg-blue-50 text-blue-600 font-semibold" : "text-[#4b5563] hover:bg-slate-100"
                  }`}
                  title="Items List"
                >
                  <ShoppingBag className="w-[18px] h-[18px] shrink-0 text-slate-500" strokeWidth={1.5} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => toggleSection("items")}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] ${
                      activeMenu === "items" ? "font-semibold text-slate-800" : "text-[#4b5563]"
                    } hover:bg-slate-100 font-normal border-l-[3px] border-transparent pl-4 transition-colors group`}
                  >
                    <div className="relative flex items-center w-4 h-4 mr-1">
                      <span className={`absolute -left-3 transition-transform ${openSections.items ? "rotate-90" : "rotate-0"} text-slate-400`}>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                      <ShoppingBag className="w-[18px] h-[18px] absolute text-slate-500" strokeWidth={1.5} />
                    </div>
                    Items
                  </button>
                  {openSections.items && (
                    <div className="flex flex-col mt-0.5 py-1">
                      <div className="flex flex-col relative">
                        <div className="flex items-center justify-between text-left mx-2 py-1 pr-2 rounded-sm transition-colors bg-[#eff6ff] text-[#2485e8] font-semibold border-l-[3px] border-blue-600">
                          <button onClick={() => setActiveMenu("items")} className="text-left pl-10 text-[13px] flex-1">
                            Items
                          </button>
                          <Plus className="w-3.5 h-3.5 cursor-pointer text-blue-500 hover:text-blue-700" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Inventory Section */}
            <div>
              {isSidebarCollapsed ? (
                <button 
                  onClick={() => setActiveMenu("inventory_adjustments")}
                  className={`w-full flex items-center justify-center py-2.5 text-[13px] transition-colors ${
                    ["inventory_adjustments", "packages", "shipments", "move_orders", "putaways"].includes(activeMenu) ? "bg-blue-50 text-blue-600 font-semibold" : "text-[#4b5563] hover:bg-slate-100"
                  }`}
                  title="Inventory Adjustments / Control"
                >
                  <Package className="w-[18px] h-[18px] shrink-0 text-slate-500" strokeWidth={1.5} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => toggleSection("inventory")}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] text-[#4b5563] hover:bg-slate-100 font-normal border-l-[3px] border-transparent pl-4 transition-colors`}
                  >
                    <div className="relative flex items-center w-4 h-4 mr-1">
                      <span className={`absolute -left-3 transition-transform ${openSections.inventory ? "rotate-90" : "rotate-0"} text-slate-400`}>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                      <Package className="w-[18px] h-[18px] absolute text-slate-500" strokeWidth={1.5} />
                    </div>
                    Inventory
                  </button>
                  {openSections.inventory && (
                    <div className="flex flex-col mt-0.5 py-1 pl-10 space-y-1">
                      {[
                        { label: "Inventory Adjustments", id: "inventory_adjustments" },
                        { label: "Packages", id: "packages" },
                        { label: "Shipments", id: "shipments" },
                        { label: "Move Orders", id: "move_orders" },
                        { label: "Putaways", id: "putaways" }
                      ].map(sub => (
                        <button 
                          key={sub.id} 
                          onClick={() => setActiveMenu(sub.id)} 
                          className={`text-left py-1 text-[13px] block ${activeMenu === sub.id ? "text-blue-600 font-semibold" : "text-[#4b5563] hover:text-slate-900"}`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sales Section */}
            <div>
              {isSidebarCollapsed ? (
                <button 
                  onClick={() => setActiveMenu("sales_orders")}
                  className={`w-full flex items-center justify-center py-2.5 text-[13px] transition-colors ${
                    ["customers", "sales_orders", "invoices"].includes(activeMenu) ? "bg-blue-50 text-blue-600 font-semibold" : "text-[#4b5563] hover:bg-slate-100"
                  }`}
                  title="Sales Management"
                >
                  <ShoppingCart className="w-[18px] h-[18px] shrink-0 text-slate-500" strokeWidth={1.5} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => toggleSection("sales")}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] text-[#4b5563] hover:bg-slate-100 font-normal border-l-[3px] border-transparent pl-4 transition-colors`}
                  >
                    <div className="relative flex items-center w-4 h-4 mr-1">
                      <span className={`absolute -left-3 transition-transform ${openSections.sales ? "rotate-90" : "rotate-0"} text-slate-400`}>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                      <ShoppingCart className="w-[18px] h-[18px] absolute text-slate-500" strokeWidth={1.5} />
                    </div>
                    Sales
                  </button>
                  {openSections.sales && (
                    <div className="flex flex-col mt-0.5 py-1 pl-10 space-y-1">
                      {[
                        { label: "Customers", id: "customers" },
                        { label: "Sales Orders", id: "sales_orders" },
                        { label: "Invoices", id: "invoices" }
                      ].map(sub => (
                        <button 
                          key={sub.id} 
                          onClick={() => setActiveMenu(sub.id)} 
                          className={`text-left py-1 text-[13px] block ${activeMenu === sub.id ? "text-blue-600 font-semibold" : "text-[#4b5563] hover:text-slate-900"}`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Purchases Section */}
            <div>
              {isSidebarCollapsed ? (
                <button 
                  onClick={() => { alert("Purchases flow is locked in standard simulation. Switch to Premium standard module."); }}
                  className="w-full flex items-center justify-center py-2.5 text-[13px] text-[#4b5563] hover:bg-slate-100 transition-colors"
                  title="Purchases Management"
                >
                  <Inbox className="w-[18px] h-[18px] shrink-0 text-slate-500" strokeWidth={1.5} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => toggleSection("purchases")}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] text-[#4b5563] hover:bg-slate-100 font-normal border-l-[3px] border-transparent pl-4 transition-colors`}
                  >
                    <div className="relative flex items-center w-4 h-4 mr-1">
                      <span className={`absolute -left-3 transition-transform ${openSections.purchases ? "rotate-90" : "rotate-0"} text-slate-400`}>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                      <Inbox className="w-[18px] h-[18px] absolute text-slate-500" strokeWidth={1.5} />
                    </div>
                    Purchases
                  </button>
                  {openSections.purchases && (
                    <div className="flex flex-col mt-0.5 py-1 pl-10 space-y-1">
                      {[
                        { label: "Vendors", id: "vendors" },
                        { label: "Expenses", id: "expenses" },
                        { label: "Purchase Orders", id: "purchase_orders" }
                      ].map(sub => (
                        <button 
                          key={sub.id} 
                          onClick={() => setActiveMenu(sub.id)} 
                          className={`text-left py-1 text-[13px] block ${activeMenu === sub.id ? "text-blue-600 font-semibold" : "text-[#4b5563] hover:text-slate-900"}`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <button 
              onClick={() => { alert("Exporting reports is a pro function."); }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] text-[#4b5563] hover:bg-slate-100 font-normal border-l-[3px] border-transparent pl-4 mt-1 ${isSidebarCollapsed ? 'justify-center pl-0' : ''}`}
              title="Reports / Business Intelligence"
            >
              <FileSpreadsheet className="w-[18px] h-[18px] shrink-0 text-slate-500" strokeWidth={1.5} />
              {!isSidebarCollapsed && <span>Reports</span>}
            </button>
            
            <button 
              onClick={() => { alert("Documents folder contains standard invoices CSVs."); }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] text-[#4b5563] hover:bg-slate-100 font-normal border-l-[3px] border-transparent pl-4 ${isSidebarCollapsed ? 'justify-center pl-0' : ''}`}
              title="Documents Store"
            >
              <Folder className="w-[18px] h-[18px] shrink-0 text-slate-500" strokeWidth={1.5} />
              {!isSidebarCollapsed && <span>Documents</span>}
            </button>

            {/* Configure Features Button */}
            {!isSidebarCollapsed && (
              <div className="px-4 py-3 mt-2">
                <button onClick={() => { setActiveMenu("settings"); }} className="w-full flex items-center justify-center gap-1 py-1.5 px-3 bg-[#e0f2fe] hover:bg-blue-100 text-[#0284c7] font-medium text-[12px] rounded-sm transition-colors border border-transparent">
                  Configure Features <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Live Onboarding Card widget */}
            {!isSidebarCollapsed && (
              <div className="mx-3 mt-2 mb-3 p-3 bg-white border border-slate-200 rounded-md relative shadow-xs flex flex-col items-center">
                <div className="w-16 h-10 bg-slate-100 rounded-sm mb-2 relative flex items-center justify-center border border-slate-200">
                  <div className="w-11 h-7 bg-[#312e81] rounded-sm flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold">▶</span>
                  </div>
                  <div className="absolute bottom-0 w-16 h-1 bg-slate-400 rounded-full"></div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-blue-50 text-blue-600 mb-1 leading-none uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  LIVE GUIDED ONBOARDING
                </span>
                <p className="text-[10px] text-slate-500 text-center leading-normal mb-2">
                  Join us for a free onboarding walkthrough to get started with Spareflow Inventory.
                </p>
                <button onClick={() => alert("Launching live onboarding tour demo")} className="text-[11px] font-bold text-[#2485e8] hover:underline flex items-center">
                  Register Now <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

          </div>

          {/* Bottom Sidebar Collapse Handle */}
          <div className="border-t border-slate-200 p-2 bg-[#f4f5f7] flex items-center justify-start">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 px-2 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/50 transition-colors w-full flex items-center justify-center"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <span className="text-[11px] font-mono font-bold flex items-center gap-1 tracking-tighter">
                {isSidebarCollapsed ? "▶ ||" : "◀ ||"}
              </span>
            </button>
          </div>
        </nav>

        {/* MAIN CONTENT VIEWER */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeUserRole === "Read-Only" && activeMenu !== "settings" && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-amber-800 text-[12px] font-semibold shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span><strong>Read-Only Access Level:</strong> You are currently simulating a read-only role. To create or edit items, sales orders, or settings, change your role inside the Settings board.</span>
              </div>
              <button 
                onClick={() => {
                  setPrevMenu(activeMenu);
                  setActiveMenu("settings");
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1 rounded text-[11px] transition-colors cursor-pointer"
              >
                Switch Role / User
              </button>
            </div>
          )}
          {activeMenu === "home" ? (
             <ProductionDashboard 
               onSwitchToDev={() => setActiveMenu("sandbox")} 
               currentUser={currentUser} 
             />
          ) : activeMenu === "items" ? (
             <ItemsList />
          ) : activeMenu === "customers" ? (
             <CustomersList />
          ) : activeMenu === "sales_orders" ? (
             <SalesOrdersList />
          ) : activeMenu === "invoices" ? (
             <InvoicesList />
          ) : activeMenu === "inventory_adjustments" ? (
             <InventoryAdjustmentsList />
          ) : activeMenu === "move_orders" ? (
             <MoveOrdersList />
          ) : activeMenu === "putaways" ? (
             <PutawaysList />
          ) : activeMenu === "packages" ? (
             <PackagesList onNavigateToSalesOrders={() => setActiveMenu("sales_orders")} />
          ) : activeMenu === "shipments" ? (
             <ShipmentsList onNavigateToSalesOrders={() => setActiveMenu("sales_orders")} onNavigateToPackages={() => setActiveMenu("packages")} />
          ) : activeMenu === "settings" ? (
             <SettingsPage onClose={() => setActiveMenu(prevMenu)} />
          ) : activeMenu === "sandbox" ? (
            <div className="p-6 overflow-y-auto w-full h-full">
              <Playground />
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Module Under Construction</h3>
              <p className="text-sm mt-1">The {activeMenu} interface is currently being compiled.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
