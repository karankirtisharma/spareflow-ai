import React, { useState, useEffect } from 'react';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, ChevronDown, FileDown,
  Search, Trash2, CheckCircle2, AlertCircle, Calendar, RefreshCw, FileSpreadsheet,
  PlusCircle, MinusCircle, User, CreditCard, ChevronRight, Download, X,
  ArrowRight, ArrowLeftRight, Check, UploadCloud, Info, AlertTriangle, Layers,
  TrendingUp, Truck, Package, PackageOpen, ClipboardCheck, PlayCircle, Eye,
  Building2, Users, Sliders, ShieldAlert, CheckSquare, Sparkles, Shield, Star, Globe,
  HelpCircle as HelpIcon, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Organization {
  id: string;
  name: string;
  industry?: string;
  location: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  logoUrl?: string;
  paymentStubsAddress?: boolean;
  contactName?: string;
  contactEmail: string;
  taxNumber: string;
  brandingColor: string;
  isMain: boolean;
  baseCurrency?: string;
  fiscalYear?: string;
  language?: string;
  commLanguages?: string[];
  timezone?: string;
  dateFormat?: string;
  dateSeparator?: string;
  companyId?: string;
}

interface LocationRecord {
  id: string;
  orgId: string;
  name: string;
  type: 'Business' | 'Warehouse';
  logoSource: string;
  isChild: boolean;
  attention?: string;
  street1?: string;
  street2?: string;
  city?: string;
  pinCode?: string;
  country: string;
  state: string;
  phone?: string;
  fax?: string;
  website?: string;
  primaryContact: string;
  transactionSeries: string;
  defaultTransactionSeries: string;
  selectedUsers: string[];
}

interface Role {
  id: string;
  name: string;
  desc: string;
  permissions: {
    items: 'none' | 'view' | 'edit' | 'all';
    inventory: 'none' | 'view' | 'edit' | 'all';
    sales: 'none' | 'view' | 'edit' | 'all';
    purchases: 'none' | 'view' | 'edit' | 'all';
    settings: 'none' | 'view' | 'all';
  };
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  roleId: string;
  orgId: string;
  status: 'Active' | 'Inactive';
}

interface SettingsPageProps {
  onClose: () => void;
  onStateChange?: () => void; // Call this to inform parent App to re-sync
}

