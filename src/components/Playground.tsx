import React, { useState, useEffect } from "react";
import { 
  User, Tenant, Branch, AuthSession, LogEntry 
} from "../types.js";
import { 
  Building2, UserPlus, KeyRound, Network, Plus, Trash2, 
  RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle, Eye, EyeOff,
  MapPin, Terminal
} from "lucide-react";

export function Playground() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__spareflow_session = session;
      window.dispatchEvent(new CustomEvent("spareflow_session_update"));
    }
  }, [session]);
  
  // Registration Form
  const [regBusName, setRegBusName] = useState("XYZ Auto Spares Ltd");
  const [regBusType, setRegBusType] = useState("Parts Distributor");
  const [regPlan, setRegPlan] = useState("growth");
  const [regOwnerName, setRegOwnerName] = useState("Arjun Kumar");
  const [regOwnerEmail, setRegOwnerEmail] = useState("arjun@xyzauto.com");
  const [regOwnerPhone, setRegOwnerPhone] = useState("+91 98765 43210");
  const [regOwnerPassword, setRegOwnerPassword] = useState("Spareflow@2026");

  // Login Form
  const [loginEmail, setLoginEmail] = useState("arjun@xyzauto.com");
  const [loginPassword, setLoginPassword] = useState("Spareflow@2026");

  // Branch Form
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchLocation, setNewBranchLocation] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [newBranchEmail, setNewBranchEmail] = useState("");

  // User Form
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("Staff@1234");
  const [newUserRole, setNewUserRole] = useState<"Owner" | "Manager" | "Staff">("Staff");
  const [newUserBranchId, setNewUserBranchId] = useState("");

  // Password Change
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Dynamic lists from API
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Console log stream
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Tabs
  const [playgroundTab, setPlaygroundTab] = useState<"auth" | "branches" | "users" | "security">("auth");
  const [showPassword, setShowPassword] = useState(false);

  // Helper to log console output
  const addLog = (method: LogEntry["method"], url: string, status: number, reqBody?: any, resBody?: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      method,
      url,
      status,
      requestBody: reqBody,
      responseBody: resBody,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 50));
  };

  // Helper fetcher
  const apiFetch = async (url: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: any) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await res.text();
      let resData;
      try {
        resData = text ? JSON.parse(text) : {};
      } catch (e) {
        resData = { text };
      }

      addLog(method, url, res.status, body, resData);

      if (!res.ok) {
        throw new Error(resData.error || `HTTP ${res.status} failed.`);
      }

      return resData;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Reload lists
  const refreshBranches = async () => {
    if (!session) return;
    try {
      const data = await apiFetch("/api/branches", "GET");
      setBranches(data);
    } catch (e: any) {
      // Log failure in panel, don't crash
    }
  };

  const refreshUsers = async () => {
    if (!session) return;
    try {
      const data = await apiFetch("/api/users", "GET");
      setUsers(data);
    } catch (e: any) {
      // Log failure in panel, don't crash
    }
  };

  useEffect(() => {
    if (session) {
      refreshBranches();
      refreshUsers();
    } else {
      setBranches([]);
      setUsers([]);
    }
  }, [session]);

  // Auth Operations
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiFetch("/api/auth/register", "POST", {
        business_name: regBusName,
        business_type: regBusType,
        plan: regPlan,
        owner_name: regOwnerName,
        owner_email: regOwnerEmail,
        owner_phone: regOwnerPhone,
        owner_password: regOwnerPassword,
      });

      const newSession: AuthSession = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
        tenant: data.tenant,
      };
      setSession(newSession);
      // Auto fill login credentials next time
      setLoginEmail(regOwnerEmail);
      setLoginPassword(regOwnerPassword);
    } catch (err: any) {
      alert(`Registration Failed: ${err.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiFetch("/api/auth/login", "POST", {
        email: loginEmail,
        password: loginPassword,
      });

      const newSession: AuthSession = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
        tenant: data.tenant,
      };
      setSession(newSession);
    } catch (err: any) {
      alert(`Authentication Failed: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", "POST");
    } catch (e) {}
    setSession(null);
  };

  const handleRefreshToken = async () => {
    if (!session) return;
    try {
      const data = await apiFetch("/api/auth/refresh", "POST", {
        refresh_token: session.refreshToken,
      });
      setSession({
        ...session,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || session.refreshToken,
      });
    } catch (err: any) {
      alert(`Token Refresh Failed: ${err.message}`);
      setSession(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/auth/change-password", "POST", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      alert("Password changed successfully! You can login next time with the new password.");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      alert(`Password Change Failed: ${err.message}`);
    }
  };

  // Branch Operations
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/branches", "POST", {
        branch_name: newBranchName,
        location: newBranchLocation,
        phone: newBranchPhone,
        email: newBranchEmail,
      });
      setNewBranchName("");
      setNewBranchLocation("");
      setNewBranchPhone("");
      setNewBranchEmail("");
      refreshBranches();
    } catch (err: any) {
      alert(`Create Branch Denied: ${err.message}`);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this branch? Users assigned will lose link.")) return;
    try {
      await apiFetch(`/api/branches/${id}`, "DELETE");
      refreshBranches();
    } catch (err: any) {
      alert(`Delete Branch Denied: ${err.message}`);
    }
  };

  // User Operations
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        full_name: newUserFullName,
        email: newUserEmail,
        phone: newUserPhone,
        password: newUserPassword,
        role: newUserRole,
      };

      if (newUserRole !== "Owner") {
        payload.branch_id = newUserBranchId;
      }

      await apiFetch("/api/users", "POST", payload);
      setNewUserFullName("");
      setNewUserEmail("");
      setNewUserPhone("");
      setNewUserPassword("Staff@1234");
      refreshUsers();
    } catch (err: any) {
      alert(`Create User Denied: ${err.message}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiFetch(`/api/users/${id}`, "DELETE");
      refreshUsers();
    } catch (err: any) {
      alert(`Delete User Denied: ${err.message}`);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await apiFetch(`/api/users/${user.user_id}`, "PATCH", {
        is_active: !user.is_active,
      });
      refreshUsers();
    } catch (err: any) {
      alert(`Modify active state failed: ${err.message}`);
    }
  };

  // JWT Helper decoder claims
  const decodeTokenClaims = (token: string) => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload;
    } catch (e) {
      return null;
    }
  };

  const tokenClaims = session ? decodeTokenClaims(session.accessToken) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Configuration & Action Workspace */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Workspace headers */}
        <div className="border-b border-slate-200 bg-slate-50 p-4 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="font-sans font-semibold text-slate-800 flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-600" />
              Interactive Multi-Tenant Operations Center
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate actions to test isolated data scopes, credential tokens, and role-based block gates.
            </p>
          </div>
          
          {session ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-150">
                Connected
              </span>
              <button 
                onClick={handleLogout}
                className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
              <AlertTriangle className="w-3.5 h-3.5" /> Demo Sandbox Disconnected
            </span>
          )}
        </div>

        {/* Workspace tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 p-1">
          <button
            onClick={() => setPlaygroundTab("auth")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              playgroundTab === "auth"
                ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Auth &amp; Business Reg
          </button>
          <button
            onClick={() => setPlaygroundTab("branches")}
            disabled={!session}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !session ? "opacity-40 cursor-not-allowed" : ""
            } ${
              playgroundTab === "branches"
                ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Branches Management
          </button>
          <button
            onClick={() => setPlaygroundTab("users")}
            disabled={!session}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !session ? "opacity-40 cursor-not-allowed" : ""
            } ${
              playgroundTab === "users"
                ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Users Administration
          </button>
          <button
            onClick={() => setPlaygroundTab("security")}
            disabled={!session}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !session ? "opacity-40 cursor-not-allowed" : ""
            } ${
              playgroundTab === "security"
                ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Change Credentials
          </button>
        </div>

        {/* Tab Workspace Contents */}
        <div className="p-6 flex-1 max-h-[500px] overflow-y-auto">
          
          {/* TAB 1: AUTH & REGISTRATION */}
          {playgroundTab === "auth" && (
            <div className="space-y-6">
              {!session ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Registration */}
                  <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-semibold text-xs text-slate-800 uppercase flex items-center gap-1.5 tracking-wider">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      1. Register Business Tenant
                    </h3>
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Spares Business Name</label>
                        <input 
                          type="text" 
                          value={regBusName} 
                          onChange={(e) => setRegBusName(e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Business Operational Segment</label>
                        <input 
                          type="text" 
                          value={regBusType} 
                          onChange={(e) => setRegBusType(e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Subscription Plan</label>
                          <select 
                            value={regPlan} 
                            onChange={(e) => setRegPlan(e.target.value)}
                            className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          >
                            <option value="growth">Growth (Standard)</option>
                            <option value="enterprise">Enterprise (SaaS)</option>
                            <option value="free">Free Tier</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Owner Phone</label>
                          <input 
                            type="text" 
                            value={regOwnerPhone} 
                            onChange={(e) => setRegOwnerPhone(e.target.value)}
                            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                            required
                          />
                        </div>
                      </div>

                      <div className="h-px bg-slate-100 my-2"></div>

                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner User Account Info</h4>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Owner Full Name</label>
                        <input 
                          type="text" 
                          value={regOwnerName} 
                          onChange={(e) => setRegOwnerName(e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Owner Email (Unique Login)</label>
                        <input 
                          type="email" 
                          value={regOwnerEmail} 
                          onChange={(e) => setRegOwnerEmail(e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Owner Password</label>
                        <input 
                          type="password" 
                          value={regOwnerPassword} 
                          onChange={(e) => setRegOwnerPassword(e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg text-xs mt-2 transition-colors cursor-pointer"
                      >
                        Register Business Tenant
                      </button>
                    </form>
                  </div>

                  {/* Standard Sign In */}
                  <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-semibold text-xs text-slate-800 uppercase flex items-center gap-1.5 tracking-wider">
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      2. Validate &amp; Login Member
                    </h3>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Account Email Address</label>
                        <input 
                          type="email" 
                          value={loginEmail} 
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Password</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={loginPassword} 
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full mt-1 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-[50%] -translate-y-[50%] p-1 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-xs mt-2 transition-colors cursor-pointer"
                      >
                        Sign In Securely
                      </button>
                    </form>

                    <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-1">
                      <span className="text-[10px] font-semibold text-indigo-900 uppercase">Developer Fast Logins</span>
                      <p className="text-[11px] text-indigo-700">
                        Register a business above first. Once set, you can create Managers/Staff and use this box to switch between roles instantly to check authorization.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-slate-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-slate-800 text-sm">Successfully Logged In!</span>
                    </div>
                    <p className="text-xs">
                      You are authenticated on business tenant <strong>{session.tenant.business_name}</strong> as <strong>{session.user.full_name}</strong> (Role: <span className="font-bold underline text-indigo-600">{session.user.role}</span>).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tenant Details</span>
                      <div className="text-xs space-y-1.5">
                        <div><strong className="text-slate-500">Tenant UUID:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-150">{session.tenant.tenant_id}</code></div>
                        <div><strong className="text-slate-500">Business Segment:</strong> {session.tenant.business_type}</div>
                        <div><strong className="text-slate-500">Billing Plan:</strong> <span className="uppercase font-bold text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150">{session.tenant.plan}</span></div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">User Identity claims</span>
                      <div className="text-xs space-y-1.5">
                        <div><strong className="text-slate-500">User UUID:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-150">{session.user.user_id}</code></div>
                        <div><strong className="text-slate-500">Registered Email:</strong> {session.user.email}</div>
                        <div><strong className="text-slate-500">Assigned Branch:</strong> {session.user.branch_id ? <code className="bg-white px-1.5 py-0.5 rounded border border-slate-150">{session.user.branch_id}</code> : "Global (All Branches)"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={handleRefreshToken}
                      className="flex-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh Access Token
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg text-xs transition-colors"
                    >
                      Logout Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BRANCH ADMINISTRATION */}
          {playgroundTab === "branches" && session && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Create Branch Form */}
                <div className="md:col-span-1 border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 height-fit">
                  <h3 className="font-semibold text-xs text-slate-800 uppercase flex items-center gap-1 tracking-wider">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    New Branch Setup
                  </h3>
                  
                  {session.user.role !== "Owner" && (
                    <div className="p-2.5 bg-red-50 border border-red-100 text-[10px] text-red-700 rounded-lg flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Only <strong>Owners</strong> are permitted to configure branches. You are logged as <strong>{session.user.role}</strong>. Creating a branch will fail with HTTP 403.</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateBranch} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Branch Name</label>
                      <input 
                        type="text" 
                        value={newBranchName} 
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="e.g. South Delhi Workshop"
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Location Address</label>
                      <input 
                        type="text" 
                        value={newBranchLocation} 
                        onChange={(e) => setNewBranchLocation(e.target.value)}
                        placeholder="e.g. Plot No 12, Kalkaji Industrial Area"
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Contact Phone</label>
                      <input 
                        type="text" 
                        value={newBranchPhone} 
                        onChange={(e) => setNewBranchPhone(e.target.value)}
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Branch Email</label>
                      <input 
                        type="email" 
                        value={newBranchEmail} 
                        onChange={(e) => setNewBranchEmail(e.target.value)}
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Create Branch
                    </button>
                  </form>
                </div>

                {/* Branches List */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                      Configured Company Branches ({branches.length})
                    </h3>
                    <button 
                      onClick={refreshBranches}
                      className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reload
                    </button>
                  </div>

                  {branches.length === 0 ? (
                    <div className="border border-dashed border-slate-200 font-sans p-6 rounded-xl text-center text-slate-500 space-y-1">
                      <p className="text-xs font-semibold">No branches matching isolation found.</p>
                      <p className="text-[11px] text-slate-400">If you are an Owner, use the left side panel to register backends branches.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {branches.map((b) => (
                        <div key={b.branch_id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white hover:shadow-xs transition-all">
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-slate-800">{b.branch_name}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" /> {b.location}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 pt-1">
                              {b.phone && <span>📞 {b.phone}</span>}
                              {b.email && <span>✉️ {b.email}</span>}
                              <span>🔑 ID: <code className="bg-slate-50 border border-slate-150 px-1 py-0.5 rounded">{b.branch_id}</code></span>
                            </div>
                          </div>
                          
                          {session.user.role === "Owner" && (
                            <button 
                              onClick={() => handleDeleteBranch(b.branch_id)}
                              className="p-1 px-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[10px] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delet
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {playgroundTab === "users" && session && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Create Member Form */}
                <div className="md:col-span-1 border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <h3 className="font-semibold text-xs text-slate-800 uppercase flex items-center gap-1 tracking-wider">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    New Member Onboarding
                  </h3>
                  
                  {session.user.role === "Staff" && (
                    <div className="p-2.5 bg-red-50 border border-red-100 text-[10px] text-red-700 rounded-lg flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Access Denied:</strong> Staff users are blocked from creating profiles. Sign in as Owner or Manager.</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateUser} className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                      <input 
                        type="text" 
                        value={newUserFullName} 
                        onChange={(e) => setNewUserFullName(e.target.value)}
                        placeholder="e.g. Arjun Dev"
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Login Email Address</label>
                      <input 
                        type="email" 
                        value={newUserEmail} 
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="e.g. user@xyzauto.com"
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Temp Password</label>
                      <input 
                        type="password" 
                        value={newUserPassword} 
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">System Role</label>
                        <select 
                          value={newUserRole} 
                          onChange={(e: any) => setNewUserRole(e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        >
                          <option value="Staff">Staff (Read Limited)</option>
                          <option value="Manager">Manager (Branch Access)</option>
                          {session.user.role === "Owner" && <option value="Owner">Owner (Global System Admin)</option>}
                        </select>
                      </div>
                      
                      {newUserRole !== "Owner" && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Assigned Branch Location</label>
                          <select 
                            value={newUserBranchId} 
                            onChange={(e) => setNewUserBranchId(e.target.value)}
                            className="w-full mt-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                            required
                          >
                            <option value="">-- Choose Branch --</option>
                            {branches.map((b) => (
                              <option key={b.branch_id} value={b.branch_id}>
                                {b.branch_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-xs mt-1 transition-colors cursor-pointer"
                    >
                      Onboard Member
                    </button>
                  </form>
                </div>

                {/* Users List */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                      Business Staff Directory ({users.length})
                    </h3>
                    <button 
                      onClick={refreshUsers}
                      className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reload
                    </button>
                  </div>

                  {users.length === 0 ? (
                    <div className="border border-dashed border-slate-200 font-sans p-6 rounded-xl text-center text-slate-500 space-y-1">
                      <p className="text-xs font-semibold">No users matching scope found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {users.map((u) => {
                        const assignedBranchName = branches.find((b) => b.branch_id === u.branch_id)?.branch_name || "Enterprise-Wide Access";
                        return (
                          <div key={u.user_id} className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center bg-white hover:shadow-xs transition-all gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-800">{u.full_name}</span>
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                                  u.role === "Owner" 
                                    ? "bg-purple-100 text-purple-700 border-purple-200"
                                    : u.role === "Manager"
                                    ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}>
                                  {u.role}
                                </span>
                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                  u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                }`}>
                                  {u.is_active ? "Active" : "Disabled"}
                                </span>
                              </div>
                              
                              <p className="text-[11px] text-slate-500">
                                📩 {u.email} | {u.phone || "No phone"}
                              </p>
                              
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-300" />
                                Branch Link: <span className="font-semibold text-slate-600">{assignedBranchName}</span>
                              </p>
                              
                              {u.last_login && (
                                <p className="text-[10px] text-slate-400">
                                  Last Login: <code className="bg-slate-50 border border-slate-150 px-1 rounded">{new Date(u.last_login).toLocaleTimeString()}</code>
                                </p>
                              )}
                            </div>

                            <div className="flex gap-1.5 self-end sm:self-center">
                              <button 
                                onClick={() => toggleUserStatus(u)}
                                className={`p-1 px-2 rounded-lg border text-[10px] font-medium transition-colors cursor-pointer ${
                                  u.is_active 
                                    ? "border-amber-200 text-amber-700 hover:bg-amber-50" 
                                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                }`}
                              >
                                {u.is_active ? "Deactivate" : "Activate"}
                              </button>
                              
                              {session.user.user_id !== u.user_id && (
                                <button 
                                  onClick={() => handleDeleteUser(u.user_id)}
                                  className="p-1 px-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[10px] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: CHANGE PASSWORD */}
          {playgroundTab === "security" && session && (
            <div className="max-w-md mx-auto border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-xs text-slate-800 uppercase flex items-center gap-1.5 tracking-wider border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Change Password Service
              </h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Current Password</label>
                  <input 
                    type="password" 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">New Secure Password</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Verify old &amp; Set New Password
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Real-time Streaming Developer JWT & API Console */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Active Token Claims inspector */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden text-slate-300">
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-sans font-semibold text-sm text-slate-100 uppercase tracking-wide">JWT Payload Auditor</h3>
              <p className="text-[10px] text-slate-500">Decoded JSON claims showing backend context scope injection.</p>
            </div>
          </div>
          <div className="p-4 font-mono text-[11px] space-y-3">
            {session ? (
              <div className="space-y-3">
                <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 overflow-x-auto whitespace-pre-wrap word-break-all text-amber-300">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold select-none mb-1">Authorization Bearer Token (Raw String)</span>
                  {session.accessToken}
                </div>
                {tokenClaims && (
                  <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold select-none mb-1">Parsed Claims</span>
                    <pre className="text-emerald-400 text-[10px]">{JSON.stringify(tokenClaims, null, 2)}</pre>
                  </div>
                )}
                <div className="p-2.5 rounded bg-indigo-950/40 border border-indigo-900 text-[10px] text-indigo-300 leading-relaxed font-sans">
                  🛡️ This token is generated using HMAC-SHA256 and verified dynamically upon request intercept by express auth filters.
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-center py-6 select-none animate-pulse">
                Connect and log in to inspect JWT Access Token Payloads.
              </div>
            )}
          </div>
        </div>

        {/* Streaming HTTP REST Log Stream */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden text-slate-300 flex-1 flex flex-col min-h-[300px]">
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-sans font-semibold text-sm text-slate-100 uppercase tracking-wide">REST Log Stream</h3>
                <p className="text-[10px] text-slate-500">Intercepted HTTP operations on local Express containers.</p>
              </div>
            </div>
            <button 
              onClick={() => setLogs([])}
              className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 uppercase font-bold"
            >
              Clear
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto max-h-[450px] font-mono text-[10px] space-y-3">
            {logs.length === 0 ? (
              <div className="text-slate-600 text-center py-10 select-none">
                Listening for HTTP Requests on `/api/v1/*`...
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-b border-slate-800/80 pb-3 space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                        log.method === "POST" 
                          ? "bg-emerald-950 text-emerald-400" 
                          : log.method === "GET" 
                          ? "bg-indigo-950 text-indigo-400"
                          : log.method === "PATCH"
                          ? "bg-amber-950 text-amber-400"
                          : "bg-red-950 text-red-100"
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-slate-200 font-semibold">{log.url}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[9px]">{log.timestamp}</span>
                      <span className={`px-1 rounded text-[9px] font-bold ${
                        log.status >= 200 && log.status < 300 
                          ? "bg-emerald-900/30 text-emerald-400" 
                          : "bg-red-900/30 text-red-400"
                      }`}>
                        HTTP {log.status}
                      </span>
                    </div>
                  </div>
                  {log.requestBody && (
                    <div className="bg-slate-950 p-1.5 rounded text-[9px] text-slate-400">
                      <strong className="text-slate-600 uppercase text-[8px] block">Request Payload</strong>
                      {JSON.stringify(log.requestBody)}
                    </div>
                  )}
                  {log.responseBody && (
                    <div className="bg-slate-950 p-1.5 rounded text-[9px] text-slate-400 max-h-24 overflow-y-auto">
                      <strong className="text-slate-600 uppercase text-[8px] block">Response JSON</strong>
                      {JSON.stringify(log.responseBody)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