export function SettingsPage({ onClose, onStateChange }: SettingsPageProps) {
  // Search query for settings menus
  const [searchQuery, setSearchQuery] = useState("");

  // Sub-navigation view states
  // view: 'grid' (All Settings) or config subviews
  const [currentSubView, setCurrentSubView] = useState<'grid' | 'organization' | 'profile' | 'branding' | 'locations' | 'add_location' | 'ai_integration' | 'approvals' | 'users' | 'roles' | 'general' | 'currencies' | 'payment_terms'>('grid');

  // Persistence State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState("org1");
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activeUserId, setActiveUserId] = useState("usr1");
  const [locations, setLocations] = useState<LocationRecord[]>([]);

  // Setup State
  const [generalConfig, setGeneralConfig] = useState({
    companyName: "XYZ Parts",
    contactEmail: "contact@xyzparts.com",
    contactPhone: "+91 98765 43210",
    timezone: "IST (India Standard Time)"
  });
  const [currencies, setCurrencies] = useState<{ code: string; name: string; symbol: string; isDefault: boolean }[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<{ id: string; name: string; days: number }[]>([]);

  // Modals / Creators
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // New Organization Form
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgLocation, setNewOrgLocation] = useState("");
  const [newOrgEmail, setNewOrgEmail] = useState("");
  const [newOrgTax, setNewOrgTax] = useState("");
  const [newOrgColor, setNewOrgColor] = useState("#2485e8");

  // New Location Form State
  const [newLocType, setNewLocType] = useState<'Business' | 'Warehouse'>('Business');
  const [newLocLogo, setNewLocLogo] = useState('same_as_org');
  const [newLocName, setNewLocName] = useState("");
  const [isChildLoc, setIsChildLoc] = useState(false);
  const [newLocAttention, setNewLocAttention] = useState("");
  const [newLocStreet1, setNewLocStreet1] = useState("");
  const [newLocStreet2, setNewLocStreet2] = useState("");
  const [newLocCity, setNewLocCity] = useState("");
  const [newLocPinCode, setNewLocPinCode] = useState("");
  const [newLocCountry, setNewLocCountry] = useState("India");
  const [newLocState, setNewLocState] = useState("Jammu and Kashmir");
  const [newLocPhone, setNewLocPhone] = useState("");
  const [newLocFax, setNewLocFax] = useState("");
  const [newLocWebsite, setNewLocWebsite] = useState("");
  const [newLocPrimaryContact, setNewLocPrimaryContact] = useState("Paramnoor Singh <paramnoor15@gmail.com>");
  const [newLocSeries, setNewLocSeries] = useState("Default Transaction Series");
  const [newLocDefaultSeries, setNewLocDefaultSeries] = useState("Default Transaction Series");
  const [newLocUsers, setNewLocUsers] = useState<string[]>(["usr1"]); // default has Paramnoor

  // New User Form
  const [newUserRef, setNewUserRef] = useState({
    name: "",
    email: "",
    roleId: "admin",
    orgId: "org1"
  });

  // New Payment Term Form
  const [newTerm, setNewTerm] = useState({ name: "", days: 30 });

  // New Currency Form
  const [newCurrency, setNewCurrency] = useState({ code: "", name: "", symbol: "" });

  // Load state from localStorage on mount
  useEffect(() => {
    // 1. Organizations
    const savedOrgs = localStorage.getItem('spareflow_settings_orgs');
    if (savedOrgs) {
      try {
        const parsed = JSON.parse(savedOrgs);
        // Map to ensure rich details are present
        const enriched = parsed.map((o: any) => ({
          ...o,
          industry: o.industry || "Automotive",
          addressLine1: o.addressLine1 || "Head Office",
          addressLine2: o.addressLine2 || "Industrial Area Phase II",
          city: o.city || "Srinagar",
          state: o.state || "Jammu and Kashmir",
          pinCode: o.pinCode || "190001",
          logoUrl: o.logoUrl || "",
          paymentStubsAddress: o.paymentStubsAddress ?? false,
          contactName: o.contactName || (o.id === 'org1' ? "Paramnoor Singh" : "Manager"),
          baseCurrency: o.baseCurrency || "INR",
          fiscalYear: o.fiscalYear || "April - March",
          language: o.language || "English",
          commLanguages: o.commLanguages || ["English"],
          timezone: o.timezone || "(GMT 5:30) India Standard Time (Asia/Calcutta)",
          dateFormat: o.dateFormat || "dd/mm/yyyy",
          dateSeparator: o.dateSeparator || "/",
          companyId: o.companyId || (o.id === 'org1' ? "60073295223" : o.id === 'org2' ? "60073295224" : "60073295225")
        }));
        setOrganizations(enriched);
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultOrgs: Organization[] = [
        { 
          id: "org1", 
          name: "XYZ Parts", 
          industry: "Automotive",
          location: "India", 
          addressLine1: "Head Office",
          addressLine2: "Industrial Area Phase II",
          city: "Srinagar",
          state: "Jammu and Kashmir",
          pinCode: "190001",
          contactName: "Paramnoor Singh",
          contactEmail: "paramnoor15@gmail.com", 
          taxNumber: "27AAACX1234F1Z1", 
          brandingColor: "#2485e8", 
          isMain: true,
          baseCurrency: "INR",
          fiscalYear: "April - March",
          language: "English",
          commLanguages: ["English"],
          timezone: "(GMT 5:30) India Standard Time (Asia/Calcutta)",
          dateFormat: "dd/mm/yyyy",
          dateSeparator: "/",
          companyId: "60073295223"
        },
        { 
          id: "org2", 
          name: "Metro Auto Spares", 
          industry: "Automotive",
          location: "India", 
          contactName: "Ramesh Singh",
          contactEmail: "delhi@xyzparts.com", 
          taxNumber: "07AAACX5678R2Z2", 
          brandingColor: "#10b981", 
          isMain: false,
          baseCurrency: "INR",
          fiscalYear: "April - March",
          language: "English",
          commLanguages: ["English"],
          timezone: "(GMT 5:30) India Standard Time (Asia/Calcutta)",
          dateFormat: "dd/mm/yyyy",
          dateSeparator: "/",
          companyId: "60073295224"
        },
        { 
          id: "org3", 
          name: "Sanjay Motors", 
          industry: "Automotive",
          location: "India", 
          contactName: "Sanjay Kumar",
          contactEmail: "sanjay@motors.in", 
          taxNumber: "29AAACX9012K3Z3", 
          brandingColor: "#f59e0b", 
          isMain: false,
          baseCurrency: "INR",
          fiscalYear: "April - March",
          language: "English",
          commLanguages: ["English"],
          timezone: "(GMT 5:30) India Standard Time (Asia/Calcutta)",
          dateFormat: "dd/mm/yyyy",
          dateSeparator: "/",
          companyId: "60073295225"
        }
      ];
      setOrganizations(defaultOrgs);
      localStorage.setItem('spareflow_settings_orgs', JSON.stringify(defaultOrgs));
    }

    // 2. Active Org ID
    const savedActiveOrg = localStorage.getItem('spareflow_settings_active_org_id') || "org1";
    setActiveOrgId(savedActiveOrg);

    // 3. Roles
    const savedRoles = localStorage.getItem('spareflow_settings_roles');
    if (savedRoles) {
      try {
        setRoles(JSON.parse(savedRoles));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultRoles: Role[] = [
        { id: "admin", name: "Admin", desc: "Full administrative access with all privileges.", permissions: { items: 'all', inventory: 'all', sales: 'all', purchases: 'all', settings: 'all' } },
        { id: "manager", name: "Manager", desc: "Can view and edit inventory, items, sales, and purchases.", permissions: { items: 'all', inventory: 'all', sales: 'all', purchases: 'all', settings: 'view' } },
        { id: "dispatcher", name: "Dispatcher", desc: "Can pack and ship packages, and view items and stocks.", permissions: { items: 'view', inventory: 'view', sales: 'edit', purchases: 'none', settings: 'none' } },
        { id: "readonly", name: "Read-Only", desc: "Can view all data but cannot modify or create records.", permissions: { items: 'view', inventory: 'view', sales: 'view', purchases: 'view', settings: 'view' } }
      ];
      setRoles(defaultRoles);
      localStorage.setItem('spareflow_settings_roles', JSON.stringify(defaultRoles));
    }

    // 4. Users
    const savedUsers = localStorage.getItem('spareflow_settings_users');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultUsers: UserRecord[] = [
        { id: "usr1", name: "Paramnoor Singh", email: "paramnoor15@gmail.com", roleId: "admin", orgId: "org1", status: "Active" },
        { id: "usr2", name: "Ramesh Singh", email: "ramesh@metrospares.com", roleId: "manager", orgId: "org2", status: "Active" },
        { id: "usr3", name: "Vikram Seth", email: "vikram@sanjay.in", roleId: "dispatcher", orgId: "org3", status: "Active" },
        { id: "usr4", name: "Anil Ambani", email: "anil@readonly.in", roleId: "readonly", orgId: "org1", status: "Active" }
      ];
      setUsers(defaultUsers);
      localStorage.setItem('spareflow_settings_users', JSON.stringify(defaultUsers));
    }

    // 5. Active User ID
    const savedActiveUser = localStorage.getItem('spareflow_settings_active_user_id') || "usr1";
    setActiveUserId(savedActiveUser);

    // 6. Setup General
    const savedGen = localStorage.getItem('spareflow_settings_general');
    if (savedGen) {
      try { setGeneralConfig(JSON.parse(savedGen)); } catch(e){}
    }

    // 7. Currencies
    const savedCurrencies = localStorage.getItem('spareflow_settings_currencies');
    if (savedCurrencies) {
      try { setCurrencies(JSON.parse(savedCurrencies)); } catch(e){}
    } else {
      const defaultCurrencies = [
        { code: "INR", name: "Indian Rupee", symbol: "₹", isDefault: true },
        { code: "USD", name: "United States Dollar", symbol: "$", isDefault: false },
        { code: "EUR", name: "Euro", symbol: "€", isDefault: false }
      ];
      setCurrencies(defaultCurrencies);
      localStorage.setItem('spareflow_settings_currencies', JSON.stringify(defaultCurrencies));
    }

    // 8. Payment Terms
    const savedTerms = localStorage.getItem('spareflow_settings_terms');
    if (savedTerms) {
      try { setPaymentTerms(JSON.parse(savedTerms)); } catch(e){}
    } else {
      const defaultTerms = [
        { id: "t1", name: "Net 30", days: 30 },
        { id: "t2", name: "Due on Receipt", days: 0 },
        { id: "t3", name: "Net 15", days: 15 },
        { id: "t4", name: "Net 45", days: 45 }
      ];
      setPaymentTerms(defaultTerms);
      localStorage.setItem('spareflow_settings_terms', JSON.stringify(defaultTerms));
    }

    // 9. Locations
    const savedLocs = localStorage.getItem('spareflow_settings_locations');
    if (savedLocs) {
      try {
        setLocations(JSON.parse(savedLocs));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultLocs: LocationRecord[] = [
        {
          id: "loc1",
          orgId: "org1",
          name: "Head Office",
          type: "Business",
          logoSource: "same_as_org",
          isChild: false,
          street1: "Head Office address",
          city: "Srinagar",
          country: "India",
          state: "Jammu and Kashmir",
          primaryContact: "Paramnoor Singh <paramnoor15@gmail.com>",
          transactionSeries: "Default Transaction Series",
          defaultTransactionSeries: "Default Transaction Series",
          selectedUsers: ["usr1"]
        }
      ];
      setLocations(defaultLocs);
      localStorage.setItem('spareflow_settings_locations', JSON.stringify(defaultLocs));
    }
  }, []);

  // Sync to local storage
  const syncOrgs = (list: Organization[]) => {
    setOrganizations(list);
    localStorage.setItem('spareflow_settings_orgs', JSON.stringify(list));
    onStateChange?.();
  };

  const syncActiveOrg = (id: string) => {
    setActiveOrgId(id);
    localStorage.setItem('spareflow_settings_active_org_id', id);
    
    // Also auto-sync general company name with the selected org name
    const org = organizations.find(o => o.id === id);
    if (org) {
      const updatedGen = { ...generalConfig, companyName: org.name };
      setGeneralConfig(updatedGen);
      localStorage.setItem('spareflow_settings_general', JSON.stringify(updatedGen));
    }
    
    // Trigger window event so rest of app re-renders topbar org
    window.dispatchEvent(new Event("spareflow_session_update"));
    onStateChange?.();
  };

  const updateActiveOrgField = (key: keyof Organization, value: any) => {
    const updated = organizations.map(org => {
      if (org.id === activeOrgId) {
        return { ...org, [key]: value };
      }
      return org;
    });
    syncOrgs(updated);

    // If active org name was updated, keep general config companyName synchronized too
    if (key === 'name') {
      const updatedGen = { ...generalConfig, companyName: value };
      setGeneralConfig(updatedGen);
      localStorage.setItem('spareflow_settings_general', JSON.stringify(updatedGen));
      window.dispatchEvent(new Event("spareflow_session_update"));
    }
  };

  const syncUsers = (list: UserRecord[]) => {
    setUsers(list);
    localStorage.setItem('spareflow_settings_users', JSON.stringify(list));
    onStateChange?.();
  };

  const syncActiveUser = (id: string) => {
    setActiveUserId(id);
    localStorage.setItem('spareflow_settings_active_user_id', id);

    // Find the user and set their role in simulated session
    const u = users.find(usr => usr.id === id);
    if (u) {
      const activeRoleObj = roles.find(r => r.id === u.roleId);
      (window as any).__spareflow_session = {
        user: {
          full_name: u.name,
          email: u.email,
          role: activeRoleObj?.name || "Admin"
        }
      };
      
      // Auto-switch to user's associated organization for seamless testing
      if (u.orgId && u.orgId !== activeOrgId) {
        setActiveOrgId(u.orgId);
        localStorage.setItem('spareflow_settings_active_org_id', u.orgId);
      }
    }

    window.dispatchEvent(new Event("spareflow_session_update"));
    onStateChange?.();
  };

  const syncRoles = (list: Role[]) => {
    setRoles(list);
    localStorage.setItem('spareflow_settings_roles', JSON.stringify(list));
    onStateChange?.();
  };

  // Handle Organization Creation
  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: newOrgName.trim(),
      location: newOrgLocation.trim() || "General Location",
      contactEmail: newOrgEmail.trim() || "contact@shop.com",
      taxNumber: newOrgTax.trim() || "N/A",
      brandingColor: newOrgColor,
      isMain: false
    };

    const list = [...organizations, newOrg];
    syncOrgs(list);
    setShowOrgModal(false);

    // Reset fields
    setNewOrgName("");
    setNewOrgLocation("");
    setNewOrgEmail("");
    setNewOrgTax("");
    setNewOrgColor("#2485e8");
    alert(`Shop/Organization "${newOrg.name}" successfully created!`);
  };

  // Handle Organization Deletion
  const handleDeleteOrg = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (organizations.length <= 1) {
      alert("At least one organization is required.");
      return;
    }
    if (id === activeOrgId) {
      alert("Cannot delete the active organization. Please switch to another first.");
      return;
    }
    if (confirm("Are you sure you want to delete this shop/organization?")) {
      const list = organizations.filter(o => o.id !== id);
      syncOrgs(list);
    }
  };

  // Handle User Creation
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserRef.name.trim() || !newUserRef.email.trim()) return;

    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      name: newUserRef.name.trim(),
      email: newUserRef.email.trim(),
      roleId: newUserRef.roleId,
      orgId: newUserRef.orgId,
      status: "Active"
    };

    const list = [...users, newUser];
    syncUsers(list);
    setShowUserModal(false);
    setNewUserRef({ name: "", email: "", roleId: "admin", orgId: activeOrgId });
    alert(`User "${newUser.name}" created!`);
  };

  const handleDeleteUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (users.length <= 1) {
      alert("At least one user must remain in the database.");
      return;
    }
    if (id === activeUserId) {
      alert("Cannot delete yourself (the active user)!");
      return;
    }
    if (confirm("Delete this user?")) {
      const list = users.filter(u => u.id !== id);
      syncUsers(list);
    }
  };

  // Handle payment term save
  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.name.trim()) return;
    const item = { id: `term-${Date.now()}`, name: newTerm.name, days: Number(newTerm.days) };
    const list = [...paymentTerms, item];
    setPaymentTerms(list);
    localStorage.setItem('spareflow_settings_terms', JSON.stringify(list));
    setShowTermModal(false);
    setNewTerm({ name: "", days: 30 });
  };

  const handleDeleteTerm = (id: string) => {
    if (confirm("Delete this payment term?")) {
      const list = paymentTerms.filter(t => t.id !== id);
      setPaymentTerms(list);
      localStorage.setItem('spareflow_settings_terms', JSON.stringify(list));
    }
  };

  // Handle currency save
  const handleCreateCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrency.code.trim() || !newCurrency.symbol.trim()) return;
    const item = { code: newCurrency.code.toUpperCase(), name: newCurrency.name, symbol: newCurrency.symbol, isDefault: false };
    const list = [...currencies, item];
    setCurrencies(list);
    localStorage.setItem('spareflow_settings_currencies', JSON.stringify(list));
    setShowCurrencyModal(false);
    setNewCurrency({ code: "", name: "", symbol: "" });
  };

  const handleSetDefaultCurrency = (code: string) => {
    const list = currencies.map(c => ({ ...c, isDefault: c.code === code }));
    setCurrencies(list);
    localStorage.setItem('spareflow_settings_currencies', JSON.stringify(list));
    alert(`Base currency set to ${code}. Prices will reflect with the updated symbol.`);
  };

  const handleDeleteCurrency = (code: string) => {
    const item = currencies.find(c => c.code === code);
    if (item?.isDefault) {
      alert("Cannot delete the default currency.");
      return;
    }
    if (confirm("Delete this currency?")) {
      const list = currencies.filter(c => c.code !== code);
      setCurrencies(list);
      localStorage.setItem('spareflow_settings_currencies', JSON.stringify(list));
    }
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) {
      alert("Please enter a location name.");
      return;
    }
    const newLoc: LocationRecord = {
      id: "loc_" + Date.now(),
      orgId: activeOrgId,
      name: newLocName,
      type: newLocType,
      logoSource: newLocLogo,
      isChild: isChildLoc,
      attention: newLocAttention,
      street1: newLocStreet1,
      street2: newLocStreet2,
      city: newLocCity,
      pinCode: newLocPinCode,
      country: newLocCountry,
      state: newLocState,
      phone: newLocPhone,
      fax: newLocFax,
      website: newLocWebsite,
      primaryContact: newLocPrimaryContact,
      transactionSeries: newLocSeries,
      defaultTransactionSeries: newLocDefaultSeries,
      selectedUsers: newLocUsers
    };
    
    const updated = [...locations, newLoc];
    setLocations(updated);
    localStorage.setItem('spareflow_settings_locations', JSON.stringify(updated));
    
    // reset form
    setNewLocName("");
    setNewLocAttention("");
    setNewLocStreet1("");
    setNewLocStreet2("");
    setNewLocCity("");
    setNewLocPinCode("");
    setNewLocPhone("");
    setNewLocFax("");
    setNewLocWebsite("");
    setIsChildLoc(false);
    
    setCurrentSubView('locations');
    alert("New location successfully added to active organization!");
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      const updated = locations.filter(loc => loc.id !== id);
      setLocations(updated);
      localStorage.setItem('spareflow_settings_locations', JSON.stringify(updated));
    }
  };

  // Handle edit role permission
  const handleTogglePermission = (roleId: string, module: keyof Role['permissions'], level: 'none' | 'view' | 'edit' | 'all') => {
    const updated = roles.map(r => {
      if (r.id === roleId) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [module]: level
          }
        };
      }
      return r;
    });
    syncRoles(updated);
  };

  // Switch role directly from the settings role playground
  const handleDirectRoleSwitch = (roleId: string) => {
    // Find current active user
    const curUsrObj = users.find(u => u.id === activeUserId);
    if (curUsrObj) {
      const updatedUsers = users.map(u => {
        if (u.id === activeUserId) {
          return { ...u, roleId };
        }
        return u;
      });
      syncUsers(updatedUsers);
      syncActiveUser(activeUserId);
      alert(`Role switched! You are now testing as ${curUsrObj.name} with "${roles.find(r => r.id === roleId)?.name}" role.`);
    }
  };

  // Find dynamic names for labels
  const activeOrgObj = organizations.find(o => o.id === activeOrgId);
  const activeUserObj = users.find(u => u.id === activeUserId);
  const activeRoleObj = activeUserObj ? roles.find(r => r.id === activeUserObj.roleId) : null;

  return (
    <div className="flex-1 flex flex-col bg-[#fafbfc] h-full relative font-sans overflow-hidden">
      
      {/* Settings Screen Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 bg-white shrink-0 shadow-3xs z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-[#2485e8] rounded-lg">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold text-slate-800 flex items-center gap-1.5">
              {currentSubView === 'grid' ? "All Settings" : `Settings › ${currentSubView.toUpperCase()}`}
            </h2>
            <p className="text-[11.5px] text-slate-400 mt-0.5">
              Organization: <strong className="text-slate-650 font-bold">{activeOrgObj?.name || "XYZ Parts"}</strong> ({activeOrgObj?.location})
              <span className="mx-2 text-slate-300">|</span> 
              Active Test User: <strong className="text-[#2485e8] font-bold">{activeUserObj?.name}</strong> ({activeRoleObj?.name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Testing Hub Widget in Header */}
          <div className="hidden lg:flex items-center gap-2 bg-indigo-50/70 border border-indigo-150 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 shadow-3xs">
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>Switch Test User:</span>
            <select
              value={activeUserId}
              onChange={(e) => syncActiveUser(e.target.value)}
              className="bg-white border border-indigo-200 rounded py-0.5 px-2 text-[11.5px] text-slate-800 font-bold focus:outline-none"
            >
              {users.map(u => {
                const uRole = roles.find(r => r.id === u.roleId);
                return (
                  <option key={u.id} value={u.id}>{u.name} ({uRole?.name || "User"})</option>
                );
              })}
            </select>
          </div>

          {currentSubView !== 'grid' && (
            <button 
              onClick={() => setCurrentSubView('grid')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-1.5 rounded text-[12.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              ‹ Back to Board
            </button>
          )}

          <button 
            onClick={onClose}
            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-1.5 rounded text-[12.5px] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Close Settings <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid or Config Views */}
      <div className="flex-1 flex overflow-hidden">
        
        {currentSubView !== 'grid' && (
          <aside className="w-60 border-r border-slate-200 bg-[#fafbfc] flex flex-col shrink-0 overflow-y-auto select-none">
            <div className="p-4 border-b border-slate-100 bg-[#fcfdfd]">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest block">Settings Directory</span>
            </div>
            
            <nav className="p-3 space-y-5 flex-1">
              {/* Group 1: Organization Settings */}
              <div className="space-y-1">
                <span className="px-3 py-1.5 text-[10.5px] font-extrabold text-slate-450 uppercase tracking-widest block">
                  Organization
                </span>
                
                {[
                  { name: "Profile & Address", sub: "profile", icon: Building2 },
                  { name: "Shops Directory", sub: "organization", icon: Layers },
                  { name: "Branding Details", sub: "branding", icon: Sparkles },
                  { name: "Locations Setup", sub: "locations", icon: Globe },
                  { name: "AI Integration", sub: "ai_integration", icon: Sparkles },
                  { name: "Approvals System", sub: "approvals", icon: CheckCircle2 },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isActive = currentSubView === item.sub || (item.sub === 'locations' && currentSubView === 'add_location');
                  return (
                    <button
                      key={item.sub}
                      onClick={() => setCurrentSubView(item.sub as any)}
                      className={`w-full text-left py-2 px-3.5 rounded-lg text-[12.5px] font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#2485e8] text-white font-bold shadow-xs' 
                          : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Group 2: Access Management */}
              <div className="space-y-1">
                <span className="px-3 py-1.5 text-[10.5px] font-extrabold text-slate-450 uppercase tracking-widest block">
                  Users & Roles
                </span>
                
                {[
                  { name: "Users Directory", sub: "users", icon: Users },
                  { name: "Roles & RBAC Matrix", sub: "roles", icon: Shield },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isActive = currentSubView === item.sub;
                  return (
                    <button
                      key={item.sub}
                      onClick={() => setCurrentSubView(item.sub as any)}
                      className={`w-full text-left py-2 px-3.5 rounded-lg text-[12.5px] font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#2485e8] text-white font-bold shadow-xs' 
                          : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Group 3: Setup & Configurations */}
              <div className="space-y-1">
                <span className="px-3 py-1.5 text-[10.5px] font-extrabold text-slate-450 uppercase tracking-widest block">
                  Setup & Config
                </span>
                
                {[
                  { name: "General Settings", sub: "general", icon: Sliders },
                  { name: "Currencies Setup", sub: "currencies", icon: ArrowLeftRight },
                  { name: "Payment Terms", sub: "payment_terms", icon: CreditCard },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isActive = currentSubView === item.sub;
                  return (
                    <button
                      key={item.sub}
                      onClick={() => setCurrentSubView(item.sub as any)}
                      className={`w-full text-left py-2 px-3.5 rounded-lg text-[12.5px] font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#2485e8] text-white font-bold shadow-xs' 
                          : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>
        )}
        
        <div className={`flex-1 overflow-y-auto ${currentSubView === 'grid' ? 'p-6 md:p-8' : 'p-6 md:p-8 bg-[#fafbfc]'}`}>
          
          {currentSubView === 'grid' && (
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Search Input Box */}
            <div className="flex justify-center max-w-xl mx-auto">
              <div className="relative w-full">
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
                <input 
                  type="text" 
                  placeholder="Search setups, preferences, users, roles or modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-4 py-2.5 w-full bg-white border border-slate-250 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-3xs"
                />
              </div>
            </div>

            {/* QUICK PREVIEW / PLAYGROUND RBAC WARNING INFO */}
            <div className="bg-gradient-to-r from-[#2485e8]/10 via-[#ec4899]/5 to-[#10b981]/5 border border-blue-150 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs">
              <div className="flex gap-3">
                <div className="p-2 bg-[#2485e8] text-white rounded-lg shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-bold text-slate-800">Switch & Test Roles & Multi-Shops (RBAC Enabled)</h4>
                  <p className="text-[12px] text-slate-500 mt-1">
                    Select different shops (Organizations) to allocate inventory or switch active roles to test read-only limits and restrictions instantly in real-time.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/80 border border-slate-100 p-2 rounded-lg shrink-0 shadow-3xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Active Shop:</span>
                <span className="font-bold text-slate-800 text-[12px] px-2 py-0.5 rounded bg-slate-100">{activeOrgObj?.name}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase ml-2">Active Role:</span>
                <span className="font-extrabold text-[#2485e8] text-[12px] px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{activeRoleObj?.name}</span>
              </div>
            </div>

            {/* ALL SETTINGS BOARDS MAPPED DIRECTLY FROM SCREENSHOT */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              
              {/* Card 1: Organization */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-4xs overflow-hidden flex flex-col hover:border-slate-300 transition-all hover:shadow-3xs">
                <div className="bg-emerald-50/70 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <Building2 className="w-[17px] h-[17px] text-emerald-600" />
                  <span className="text-[13px] font-extrabold text-emerald-800 uppercase tracking-wider">Organization</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    {[
                      { name: "Profile & Shops", sub: "profile" },
                      { name: "Branding", sub: "branding" },
                      { name: "Locations", sub: "locations" },
                      { name: "AI Integration", sub: "ai_integration" },
                      { name: "Approvals", sub: "approvals" }
                    ].map((itm, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentSubView(itm.sub as any)}
                        className="w-full text-left py-1.5 px-2.5 rounded-[4px] text-[13px] text-slate-600 hover:bg-slate-50 transition-colors font-medium block relative hover:text-slate-900 cursor-pointer"
                      >
                        {itm.name}
                        {['profile', 'branding', 'locations', 'ai_integration', 'approvals'].includes(itm.sub) && <span className="absolute right-2 top-2.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Users & Roles */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-4xs overflow-hidden flex flex-col hover:border-slate-300 transition-all hover:shadow-3xs">
                <div className="bg-rose-50/70 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <Users className="w-[17px] h-[17px] text-rose-600" />
                  <span className="text-[13px] font-extrabold text-rose-800 uppercase tracking-wider">Users & Roles</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    {[
                      { name: "Users", sub: "users" },
                      { name: "Roles & RBAC Matrix", sub: "roles" },
                      { name: "User Preferences", sub: "users" }
                    ].map((itm, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentSubView(itm.sub as any)}
                        className="w-full text-left py-1.5 px-2.5 rounded-[4px] text-[13px] text-slate-600 hover:bg-slate-50 hover:text-rose-700 transition-colors font-semibold block relative cursor-pointer"
                      >
                        {itm.name}
                        <span className="absolute right-2 top-2.5 w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3: Setup & Configurations */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-4xs overflow-hidden flex flex-col hover:border-slate-300 transition-all hover:shadow-3xs">
                <div className="bg-amber-50/70 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <Sliders className="w-[17px] h-[17px] text-amber-600" />
                  <span className="text-[13px] font-extrabold text-amber-800 uppercase tracking-wider">Setup & Config</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    {[
                      { name: "General Settings", sub: "general" },
                      { name: "Currencies Setup", sub: "currencies" },
                      { name: "Payment Terms", sub: "payment_terms", isNew: true },
                      { name: "Reminders", sub: "grid" },
                      { name: "Customer Portal", sub: "grid" },
                      { name: "Vendor Portal", sub: "grid" }
                    ].map((itm, idx) => (
                      <button 
                        key={idx}
                        onClick={() => itm.sub !== 'grid' && setCurrentSubView(itm.sub as any)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-[4px] text-[13px] text-slate-600 hover:bg-slate-50 transition-colors font-medium flex items-center justify-between ${itm.sub === 'grid' ? 'opacity-55 cursor-not-allowed' : 'hover:text-slate-900 cursor-pointer'}`}
                      >
                        <span>{itm.name}</span>
                        {itm.isNew && (
                          <span className="bg-red-500 text-white font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded scale-90">
                            New
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 4: Customization */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-4xs overflow-hidden flex flex-col hover:border-slate-300 transition-all hover:shadow-3xs">
                <div className="bg-indigo-50/70 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <Sliders className="w-[17px] h-[17px] text-indigo-600" />
                  <span className="text-[13px] font-extrabold text-indigo-800 uppercase tracking-wider">Customization</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between opacity-60">
                  <div className="space-y-1.5 text-slate-500 text-[13px]">
                    <p className="py-1">Transaction Number Series</p>
                    <p className="py-1">PDF Templates</p>
                    <p className="py-1">Email Notifications</p>
                    <p className="py-1">SMS Notifications</p>
                    <p className="py-1">Reporting Tags</p>
                    <p className="py-1">Web Tabs</p>
                  </div>
                </div>
              </div>

              {/* Card 5: Automation */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-4xs overflow-hidden flex flex-col hover:border-slate-300 transition-all hover:shadow-3xs">
                <div className="bg-red-50/70 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <RefreshCw className="w-[17px] h-[17px] text-red-600" />
                  <span className="text-[13px] font-extrabold text-red-800 uppercase tracking-wider">Automation</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between opacity-60">
                  <div className="space-y-1.5 text-slate-500 text-[13px]">
                    <p className="py-1">Workflow Rules</p>
                    <p className="py-1">Workflow Actions</p>
                    <p className="py-1">Workflow Logs</p>
                    <p className="py-1">Schedules</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Lower Row: Module Settings (Direct copy from screenshot layout) */}
            <div className="space-y-4.5 pt-4">
              <h3 className="text-[14px] font-extrabold text-slate-650 uppercase tracking-wider">Module Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                
                {/* Module Card 1: General */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3 opacity-80">
                  <div className="flex items-center gap-2 text-[#2485e8] font-bold text-[13px] uppercase tracking-wide">
                    <User className="w-4 h-4" /> General
                  </div>
                  <div className="text-[12.5px] text-slate-500 space-y-1.5 pl-1">
                    <p>Customers and Vendors</p>
                    <p>Items Directory</p>
                  </div>
                </div>

                {/* Module Card 2: Inventory */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3 opacity-80">
                  <div className="flex items-center gap-2 text-[#2485e8] font-bold text-[13px] uppercase tracking-wide">
                    <Package className="w-4 h-4" /> Inventory
                  </div>
                  <div className="text-[12.5px] text-slate-500 space-y-1.5 pl-1">
                    <p>Units of Measurement</p>
                    <p>Inventory Adjustments</p>
                    <p>Packages System</p>
                    <p>Shipments & EasyPost</p>
                    <p>Online Payments</p>
                  </div>
                </div>

                {/* Module Card 3: Sales */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3 opacity-80">
                  <div className="flex items-center gap-2 text-[#2485e8] font-bold text-[13px] uppercase tracking-wide">
                    <CreditCard className="w-4 h-4" /> Sales
                  </div>
                  <div className="text-[12.5px] text-slate-500 space-y-1.5 pl-1">
                    <p>Sales Orders</p>
                    <p>Delivery Challans</p>
                    <p>Invoices Processing</p>
                    <p>Payments Received</p>
                    <p>Sales Returns</p>
                  </div>
                </div>

                {/* Module Card 4: Purchases */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3 opacity-80">
                  <div className="flex items-center gap-2 text-[#2485e8] font-bold text-[13px] uppercase tracking-wide">
                    <FileSpreadsheet className="w-4 h-4" /> Purchases
                  </div>
                  <div className="text-[12.5px] text-slate-500 space-y-1.5 pl-1">
                    <p>Purchase Orders</p>
                    <p>Purchase Receives</p>
                    <p>Bills Logging</p>
                    <p>Payments Made</p>
                  </div>
                </div>

                {/* Module Card 5: Custom Modules */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3 opacity-80">
                  <div className="flex items-center gap-2 text-[#2485e8] font-bold text-[13px] uppercase tracking-wide">
                    <Sliders className="w-4 h-4" /> Custom Modules
                  </div>
                  <div className="text-[12.5px] text-slate-500 space-y-1.5 pl-1">
                    <p>Overview Dashboard</p>
                    <p>Custom Integrations</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* SUBVIEW: ORGANIZATION PROFILE */}
        {currentSubView === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 border border-slate-200 rounded-xl shadow-3xs">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#2485e8]" /> Organization Profile
                </h3>
                <p className="text-xs text-slate-400 mt-1">Configure your corporate settings, billing entity, and localized formats</p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 px-3 py-1 rounded-full border border-slate-200 text-slate-600 font-mono text-[11.5px] font-bold">
                ID: {activeOrgObj?.companyId || "60073295223"}
              </div>
            </div>

            {/* Spareflow commerce warning block */}
            <div className="bg-blue-50/70 border border-blue-150 p-4 rounded-xl flex items-start gap-3 text-blue-800 text-[12.5px] leading-relaxed">
              <Info className="w-[18px] h-[18px] text-blue-500 shrink-0 mt-0.5" />
              <span>
                You have the same organization in <strong>Spareflow Commerce</strong>. Altering any information on this page will alter it there.
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-3xs p-6 md:p-8 space-y-8">
              {/* Logo Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Organization Logo</span>
                  <div className="mt-2 border-2 border-dashed border-slate-250 hover:border-[#2485e8] rounded-xl p-5 flex flex-col items-center justify-center bg-slate-50/55 cursor-pointer text-center group transition-colors">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#2485e8] mb-2" />
                    <span className="text-[12px] font-extrabold text-[#2485e8]">Upload Your Organization Logo</span>
                  </div>
                </div>
                <div className="md:col-span-2 text-[12px] text-slate-400 leading-relaxed pt-2 space-y-1">
                  <p className="font-bold text-slate-600 text-xs mb-1">This logo will be displayed in transaction PDFs and email notifications.</p>
                  <p>• Preferred Image Dimensions: 240 × 240 pixels @ 72 DPI</p>
                  <p>• Supported Files: jpg, jpeg, png, gif, bmp</p>
                  <p>• Maximum File Size: 1MB</p>
                </div>
              </div>

              {/* Form Grid */}
              <form onSubmit={(e) => { e.preventDefault(); alert("Organization profile changes successfully updated!"); setCurrentSubView('grid'); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Organization Name *</label>
                    <input 
                      type="text" 
                      required
                      value={activeOrgObj?.name || ""} 
                      onChange={(e) => updateActiveOrgField('name', e.target.value)}
                      className="bg-white border border-slate-350 rounded px-3.5 py-2 text-[13px] text-slate-800 w-full focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Industry *</label>
                    <select 
                      value={activeOrgObj?.industry || "Automotive"} 
                      onChange={(e) => updateActiveOrgField('industry', e.target.value)}
                      className="bg-white border border-slate-350 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                    >
                      <option value="Automotive">Automotive</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Services">Services</option>
                      <option value="Technology">Technology</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Organization Location *</label>
                    <select 
                      value={activeOrgObj?.location || "India"} 
                      onChange={(e) => updateActiveOrgField('location', e.target.value)}
                      className="bg-white border border-slate-350 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Singapore">Singapore</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Fiscal Year *</label>
                    <select 
                      value={activeOrgObj?.fiscalYear || "April - March"} 
                      onChange={(e) => updateActiveOrgField('fiscalYear', e.target.value)}
                      className="bg-white border border-slate-350 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                    >
                      <option value="April - March">April - March</option>
                      <option value="January - December">January - December</option>
                    </select>
                  </div>
                </div>

                {/* Location Banner Address info block */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <h4 className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-500" /> Organization Address
                  </h4>
                  <p className="text-[12.5px] text-slate-500 leading-normal">
                    Since Locations has been enabled for your organization, you can add or edit specific operational addresses from the Locations directory setup.
                  </p>
                  <button 
                    type="button"
                    onClick={() => setCurrentSubView('locations')}
                    className="text-[12.5px] font-bold text-[#2485e8] hover:underline flex items-center gap-1"
                  >
                    Go to Locations Setup ›
                  </button>
                </div>

                {/* Switcher toggle */}
                <div className="flex items-center justify-between py-2 border-y border-slate-100">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-700">Add a different address for payment stubs?</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Toggle to specify separate address fields on invoice slips</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateActiveOrgField('paymentStubsAddress', !activeOrgObj?.paymentStubsAddress)}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${activeOrgObj?.paymentStubsAddress ? 'bg-[#2485e8]' : 'bg-slate-300'}`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${activeOrgObj?.paymentStubsAddress ? 'translate-x-5' : 'translate-x-0'}`}></span>
                  </button>
                </div>

                {/* Primary Contacts Row */}
                <div className="space-y-3">
                  <h4 className="text-[13px] font-bold text-slate-750 uppercase tracking-wider">Primary Contact</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 flex items-start gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">SENDER ENTITY</span>
                        <h5 className="font-bold text-[13px] text-slate-800">{activeOrgObj?.contactName || "Paramnoor Singh"}</h5>
                        <p className="text-xs text-slate-500">({activeOrgObj?.contactEmail || "paramnoor15@gmail.com"})</p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 flex items-start gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                      <div className="p-2 bg-[#10b981]/10 text-[#10b981] rounded-lg shrink-0">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">EMAILS ARE SENT THROUGH</span>
                        <h5 className="font-bold text-[13px] text-slate-800">Email address of Spareflow Inventory</h5>
                        <p className="text-xs text-slate-500">(message-service@sender.spareflow-inventory.in)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-150 p-3 rounded-lg text-amber-800 text-[11.5px] leading-normal">
                    Your primary contact's email address belongs to a public domain. So, automated transactional emails will be routed through <strong>message-service@sender.spareflow-inventory.in</strong> to guarantee inbox delivery and prevent spam folders.
                  </div>
                </div>

                {/* Localized Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                      <span>Base Currency</span>
                      <button 
                        type="button" 
                        onClick={() => setCurrentSubView('currencies')}
                        className="text-[11px] font-semibold text-[#2485e8] hover:underline"
                      >
                        Manage Currencies
                      </button>
                    </label>
                    <div className="relative">
                      <select 
                        value={activeOrgObj?.baseCurrency || "INR"} 
                        onChange={(e) => updateActiveOrgField('baseCurrency', e.target.value)}
                        className="bg-white border border-slate-350 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                      >
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Primary Organization Language</label>
                    <select 
                      value={activeOrgObj?.language || "English"} 
                      onChange={(e) => updateActiveOrgField('language', e.target.value)}
                      className="bg-white border border-slate-350 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Español (Spanish)</option>
                      <option value="French">Français (French)</option>
                      <option value="German">Deutsch (German)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Time Zone</label>
                    <select 
                      value={activeOrgObj?.timezone || "(GMT 5:30) India Standard Time (Asia/Calcutta)"} 
                      onChange={(e) => updateActiveOrgField('timezone', e.target.value)}
                      className="bg-white border border-slate-350 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                    >
                      <option value="(GMT 5:30) India Standard Time (Asia/Calcutta)">(GMT 5:30) India Standard Time (Asia/Calcutta)</option>
                      <option value="(GMT 0:00) Greenwich Mean Time (UTC)">(GMT 0:00) Greenwich Mean Time (UTC)</option>
                      <option value="(GMT -5:00) Eastern Standard Time (New York)">(GMT -5:00) Eastern Standard Time (New York)</option>
                      <option value="(GMT 8:00) Singapore Standard Time (Singapore)">(GMT 8:00) Singapore Standard Time (Singapore)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date Format</label>
                      <select 
                        value={activeOrgObj?.dateFormat || "dd/MM/yyyy"} 
                        onChange={(e) => updateActiveOrgField('dateFormat', e.target.value)}
                        className="bg-white border border-slate-350 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                      >
                        <option value="dd/MM/yyyy">dd/MM/yyyy [ 25/06/2026 ]</option>
                        <option value="MM/dd/yyyy">MM/dd/yyyy [ 06/25/2026 ]</option>
                        <option value="yyyy/MM/dd">yyyy/MM/dd [ 2026/06/25 ]</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Separator</label>
                      <select 
                        value={activeOrgObj?.dateSeparator || "/"} 
                        onChange={(e) => updateActiveOrgField('dateSeparator', e.target.value)}
                        className="bg-white border border-slate-350 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer text-center font-bold"
                      >
                        <option value="/">/</option>
                        <option value="-">-</option>
                        <option value=".">.</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex gap-2 items-end">
                    <div className="w-1/3">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Corporate ID Label</label>
                      <select 
                        defaultValue="Company ID :"
                        className="bg-white border border-slate-350 rounded px-2 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                      >
                        <option value="Company ID :">Company ID :</option>
                        <option value="GSTIN :">GSTIN :</option>
                        <option value="EIN :">EIN :</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={activeOrgObj?.taxNumber || ""} 
                        onChange={(e) => updateActiveOrgField('taxNumber', e.target.value)}
                        placeholder="e.g. 07AAAAAA1234A1Z1"
                        className="bg-white border border-slate-350 rounded px-3.5 py-2 text-[13px] text-slate-800 w-full focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-3">
                    <button 
                      type="submit"
                      className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-5 py-2 rounded text-xs font-bold shadow-3xs cursor-pointer"
                    >
                      Save Configuration
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCurrentSubView('grid')}
                      className="bg-white border border-slate-200 text-slate-650 px-5 py-2 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-slate-350" /> Privacy Policy
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUBVIEW: BRANDING ACCENTS & THEMES */}
        {currentSubView === 'branding' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-3xs">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Branding Details
              </h3>
              <p className="text-xs text-slate-400 mt-1">Customize corporate colors, document headers, and portal layouts for a seamless client experience</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-3xs p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Custom Color picking */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">Accent Styling & Palette</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Corporate Primary Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={activeOrgObj?.brandingColor || "#2485e8"}
                        onChange={(e) => updateActiveOrgField('brandingColor', e.target.value)}
                        className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold uppercase">HEX VALUE</span>
                        <input 
                          type="text" 
                          value={activeOrgObj?.brandingColor || "#2485e8"}
                          onChange={(e) => updateActiveOrgField('brandingColor', e.target.value)}
                          className="text-[13px] text-slate-800 font-mono focus:outline-none w-24 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Header Banner Layout</label>
                    <select 
                      defaultValue="Solid Accent"
                      className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                    >
                      <option value="Solid Accent">Solid Accent Brand Color</option>
                      <option value="Minimal">Light Grey Minimalist (Elegant)</option>
                      <option value="Dark">Slate Dark Mode Theme</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Logo Size on PDF Invoices</label>
                    <select 
                      defaultValue="Compact"
                      className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                    >
                      <option value="Compact">Compact Size (180 × 180 pixels)</option>
                      <option value="Normal">Normal Scale (240 × 240 pixels)</option>
                      <option value="Large">Large Banner (320 × 320 pixels)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Client Portal Workspace Welcome Message</label>
                    <textarea 
                      rows={3}
                      placeholder="Welcome to our Client Portal. View orders, download invoices, or log replacements online 24/7."
                      className="bg-white border border-slate-300 rounded p-2.5 text-[13px] text-slate-800 w-full focus:outline-none"
                    />
                  </div>
                </div>

                {/* LIVE INVOICE PREVIEW BOX - HIGH CRAFT! */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-4">
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">LIVE DOCUMENT HEAD PREVIEW</span>
                      <span className="text-[9.5px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150">AESTHETIC STYLE</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 text-slate-800 space-y-4">
                      {/* Paper Top header banner matching brand accent */}
                      <div 
                        className="p-3 rounded flex items-center justify-between text-white"
                        style={{ backgroundColor: activeOrgObj?.brandingColor || "#2485e8" }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                            {activeOrgObj?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-xs">{activeOrgObj?.name || "XYZ Parts"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold uppercase block tracking-wider leading-none">INVOICE</span>
                          <span className="text-[8px] opacity-80 font-mono">#INV-2026-0001</span>
                        </div>
                      </div>

                      {/* Mock Invoice Items list */}
                      <div className="space-y-2 text-[11px]">
                        <div className="grid grid-cols-3 font-bold text-slate-400 border-b border-slate-100 pb-1 uppercase tracking-wider text-[9px]">
                          <span>Part Details</span>
                          <span className="text-center">Qty</span>
                          <span className="text-right">Total</span>
                        </div>
                        <div className="grid grid-cols-3 font-medium text-slate-600 border-b border-slate-50 py-1">
                          <span>Ford Spark Plug X4</span>
                          <span className="text-center">2</span>
                          <span className="text-right">₹3,400</span>
                        </div>
                        <div className="grid grid-cols-3 font-medium text-slate-600 border-b border-slate-50 py-1">
                          <span>Mobil Super Oil 5W30</span>
                          <span className="text-center">1</span>
                          <span className="text-right">₹4,200</span>
                        </div>
                      </div>

                      {/* Mock summary */}
                      <div className="flex justify-end pt-2">
                        <div className="w-1/2 text-[11.5px] space-y-1">
                          <div className="flex justify-between text-slate-400">
                            <span>Subtotal:</span>
                            <span>₹7,600</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-1">
                            <span>Grand Total:</span>
                            <span>₹7,600</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-400 text-center leading-relaxed mt-4">
                    Altering the primary color accent refreshes client emails, custom PDF invoice receipts, and inventory catalogs dynamically.
                  </p>
                </div>
              </div>

              {/* Action row */}
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => { alert("Branding changes successfully saved!"); setCurrentSubView('grid'); }}
                  className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-5 py-2 rounded text-xs font-bold cursor-pointer"
                >
                  Save Accent Themes
                </button>
                <button 
                  onClick={() => setCurrentSubView('grid')}
                  className="bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: LOCATIONS LIST (MULTI-LOCATIONS MANAGEMENT) */}
        {currentSubView === 'locations' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#2485e8]" /> Locations setup
                </h3>
                <p className="text-xs text-slate-400 mt-1">Manage warehouse depots, retail outlets, and distribution center nodes</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => alert("Redirecting to Transaction Series Configuration...")}
                  className="text-xs font-bold text-[#2485e8] hover:underline cursor-pointer"
                >
                  Transaction Series Preferences
                </button>
                <button 
                  onClick={() => setCurrentSubView('add_location')}
                  className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                >
                  <Plus className="w-4 h-4" /> Add Location
                </button>
              </div>
            </div>

            {/* Table layout exactly as shown in screenshot */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-3xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-450 uppercase tracking-widest font-extrabold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">NAME</th>
                      <th className="py-3 px-4">DEFAULT TRANSACTION NUMBER SERIES</th>
                      <th className="py-3 px-4">TYPE</th>
                      <th className="py-3 px-4">ADDRESS DETAILS</th>
                      <th className="py-3 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[12.5px] text-slate-700 font-semibold">
                    {locations.filter(loc => loc.orgId === activeOrgId).map((loc) => (
                      <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            {loc.name}
                            {!loc.isChild && (
                              <span className="text-amber-500 text-xs" title="Primary Business Location">⭐️</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-mono">
                          {loc.defaultTransactionSeries || "Default Transaction Series"}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold border ${loc.type === 'Business' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                            {loc.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 leading-normal">
                          {[loc.street1, loc.city, loc.state, loc.country].filter(Boolean).join(", ")}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setNewLocName(loc.name);
                                setNewLocType(loc.type);
                                setNewLocLogo(loc.logoSource);
                                setIsChildLoc(loc.isChild);
                                setNewLocAttention(loc.attention || "");
                                setNewLocStreet1(loc.street1 || "");
                                setNewLocStreet2(loc.street2 || "");
                                setNewLocCity(loc.city || "");
                                setNewLocPinCode(loc.pinCode || "");
                                setNewLocCountry(loc.country);
                                setNewLocState(loc.state);
                                setNewLocPhone(loc.phone || "");
                                setNewLocFax(loc.fax || "");
                                setNewLocWebsite(loc.website || "");
                                setNewLocPrimaryContact(loc.primaryContact);
                                setNewLocSeries(loc.transactionSeries);
                                setNewLocDefaultSeries(loc.defaultTransactionSeries);
                                setNewLocUsers(loc.selectedUsers);
                                setCurrentSubView('add_location');
                              }}
                              className="text-slate-400 hover:text-[#2485e8] cursor-pointer"
                              title="Edit location details"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                            {locations.length > 1 && (
                              <button 
                                onClick={() => handleDeleteLocation(loc.id)}
                                className="text-slate-400 hover:text-red-500 cursor-pointer"
                                title="Delete location"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {locations.filter(loc => loc.orgId === activeOrgId).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400">
                          <Globe className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                          <h4 className="font-bold text-slate-800">No operational locations registered</h4>
                          <p className="text-xs mt-1">Please register a business office or warehouse node using the Add button above.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: ADD / EDIT LOCATION (Screenshots 4 & 5) */}
        {currentSubView === 'add_location' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-3xs">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#2485e8]" /> Add Location
              </h3>
              <p className="text-xs text-slate-400 mt-1">Register a corporate address point, set up custom series numbers, and map users' access privileges</p>
            </div>

            <form onSubmit={handleSaveLocation} className="bg-white border border-slate-200 rounded-xl shadow-3xs p-6 md:p-8 space-y-8">
              
              {/* Location Type Option Cards (Screenshot 4) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Location Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Location Card */}
                  <div 
                    onClick={() => setNewLocType('Business')}
                    className={`border rounded-xl p-4 cursor-pointer flex gap-3 transition-all ${newLocType === 'Business' ? 'border-[#2485e8] bg-blue-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <input 
                      type="radio" 
                      checked={newLocType === 'Business'}
                      onChange={() => setNewLocType('Business')}
                      className="mt-1 w-4 h-4 text-[#2485e8] focus:ring-[#2485e8]"
                    />
                    <div className="space-y-1 leading-normal">
                      <h4 className="font-bold text-xs text-slate-800 uppercase">Business Location</h4>
                      <p className="text-[11px] text-slate-500">
                        A Business Location represents your organization or office's operational location. It is used to record transactions, assess regional performance, and monitor stock levels for items stored at this location.
                      </p>
                    </div>
                  </div>

                  {/* Warehouse Only Card */}
                  <div 
                    onClick={() => setNewLocType('Warehouse')}
                    className={`border rounded-xl p-4 cursor-pointer flex gap-3 transition-all ${newLocType === 'Warehouse' ? 'border-[#2485e8] bg-blue-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <input 
                      type="radio" 
                      checked={newLocType === 'Warehouse'}
                      onChange={() => setNewLocType('Warehouse')}
                      className="mt-1 w-4 h-4 text-[#2485e8] focus:ring-[#2485e8]"
                    />
                    <div className="space-y-1 leading-normal">
                      <h4 className="font-bold text-xs text-slate-800 uppercase">Warehouse Only Location</h4>
                      <p className="text-[11px] text-slate-500">
                        A Warehouse Only Location refers to where your items are stored. It helps track and monitor stock levels for items stored at this location.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo selection dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Logo</label>
                  <select 
                    value={newLocLogo}
                    onChange={(e) => setNewLocLogo(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                  >
                    <option value="same_as_org">Same as Organization Logo</option>
                    <option value="custom_logo">Upload Custom Logo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Location Name"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3.5 py-2 text-[13px] text-slate-800 w-full focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    <input 
                      type="checkbox" 
                      id="childLocChk"
                      checked={isChildLoc}
                      onChange={(e) => setIsChildLoc(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="childLocChk" className="text-xs text-slate-500 cursor-pointer">This is a Child Location</label>
                  </div>
                </div>
              </div>

              {/* Address Fields Block */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider pb-1 border-b border-slate-100">Address Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Attention</label>
                    <input 
                      type="text" 
                      value={newLocAttention}
                      onChange={(e) => setNewLocAttention(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-3.5 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Street 1</label>
                    <input 
                      type="text" 
                      value={newLocStreet1}
                      onChange={(e) => setNewLocStreet1(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-3.5 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Street 2</label>
                    <input 
                      type="text" 
                      value={newLocStreet2}
                      onChange={(e) => setNewLocStreet2(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-3.5 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">City</label>
                      <input 
                        type="text" 
                        value={newLocCity}
                        onChange={(e) => setNewLocCity(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-3.5 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pin Code</label>
                      <input 
                        type="text" 
                        value={newLocPinCode}
                        onChange={(e) => setNewLocPinCode(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-3.5 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Country</label>
                    <select 
                      value={newLocCountry}
                      onChange={(e) => setNewLocCountry(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">State/UT *</label>
                      <select 
                        value={newLocState}
                        onChange={(e) => setNewLocState(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer font-bold"
                      >
                        <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Punjab">Punjab</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone</label>
                      <input 
                        type="text" 
                        value={newLocPhone}
                        onChange={(e) => setNewLocPhone(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-3.5 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fax Number</label>
                    <input 
                      type="text" 
                      value={newLocFax}
                      onChange={(e) => setNewLocFax(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-3.5 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Website URL</label>
                    <input 
                      type="text" 
                      value={newLocWebsite}
                      onChange={(e) => setNewLocWebsite(e.target.value)}
                      placeholder="e.g. www.xyzparts.com"
                      className="bg-white border border-slate-300 rounded px-3.5 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Series Configurations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Primary Contact *</label>
                  <select 
                    value={newLocPrimaryContact}
                    onChange={(e) => setNewLocPrimaryContact(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer"
                  >
                    <option value="Paramnoor Singh <paramnoor15@gmail.com>">Paramnoor Singh &lt;paramnoor15@gmail.com&gt;</option>
                    <option value="Ramesh Singh <delhi@spares.com>">Ramesh Singh &lt;delhi@spares.com&gt;</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Transaction Number Series *</label>
                  <select 
                    value={newLocSeries}
                    onChange={(e) => setNewLocSeries(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="Default Transaction Series">Default Transaction Series</option>
                    <option value="Add Transaction Series">+ Add Transaction Series</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Default Transaction Number Series *</label>
                  <select 
                    value={newLocDefaultSeries}
                    onChange={(e) => setNewLocDefaultSeries(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-2 text-[13px] text-slate-800 w-full focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="Default Transaction Series">Default Transaction Series</option>
                    <option value="Add Transaction Series">+ Add Transaction Series</option>
                  </select>
                </div>
              </div>

              {/* User access grid (Screenshot 5) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider pb-1 border-b border-slate-100">Location Access</h4>
                
                <div className="flex items-start gap-2 text-[12.5px] text-slate-600">
                  <input 
                    type="radio" 
                    checked
                    readOnly
                    className="mt-1 w-4 h-4 text-[#2485e8]" 
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">1 user(s) selected</span>
                    <span className="text-slate-400 text-xs">Selected users can create, authorize, and access transactions associated exclusively with this location.</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-w-xl shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-450 uppercase tracking-widest font-bold text-[9px]">
                      <tr>
                        <th className="py-2 px-4">USERS</th>
                        <th className="py-2 px-4 text-right">ROLE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-[12.5px] font-semibold text-slate-700">
                      <tr>
                        <td className="py-3 px-4 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-[11px]">P</div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">Paramnoor Singh</span>
                            <span className="text-[10px] text-slate-400 font-medium block">paramnoor15@gmail.com</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-[#2485e8] font-bold">
                          Admin
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cancel and Save actions */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3.5">
                <button 
                  type="button" 
                  onClick={() => setCurrentSubView('locations')}
                  className="bg-white border border-slate-200 text-slate-650 px-5 py-2 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-5 py-2 rounded text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Save Location
                </button>
              </div>

            </form>
          </div>
        )}

        {/* SUBVIEW: AI INTEGRATION PLATFORM */}
        {currentSubView === 'ai_integration' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-3xs">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> AI Integration & Smart Automation
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure real-time Google Gemini AI features to automate labeling, anomaly sweeps, and replenishment suggestions</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-3xs p-6 md:p-8 space-y-8">
              {/* Connection Status block */}
              <div className="flex items-center justify-between p-4 bg-[#10b981]/5 border border-emerald-150 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-pulse flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wide leading-tight">Gemini Connection Active</h4>
                    <span className="text-[11.5px] text-slate-400">Secure server-side API communication using process.env.GEMINI_API_KEY</span>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded text-[11.5px] font-bold font-mono">
                  gemini-2.5-flash (Active)
                </div>
              </div>

              {/* Toggles list */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800">Available AI Core Agents</h4>
                
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {[
                    { title: "Smart Inventory Replenishment Suggester", desc: "Monitors daily order velocity and supplier lead-times to draft intelligent replenishment purchase orders instantly.", defaultChecked: true },
                    { title: "AI Parts Label & Category Normalizer", desc: "Automatically parses sparse manufacturer codes (e.g. 'FR-9801 Nissan Air Filter 2022') and translates them to clean, categorized SKU records.", defaultChecked: true },
                    { title: "Speech-to-Text Voice Stock Taking", desc: "Enables hands-free stock audit entries inside warehouses using native device mic transcription engines.", defaultChecked: false },
                    { title: "Smart Discrepancy & Duplicate Anomaly Detector", desc: "Scans high-volume sales orders and logs alerts if weird price thresholds or duplicate line items appear.", defaultChecked: true }
                  ].map((itm, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-slate-800 text-xs">{itm.title}</h5>
                        <p className="text-[11.5px] text-slate-400 leading-normal">{itm.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert(`Toggle action saved for: ${itm.title}`)}
                        className="w-10 h-5.5 rounded-full bg-indigo-600 transition-colors flex items-center p-0.5 cursor-pointer"
                      >
                        <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md transform translate-x-4.5"></span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive test bench */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-indigo-500" /> Model Test Bench Playground
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter an unformatted spare part description below. The active Gemini model will perform entity extraction and parse it into structured JSON schema parameters instantly.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. 4pc NGK Iridium Spark plug 2018 Honda Civic 1.5L turbo" 
                    className="bg-white border border-slate-300 rounded px-3.5 py-1.5 text-[12.5px] text-slate-800 flex-1 focus:outline-none"
                    id="mockPartInput"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const inp = (document.getElementById('mockPartInput') as HTMLInputElement)?.value || "";
                      alert(`Gemini analysis of: "${inp || "Sample Part"}"\n\nParsed Entities:\n- Manufacturer: NGK\n- Part Type: Spark Plug\n- Core Material: Iridium\n- Pack Size: 4\n- Compatible: Honda Civic 2018 1.5L Turbo\n- Suggested Code: NGK-IRID-CIVIC-15`);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-xs font-bold shadow-3xs cursor-pointer shrink-0"
                  >
                    Analyze SKU
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setCurrentSubView('grid')}
                  className="bg-slate-100 hover:bg-slate-250 text-slate-650 px-4 py-1.5 rounded text-xs font-bold cursor-pointer"
                >
                  Return to settings board
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: MULTI-LEVEL APPROVALS SYSTEM */}
        {currentSubView === 'approvals' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-3xs">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-500" /> Multi-Level Approvals System
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure signature handoffs and supervisor approval limits for inventory adjustments and purchases</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-3xs p-6 md:p-8 space-y-6">
              {/* Approval toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-250 rounded-xl">
                <div>
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide leading-tight">Enable Approvals Workflow</h4>
                  <span className="text-xs text-slate-400 mt-0.5">When active, drafts cannot go out without authorized signature tags</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Approvals workflow enabled globally!")}
                  className="w-10 h-5.5 rounded-full bg-emerald-500 transition-colors flex items-center p-0.5 cursor-pointer"
                >
                  <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md transform translate-x-4.5"></span>
                </button>
              </div>

              {/* Configuration triggers */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-750 uppercase tracking-widest block">Mandatory Handoff Triggers</h4>
                
                <div className="space-y-3">
                  {[
                    "Inventory Adjustments exceeding ₹10,000 in material costs",
                    "Sales Orders with manual discount lines exceeding 15%",
                    "Purchase Orders above normal warehouse thresholds"
                  ].map((trigger, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs text-slate-600">
                      <input 
                        type="checkbox" 
                        defaultChecked={idx === 0}
                        id={`trigChk_${idx}`}
                        className="mt-0.5 w-4 h-4 text-emerald-500 rounded border-slate-350 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor={`trigChk_${idx}`} className="leading-normal cursor-pointer text-slate-700 font-semibold">{trigger}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Designated Approvers directory */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-750 uppercase tracking-widest block">Designated Approvers Directory</h4>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-450 uppercase tracking-widest font-bold text-[9px]">
                      <tr>
                        <th className="py-2 px-4">APPROVER NAME</th>
                        <th className="py-2 px-4">ROLE</th>
                        <th className="py-2 px-4 text-right">SEQUENCE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-[12.5px] font-semibold text-slate-700">
                      <tr>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">P</div>
                          <span>Paramnoor Singh (paramnoor15@gmail.com)</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">Admin (Primary Sign-off)</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-extrabold">Level 1</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-[10px]">R</div>
                          <span>Ramesh Singh (ramesh@metrospares.com)</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">Manager</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-extrabold">Level 2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action row */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => { alert("Approvals configuration successfully updated!"); setCurrentSubView('grid'); }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-1.5 rounded text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Save Approvals Scheme
                </button>
                <button 
                  onClick={() => setCurrentSubView('grid')}
                  className="bg-white border border-slate-200 text-slate-650 px-5 py-1.5 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: ORGANIZATIONS (MULTI-SHOPS ENTERING & SWITCHING) */}
        {currentSubView === 'organization' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">Shops & Organizations Directory</h3>
                <p className="text-xs text-slate-400 mt-0.5">Define multi-shops and activate any store node dynamically</p>
              </div>
              <button 
                onClick={() => setShowOrgModal(true)}
                className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Shop
              </button>
            </div>

            {/* List of current shops */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations.map((org) => {
                const isActive = org.id === activeOrgId;
                return (
                  <div 
                    key={org.id}
                    onClick={() => syncActiveOrg(org.id)}
                    className={`border-2 rounded-xl p-4 bg-white shadow-3xs cursor-pointer transition-all relative ${isActive ? 'border-[#2485e8]' : 'border-slate-200 hover:border-slate-350'}`}
                  >
                    {isActive && (
                      <span className="absolute top-3 right-3 bg-blue-50 text-[#2485e8] border border-blue-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active Store Node
                      </span>
                    )}

                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: org.brandingColor }}></div>
                      <h4 className="font-extrabold text-slate-800 text-[14.5px]">{org.name}</h4>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-500">
                      <p>📍 Location: <strong className="text-slate-700">{org.location}</strong></p>
                      <p>✉ Contact Email: <strong className="text-slate-700">{org.contactEmail}</strong></p>
                      <p>📋 Tax Identification: <strong className="text-slate-700 font-mono">{org.taxNumber}</strong></p>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">ID: {org.id}</span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); syncActiveOrg(org.id); }}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-650 hover:bg-slate-200'}`}
                        >
                          {isActive ? 'Current Active' : 'Switch To Shop'}
                        </button>
                        <button 
                          onClick={(e) => handleDeleteOrg(org.id, e)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded"
                          title="Remove organization"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBVIEW: USERS (ENTER USERS, ASSOCIATE TO SHOPS, ASSIGN ROLES) */}
        {currentSubView === 'users' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">User Access Management</h3>
                <p className="text-xs text-slate-400 mt-0.5">Associate staff members to specific shops and assign role profiles</p>
              </div>
              <button 
                onClick={() => setShowUserModal(true)}
                className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Plus className="w-3.5 h-3.5" /> Invite User
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
              <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wide text-[10.5px]">
                  <tr>
                    <th className="py-3 px-5">Staff Member</th>
                    <th className="py-3 px-5">Email Address</th>
                    <th className="py-3 px-5">Assigned Shop</th>
                    <th className="py-3 px-5">Access Level (Role)</th>
                    <th className="py-3 px-5 text-center">Simulate Session</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {users.map((usr) => {
                    const associatedOrg = organizations.find(o => o.id === usr.orgId);
                    const userRole = roles.find(r => r.id === usr.roleId);
                    const isSelf = usr.id === activeUserId;
                    return (
                      <tr key={usr.id} className={isSelf ? "bg-blue-50/30" : ""}>
                        <td className="py-3 px-5 font-bold text-slate-800 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-[12px]">
                            {usr.name.charAt(0).toUpperCase()}
                          </div>
                          {usr.name}
                          {isSelf && (
                            <span className="bg-[#2485e8] text-white text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-slate-550 font-mono">{usr.email}</td>
                        <td className="py-3 px-5">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11.5px] font-bold">
                            {associatedOrg?.name || "Global / Main"}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-0.5 rounded text-[11.5px] font-bold">
                            {userRole?.name || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <button
                            onClick={() => syncActiveUser(usr.id)}
                            className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                              isSelf 
                                ? 'bg-[#2485e8] text-white border border-[#2485e8]' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {isSelf ? "Active User Session" : "Switch to this User"}
                          </button>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button 
                            disabled={isSelf}
                            onClick={(e) => handleDeleteUser(usr.id, e)}
                            className="text-slate-400 hover:text-red-500 disabled:opacity-40 p-1 rounded hover:bg-slate-50"
                            title="Remove User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBVIEW: ROLES & RBAC MATRIX (SWITCH & PLAYGROUND WITH PERMISSIONS MATRIX) */}
        {currentSubView === 'roles' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-indigo-550 to-purple-650 text-white p-6 rounded-xl shadow-md">
              <h3 className="text-[17px] font-extrabold">Active Role-Based Access Control (RBAC) Switcher Playground</h3>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Configure module-level access and test restriction limits. When a staff member role has 'view' permissions on a module, they cannot perform creates or edits. Changing the active role will instantly adapt the sidebar capabilities and operational rules!
              </p>
              
              {/* Quick direct switcher */}
              <div className="mt-5 flex flex-wrap items-center gap-3.5 pt-4 border-t border-white/20">
                <span className="text-xs font-bold uppercase tracking-wider text-white/95">Switch Role to Test Restrictions:</span>
                <div className="flex gap-2">
                  {roles.map(r => {
                    const isSelected = activeRoleObj?.id === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleDirectRoleSwitch(r.id)}
                        className={`px-3.5 py-1.5 rounded font-extrabold text-[12px] transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white text-indigo-700 shadow-sm border-2 border-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                        }`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Access Matrix Table */}
            <div className="space-y-4">
              <h4 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" /> Granular Access Rights Matrix
              </h4>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10.5px]">
                    <tr>
                      <th className="py-3.5 px-5 w-1/4">Role Title / Description</th>
                      <th className="py-3.5 px-5 text-center">Items & Variants</th>
                      <th className="py-3.5 px-5 text-center">Inventory & Stock</th>
                      <th className="py-3.5 px-5 text-center">Sales & Outbounds</th>
                      <th className="py-3.5 px-5 text-center">Purchases & Inbounds</th>
                      <th className="py-3.5 px-5 text-center">Settings & Org configs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {roles.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/30">
                        <td className="py-4 px-5">
                          <strong className="text-slate-800 text-[13.5px] block">{r.name}</strong>
                          <span className="text-[11.5px] text-slate-400 font-normal leading-normal">{r.desc}</span>
                        </td>

                        {/* Items Module */}
                        <td className="py-4 px-5 text-center">
                          <select
                            value={r.permissions.items}
                            onChange={(e) => handleTogglePermission(r.id, 'items', e.target.value as any)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700"
                          >
                            <option value="none">🚫 Blocked</option>
                            <option value="view">👁 Read Only</option>
                            <option value="edit">✍ Write/Edit</option>
                            <option value="all">⚡ Full Admin</option>
                          </select>
                        </td>

                        {/* Inventory Module */}
                        <td className="py-4 px-5 text-center">
                          <select
                            value={r.permissions.inventory}
                            onChange={(e) => handleTogglePermission(r.id, 'inventory', e.target.value as any)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700"
                          >
                            <option value="none">🚫 Blocked</option>
                            <option value="view">👁 Read Only</option>
                            <option value="edit">✍ Write/Edit</option>
                            <option value="all">⚡ Full Admin</option>
                          </select>
                        </td>

                        {/* Sales Module */}
                        <td className="py-4 px-5 text-center">
                          <select
                            value={r.permissions.sales}
                            onChange={(e) => handleTogglePermission(r.id, 'sales', e.target.value as any)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700"
                          >
                            <option value="none">🚫 Blocked</option>
                            <option value="view">👁 Read Only</option>
                            <option value="edit">✍ Write/Edit</option>
                            <option value="all">⚡ Full Admin</option>
                          </select>
                        </td>

                        {/* Purchases Module */}
                        <td className="py-4 px-5 text-center">
                          <select
                            value={r.permissions.purchases}
                            onChange={(e) => handleTogglePermission(r.id, 'purchases', e.target.value as any)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700"
                          >
                            <option value="none">🚫 Blocked</option>
                            <option value="view">👁 Read Only</option>
                            <option value="edit">✍ Write/Edit</option>
                            <option value="all">⚡ Full Admin</option>
                          </select>
                        </td>

                        {/* Settings Module */}
                        <td className="py-4 px-5 text-center">
                          <select
                            value={r.permissions.settings}
                            onChange={(e) => handleTogglePermission(r.id, 'settings', e.target.value as any)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700"
                          >
                            <option value="none">🚫 Blocked</option>
                            <option value="view">👁 Read Only</option>
                            <option value="all">⚡ Full Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: SETUP GENERAL */}
        {currentSubView === 'general' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-3xs space-y-5">
            <h3 className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-2.5">General Store Configurations</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Company Display Name</label>
                <input 
                  type="text"
                  value={generalConfig.companyName}
                  onChange={(e) => {
                    const u = { ...generalConfig, companyName: e.target.value };
                    setGeneralConfig(u);
                    localStorage.setItem('spareflow_settings_general', JSON.stringify(u));
                  }}
                  className="bg-white border border-slate-300 rounded px-3 py-2 text-[13.5px] text-slate-800 w-full focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Official Contact Email</label>
                <input 
                  type="email"
                  value={generalConfig.contactEmail}
                  onChange={(e) => {
                    const u = { ...generalConfig, contactEmail: e.target.value };
                    setGeneralConfig(u);
                    localStorage.setItem('spareflow_settings_general', JSON.stringify(u));
                  }}
                  className="bg-white border border-slate-300 rounded px-3 py-2 text-[13.5px] text-slate-800 w-full focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Support Phone Line</label>
                <input 
                  type="text"
                  value={generalConfig.contactPhone}
                  onChange={(e) => {
                    const u = { ...generalConfig, contactPhone: e.target.value };
                    setGeneralConfig(u);
                    localStorage.setItem('spareflow_settings_general', JSON.stringify(u));
                  }}
                  className="bg-white border border-slate-300 rounded px-3 py-2 text-[13.5px] text-slate-800 w-full focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Business Timezone</label>
                <select 
                  value={generalConfig.timezone}
                  onChange={(e) => {
                    const u = { ...generalConfig, timezone: e.target.value };
                    setGeneralConfig(u);
                    localStorage.setItem('spareflow_settings_general', JSON.stringify(u));
                  }}
                  className="bg-white border border-slate-300 rounded px-3 py-2 text-[13.5px] text-slate-800 w-full cursor-pointer focus:outline-none"
                >
                  <option value="IST (India Standard Time)">IST (India Standard Time) - GMT+5:30</option>
                  <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time) - GMT+0</option>
                  <option value="EST (Eastern Standard Time)">EST (Eastern Standard Time) - GMT-5</option>
                  <option value="PST (Pacific Standard Time)">PST (Pacific Standard Time) - GMT-8</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => { alert("General configurations saved and applied across the active shop."); setCurrentSubView('grid'); }}
                className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-5 py-2 rounded text-xs font-bold"
              >
                Save General Settings
              </button>
            </div>
          </div>
        )}

        {/* SUBVIEW: CURRENCIES SETUP */}
        {currentSubView === 'currencies' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-3xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[15px] font-bold text-slate-800">Available Currencies</h3>
              <button 
                onClick={() => setShowCurrencyModal(true)}
                className="text-xs font-bold text-blue-500 hover:underline"
              >
                + Add Currency
              </button>
            </div>

            <div className="space-y-3">
              {currencies.map((c) => (
                <div key={c.code} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2485e8] font-mono font-extrabold flex items-center justify-center text-lg">
                      {c.symbol}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-[13.5px]">{c.name} ({c.code})</h4>
                      <p className="text-[11px] text-slate-400">Currency symbol key: "{c.symbol}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.isDefault ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded">
                        Base Currency
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefaultCurrency(c.code)}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer"
                      >
                        Set as Base
                      </button>
                    )}
                    
                    {!c.isDefault && (
                      <button
                        onClick={() => handleDeleteCurrency(c.code)}
                        className="text-slate-400 hover:text-red-500 p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW: PAYMENT TERMS */}
        {currentSubView === 'payment_terms' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-3xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[15px] font-bold text-slate-800">Credit & Payment Terms</h3>
              <button 
                onClick={() => setShowTermModal(true)}
                className="text-xs font-bold text-blue-500 hover:underline"
              >
                + Add Payment Term
              </button>
            </div>

            <div className="space-y-3">
              {paymentTerms.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-800 text-[13px]">{t.name}</h4>
                    <p className="text-[11px] text-slate-400">Invoices due {t.days} days after issuance.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px] px-2 py-0.5 rounded font-mono">
                      {t.days} Days
                    </span>
                    <button 
                      onClick={() => handleDeleteTerm(t.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>

      {/* MODAL: ADD ORGANIZATION */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md p-6 relative"
          >
            <button onClick={() => setShowOrgModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-[15.5px] font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-500" /> Enter New Shop / Branch
            </h3>

            <form onSubmit={handleCreateOrg} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Shop / Org Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Metro Auto Spares"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Physical Location Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Connaught Place, New Delhi"
                  value={newOrgLocation}
                  onChange={(e) => setNewOrgLocation(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Contact Email</label>
                  <input 
                    type="email" 
                    placeholder="delhi@spares.com"
                    value={newOrgEmail}
                    onChange={(e) => setNewOrgEmail(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">GSTIN / Tax Number</label>
                  <input 
                    type="text" 
                    placeholder="07AAAAAA1234A1Z1"
                    value={newOrgTax}
                    onChange={(e) => setNewOrgTax(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Accent Branding Color</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={newOrgColor}
                    onChange={(e) => setNewOrgColor(e.target.value)}
                    className="w-10 h-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono">{newOrgColor}</span>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-100 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowOrgModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Save Store
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: ADD USER / STAFF MEMBER */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md p-6 relative"
          >
            <button onClick={() => setShowUserModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-[15.5px] font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-rose-500" /> Invite Staff Member
            </h3>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ramesh Singh"
                  value={newUserRef.name}
                  onChange={(e) => setNewUserRef({ ...newUserRef, name: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Staff Email Address *</label>
                <input 
                  type="email" 
                  required
                  placeholder="ramesh@spares.com"
                  value={newUserRef.email}
                  onChange={(e) => setNewUserRef({ ...newUserRef, email: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Shop Node *</label>
                  <select 
                    value={newUserRef.orgId}
                    onChange={(e) => setNewUserRef({ ...newUserRef, orgId: e.target.value })}
                    className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[13px] text-slate-800 w-full cursor-pointer focus:outline-none"
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Access Level (Role) *</label>
                  <select 
                    value={newUserRef.roleId}
                    onChange={(e) => setNewUserRef({ ...newUserRef, roleId: e.target.value })}
                    className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[13px] text-slate-800 w-full cursor-pointer focus:outline-none font-semibold text-slate-700"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-100 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowUserModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Invite Staff
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: ADD CURRENCY */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-sm p-6 relative"
          >
            <button onClick={() => setShowCurrencyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-[14.5px] font-bold text-slate-800 border-b border-slate-100 pb-2">Add Currency Unit</h3>
            <form onSubmit={handleCreateCurrency} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Currency Code (ISO) *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. USD, EUR, GBP"
                  maxLength={3}
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Display Symbol *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. $, £, €"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Currency Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. US Dollar"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none"
                />
              </div>
              <div className="pt-3.5 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowCurrencyModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#2485e8] text-white px-4 py-1.5 rounded text-xs font-bold shadow-3xs"
                >
                  Add
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: ADD PAYMENT TERM */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-sm p-6 relative"
          >
            <button onClick={() => setShowTermModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-[14.5px] font-bold text-slate-800 border-b border-slate-100 pb-2">Add Payment Term</h3>
            <form onSubmit={handleCreateTerm} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Term Label *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Net 30, Net 60, Due on Receipt"
                  value={newTerm.name}
                  onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Due Grace Period (Days) *</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={newTerm.days}
                  onChange={(e) => setNewTerm({ ...newTerm, days: Number(e.target.value) })}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 w-full focus:outline-none font-mono"
                />
              </div>
              <div className="pt-3.5 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowTermModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#2485e8] text-white px-4 py-1.5 rounded text-xs font-bold shadow-3xs"
                >
                  Save Term
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
