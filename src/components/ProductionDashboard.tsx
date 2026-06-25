import React, { useState } from "react";
import { 
  Plus, ChevronDown, ChevronRight, HelpCircle, FileText, 
  ShoppingCart, ShoppingBag, Package, Star, Calendar, 
  Info, Sparkles, Terminal, Layers
} from "lucide-react";

interface ProductionDashboardProps {
  onSwitchToDev: () => void;
  currentUser?: { full_name: string; email: string; role: string } | null;
}

export function ProductionDashboard({ onSwitchToDev, currentUser }: ProductionDashboardProps) {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<"dashboard" | "getting_started" | "recent_updates">("dashboard");
  
  // Pending actions vs Recent Activities tab state
  const [activeSidebarTab, setActiveSidebarTab] = useState<"pending" | "recent">("pending");

  // Filter Pills states
  const [topStockedFilter, setTopStockedFilter] = useState<"quantity" | "value">("quantity");
  const [salesSummaryFilter, setSalesSummaryFilter] = useState<"quantity" | "value">("quantity");

  // Dropdown menus states for interactive feelings
  const [showPeriodDropdown, setShowPeriodDropdown] = useState<string | null>(null);

  // Default dropdown selections
  const [dropdownSelections, setDropdownSelections] = useState({
    topSelling: "This Month",
    topStocked: "This Month",
    salesChannel: "This Month",
    salesOrderSummary: "This Month",
    topVendors: "This Month",
    receiveHistory: "This Month"
  });

  const toggleDropdown = (key: string) => {
    if (showPeriodDropdown === key) {
      setShowPeriodDropdown(null);
    } else {
      setShowPeriodDropdown(key);
    }
  };

  const selectDropdownValue = (key: string, value: string) => {
    setDropdownSelections(prev => ({ ...prev, [key]: value }));
    setShowPeriodDropdown(null);
  };

  const periods = ["This Month", "Last Month", "This Quarter", "This Year", "Custom Range"];

  // Render highly-rendered skeleton loaders for list placeholders
  const renderItemSkeletons = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 pb-2">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50/50 border border-transparent hover:border-slate-100 transition-all duration-200 group">
            {/* Aspect image placeholder */}
            <div className="w-12 h-12 bg-slate-200/60 rounded-md mb-2.5 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
              <Package className="w-5 h-5 text-slate-300" />
            </div>
            {/* Title line placeholder */}
            <div className="w-4/5 h-2 bg-slate-200/70 rounded-full mb-1.5" />
            {/* Sub-text line placeholder */}
            <div className="w-1/2 h-1.5 bg-slate-200/50 rounded-full" />
          </div>
        ))}
      </div>
    );
  };

  // Render blueprint line graphics helper
  const BlueprintPattern = () => (
    <div className="absolute inset-0 opacity-[0.035] pointer-events-none overflow-hidden select-none">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="blueprint-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#2485e8" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        {/* Floating schematic vector shapes */}
        <g stroke="#2485e8" strokeWidth="0.8" fill="none" transform="translate(45, 15)">
          <rect x="0" y="0" width="18" height="18" rx="2" />
          <path d="M4 4h10 M4 9h10 M4 14h6" />
        </g>
        <g stroke="#2485e8" strokeWidth="0.8" fill="none" transform="translate(190, 35)">
          <circle cx="9" cy="9" r="9" />
          <path d="M9 4v5l3 2" />
        </g>
        <g stroke="#2485e8" strokeWidth="0.8" fill="none" transform="translate(380, 10)">
          <path d="M3 13 L9 3 L15 13 Z" />
          <rect x="5" y="9" width="8" height="8" />
        </g>
        <g stroke="#2485e8" strokeWidth="0.8" fill="none" transform="translate(550, 25)">
          <rect x="0" y="0" width="14" height="14" rx="1" />
          <line x1="0" y1="7" x2="14" y2="7" />
          <line x1="7" y1="0" x2="7" y2="14" />
        </g>
        <g stroke="#2485e8" strokeWidth="0.8" fill="none" transform="translate(720, 20)">
          <path d="M1 5l6-4 6 4v8H1V5z" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f5f7] min-h-screen text-slate-800 antialiased flex flex-col font-sans">
      
      {/* 1. GREETING CARD ROW WITH FAINT BLUEPRINT PATTERN */}
      <div className="w-full bg-white border-b border-slate-200 px-6 pt-5 pb-0 relative shrink-0">
        <BlueprintPattern />
        
        {/* Inner header content block */}
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          
          {/* Left profile block */}
          <div className="flex items-center gap-4">
            
            {/* File Icon Block */}
            <div className="w-12 h-12 rounded-[6px] border border-slate-200 bg-white flex items-center justify-center shadow-2xs">
              <FileText className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
            </div>
            
            {/* Title / Organization info */}
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900 font-sans tracking-tight leading-tight">
                Hello, {currentUser?.full_name || "Paramnoor Singh"}
              </h2>
              <p className="text-[13px] text-slate-500 font-medium mt-0.5 tracking-wide">
                XYZ Parts
              </p>
            </div>
          </div>

          {/* Right Action: Dev Playground Toggle Switch (integrated as pristine corporate tools) */}
          <div className="flex items-center gap-2自">
            <button 
              onClick={onSwitchToDev}
              className="flex items-center gap-1.5 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] px-3.5 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Dev Playground API</span>
            </button>
          </div>
        </div>

        {/* Tab-like navigation bar */}
        <div className="max-w-[1400px] mx-auto mt-6 flex items-center gap-6 relative z-10 border-b border-transparent">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "getting_started", label: "Getting Started" },
            { id: "recent_updates", label: "Recent Updates" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-[14px] font-medium transition-all cursor-pointer relative ${
                activeTab === tab.id 
                  ? "text-[#2485e8] font-semibold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2485e8] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. MAIN HUB DATA DISPLAY */}
      {activeTab === "dashboard" ? (
        <div className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-6 flex flex-col lg:flex-row gap-6">
          
          {/* LEFT 2/3 COLUMN - CARD GRID */}
          <div className="flex-1 flex flex-col gap-6 lg:max-w-[68%]">
            
            {/* CARD 1: TOP SELLING ITEMS */}
            <div className="bg-white border border-slate-200 rounded-[6px] shadow-2xs p-5 relative">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  Top Selling Items
                </h3>
                
                {/* Period Selector Dropdown Wrapper */}
                <div className="relative">
                  <button 
                    onClick={() => toggleDropdown("topSelling")}
                    className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors group cursor-pointer"
                  >
                    <span>{dropdownSelections.topSelling}</span>
                    <ChevronDown className="w-3.5 h-3.5 mt-0.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>
                  
                  {showPeriodDropdown === "topSelling" && (
                    <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-[4px] shadow-sm py-1.5 z-30 text-[12px] text-slate-700">
                      {periods.map(p => (
                        <button key={p} onClick={() => selectDropdownValue("topSelling", p)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Classic Alert Box */}
              <div className="flex items-start gap-2.5 bg-[#f0f6ff] border border-[#d0e5ff] rounded-[4px] p-3 text-[12px] text-slate-700">
                <Sparkles className="w-4 h-4 text-[#2485e8] mt-0.5 shrink-0" />
                <span>You do not have any top selling items yet.</span>
              </div>

              {/* Soft Skeleton Line Graphics representing product items */}
              {renderItemSkeletons()}
            </div>

            {/* LOWER GRID: TWO CARDS FOR STOCK & CHANNELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CARD 2: TOP STOCKED ITEMS */}
              <div className="bg-white border border-slate-200 rounded-[6px] shadow-2xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">
                      Top Stocked Items
                    </h3>
                    
                    <div className="relative">
                      <button 
                        onClick={() => toggleDropdown("topStocked")}
                        className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors group cursor-pointer"
                      >
                        <span>As of: {dropdownSelections.topStocked}</span>
                        <ChevronDown className="w-3.5 h-3.5 mt-0.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </button>
                      
                      {showPeriodDropdown === "topStocked" && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-[4px] shadow-sm py-1.5 z-30 text-[12px] text-slate-700">
                          {periods.map(p => (
                            <button key={p} onClick={() => selectDropdownValue("topStocked", p)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 mb-4">
                    <button 
                      onClick={() => setTopStockedFilter("quantity")}
                      className={`px-3 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-colors ${
                        topStockedFilter === "quantity" 
                          ? "bg-[#2485e8] text-white" 
                          : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      By Quantity
                    </button>
                    <button 
                      onClick={() => setTopStockedFilter("value")}
                      className={`px-3 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-colors ${
                        topStockedFilter === "value" 
                          ? "bg-[#2485e8] text-white" 
                          : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      By Value
                    </button>
                  </div>

                  {/* Classic Alert */}
                  <div className="flex items-start gap-2.5 bg-[#f0f6ff] border border-[#d0e5ff] rounded-[4px] p-3 text-[12px] text-slate-700">
                    <Sparkles className="w-4 h-4 text-[#2485e8] mt-0.5 shrink-0" />
                    <span>No sales recorded during this period.</span>
                  </div>
                </div>

                {/* Soft decorative visual graph lines skeleton */}
                <div className="space-y-3.5 mt-6 pb-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex flex-col gap-1.5 px-1 opacity-60">
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span className="w-1/3 h-2.5 bg-slate-200/80 rounded" />
                        <span className="w-8 h-2.5 bg-slate-200/50 rounded" />
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-200 rounded-full" style={{ width: s === 1 ? "40%" : s === 2 ? "25%" : "15%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 3: SALES BY CHANNEL */}
              <div className="bg-white border border-slate-200 rounded-[6px] shadow-2xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">
                      Sales By Channel
                    </h3>
                    
                    <div className="relative">
                      <button 
                        onClick={() => toggleDropdown("salesChannel")}
                        className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors group cursor-pointer"
                      >
                        <span>{dropdownSelections.salesChannel}</span>
                        <ChevronDown className="w-3.5 h-3.5 mt-0.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </button>
                      
                      {showPeriodDropdown === "salesChannel" && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-[4px] shadow-sm py-1.5 z-30 text-[12px] text-slate-700">
                          {periods.map(p => (
                            <button key={p} onClick={() => selectDropdownValue("salesChannel", p)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Classic Alert */}
                  <div className="flex items-start gap-2.5 bg-[#f0f6ff] border border-[#d0e5ff] rounded-[4px] p-3 text-[12px] text-slate-700">
                    <Sparkles className="w-4 h-4 text-[#2485e8] mt-0.5 shrink-0" />
                    <span>No sales data found during this period.</span>
                  </div>
                </div>

                {/* Ring doughnut graphics placeholder */}
                <div className="flex items-center justify-center py-6 opacity-40">
                  <div className="w-20 h-20 rounded-full border-8 border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                    Empty
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: SALES ORDER SUMMARY */}
            <div className="bg-white border border-slate-200 rounded-[6px] shadow-2xs p-5">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">
                  Sales Order Summary
                </h3>
                
                <div className="relative">
                  <button 
                    onClick={() => toggleDropdown("salesOrderSummary")}
                    className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors group cursor-pointer"
                  >
                    <span>{dropdownSelections.salesOrderSummary}</span>
                    <ChevronDown className="w-3.5 h-3.5 mt-0.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>
                  
                  {showPeriodDropdown === "salesOrderSummary" && (
                    <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-[4px] shadow-sm py-1.5 z-30 text-[12px] text-slate-700">
                      {periods.map(p => (
                        <button key={p} onClick={() => selectDropdownValue("salesOrderSummary", p)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 mb-6">
                <button 
                  onClick={() => setSalesSummaryFilter("quantity")}
                  className={`px-3 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-colors ${
                    salesSummaryFilter === "quantity" 
                      ? "bg-[#2485e8] text-white" 
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  By Quantity
                </button>
                <button 
                  onClick={() => setSalesSummaryFilter("value")}
                  className={`px-3 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-colors ${
                    salesSummaryFilter === "value" 
                      ? "bg-[#2485e8] text-white" 
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  By Value
                </button>
              </div>

              {/* GRAPH CONTAINER WITH Y-AXIS AND X-AXIS */}
              <div className="relative border-l border-b border-slate-200 h-64 mt-4 select-none">
                
                {/* Horizontal Dashed Lines */}
                {[0, 1, 2, 3, 4].map((gridline) => (
                  <div 
                    key={gridline} 
                    className="absolute left-0 right-0 border-t border-dashed border-slate-200/50" 
                    style={{ bottom: `${(gridline + 1) * 20}%` }}
                  />
                ))}

                {/* Y Axis labels (outside the border on the left) */}
                <div className="absolute top-0 -left-10 bottom-0 flex flex-col justify-between text-[11px] text-slate-400 text-right pr-2 select-none h-full translate-y-[-6px]">
                  <span>5 K</span>
                  <span>4 K</span>
                  <span>3 K</span>
                  <span>2 K</span>
                  <span>1 K</span>
                  <span>0</span>
                </div>

                {/* Absolut center banner overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[13px] text-slate-400 font-medium">
                    No sales orders created during this period.
                  </p>
                </div>

                {/* X Axis labels at the bottom */}
                <div className="absolute left-0 right-0 -bottom-6 flex justify-between text-[10px] text-slate-450 font-sans px-2 pt-1">
                  {["01 Jun", "03 Jun", "05 Jun", "07 Jun", "09 Jun", "11 Jun", "13 Jun", "15 Jun", "17 Jun", "19 Jun", "21 Jun", "23 Jun", "25 Jun", "27 Jun", "29 Jun"].map(date => (
                    <span key={date} className="w-10 text-center text-slate-400 leading-none">{date}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* LOWER BOTTOM GRID: VENDORS & HISTORIES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* CARD 5: TOP VENDORS */}
              <div className="bg-white border border-slate-200 rounded-[6px] shadow-2xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">
                      Top Vendors
                    </h3>
                    
                    <div className="relative">
                      <button 
                        onClick={() => toggleDropdown("topVendors")}
                        className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors group cursor-pointer"
                      >
                        <span>{dropdownSelections.topVendors}</span>
                        <ChevronDown className="w-3.5 h-3.5 mt-0.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </button>
                      
                      {showPeriodDropdown === "topVendors" && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-[4px] shadow-sm py-1.5 z-30 text-[12px] text-slate-700">
                          {periods.map(p => (
                            <button key={p} onClick={() => selectDropdownValue("topVendors", p)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alert */}
                  <div className="flex items-start gap-2.5 bg-[#f0f6ff] border border-[#d0e5ff] rounded-[4px] p-3 text-[12px] text-slate-700">
                    <Sparkles className="w-4 h-4 text-[#2485e8] mt-0.5 shrink-0" />
                    <span>No vendor activity found for this period.</span>
                  </div>
                </div>

                {/* Soft visual decoration */}
                <div className="h-10 mt-6 pb-2 opacity-30 flex items-end justify-between px-4 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex-1 bg-slate-200" style={{ height: `${i * 12}%` }} />
                  ))}
                </div>
              </div>

              {/* CARD 6: RECEIVE HISTORY */}
              <div className="bg-white border border-slate-200 rounded-[6px] shadow-2xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">
                      Receive History
                    </h3>
                    
                    <div className="relative">
                      <button 
                        onClick={() => toggleDropdown("receiveHistory")}
                        className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors group cursor-pointer"
                      >
                        <span>{dropdownSelections.receiveHistory}</span>
                        <ChevronDown className="w-3.5 h-3.5 mt-0.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </button>
                      
                      {showPeriodDropdown === "receiveHistory" && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-[4px] shadow-sm py-1.5 z-30 text-[12px] text-slate-700">
                          {periods.map(p => (
                            <button key={p} onClick={() => selectDropdownValue("receiveHistory", p)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alert */}
                  <div className="flex items-start gap-2.5 bg-[#f0f6ff] border border-[#d0e5ff] rounded-[4px] p-3 text-[12px] text-slate-700">
                    <Sparkles className="w-4 h-4 text-[#2485e8] mt-0.5 shrink-0" />
                    <span>No purchase receives found for this period.</span>
                  </div>
                </div>

                {/* Soft visual decoration */}
                <div className="h-10 mt-6 pb-2 opacity-30 flex items-end justify-between px-4 gap-2">
                  {[6, 5, 4, 3, 2, 1].map(i => (
                    <div key={i} className="flex-1 bg-slate-200" style={{ height: `${i * 12}%` }} />
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT 1/3 SIDEBAR - SUMMARY & PENDING PANELS */}
          <div className="w-full lg:w-[32%] shrink-0 flex flex-col gap-6">
            
            {/* COLLAPSIBLE SIDEBAR CONTAINER */}
            <div className="bg-white border border-slate-200 rounded-[6px] shadow-2xs p-5">
              
              {/* Toggle switcher pill body */}
              <div className="flex bg-[#eef2f6] rounded-[4px] p-1 mb-6">
                <button 
                  onClick={() => setActiveSidebarTab("pending")}
                  className={`flex-1 text-center py-1.5 rounded-[4px] text-[12px] font-semibold transition-all cursor-pointer ${
                    activeSidebarTab === "pending" 
                      ? "bg-white text-slate-800 shadow-3xs" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pending Actions
                </button>
                <button 
                  onClick={() => setActiveSidebarTab("recent")}
                  className={`flex-1 text-center py-1.5 rounded-[4px] text-[12px] font-semibold transition-all cursor-pointer ${
                    activeSidebarTab === "recent" 
                      ? "bg-white text-slate-800 shadow-3xs" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Recent Activities
                </button>
              </div>

              {/* TAB CONTENT: PENDING ACTIONS (FROM PIXEL PERFECT SCREENSHOT 1) */}
              {activeSidebarTab === "pending" ? (
                <div className="space-y-6">
                  
                  {/* SALES BLOCK */}
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-600 tracking-wider flex items-center gap-2 mb-3.5">
                      <ShoppingCart className="w-4 h-4 text-[#f59e0b]" strokeWidth={2.5} />
                      SALES
                    </h4>
                    
                    <div className="divide-y divide-slate-100/70 border-t border-b border-slate-100">
                      {[
                        { label: "To Be Packed", val: 0 },
                        { label: "To Be Shipped", val: 0 },
                        { label: "To Be Delivered", val: 0 },
                        { label: "To Be Invoiced", val: 0 }
                      ].map((item) => (
                        <div key={item.label} className="py-2.5 flex items-center justify-between group hover:bg-slate-50/50 px-1 transition-colors">
                          <div className="flex items-center gap-2 text-[13px] text-slate-600 font-sans">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-[13px] text-slate-800 font-semibold">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PURCHASES BLOCK */}
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-600 tracking-wider flex items-center gap-2 mb-3.5">
                      <ShoppingBag className="w-4 h-4 text-[#f59e0b]" strokeWidth={2.5} />
                      PURCHASES
                    </h4>
                    
                    <div className="divide-y divide-slate-100/70 border-t border-b border-slate-100">
                      {[
                        { label: "To Be Received", val: 0 },
                        { label: "Receive In Progress", val: 0 }
                      ].map((item) => (
                        <div key={item.label} className="py-2.5 flex items-center justify-between group hover:bg-slate-50/50 px-1 transition-colors">
                          <div className="flex items-center gap-2 text-[13px] text-slate-600 font-sans">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-[13px] text-slate-800 font-semibold">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* INVENTORY BLOCK */}
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-600 tracking-wider flex items-center gap-2 mb-3.5">
                      <Package className="w-4 h-4 text-[#f59e0b]" strokeWidth={2.5} />
                      INVENTORY
                    </h4>
                    
                    <div className="divide-y divide-slate-100/70 border-t border-b border-slate-100">
                      {[
                        { label: "Below Reorder Level", val: 0 }
                      ].map((item) => (
                        <div key={item.label} className="py-2.5 flex items-center justify-between group hover:bg-slate-50/50 px-1 transition-colors">
                          <div className="flex items-center gap-2 text-[13px] text-slate-600 font-sans">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-[13px] text-slate-800 font-semibold">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                /* TAB CONTENT: RECENT ACTIVITIES */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="p-3 bg-slate-50 rounded-full border border-slate-100 mb-3">
                    <Calendar className="w-6 h-6 text-slate-300" />
                  </span>
                  <p className="text-[12px] text-slate-400 font-medium">
                    No recent activities recorded today.
                  </p>
                </div>
              )}

            </div>

            {/* DECORATIVE EXTRA HELPFUL TIP CARD */}
            <div className="bg-[#eff6ff] border border-blue-100 rounded-[6px] p-5 flex items-start gap-4 shadow-3xs relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-[0.04]">
                <Layers className="w-24 h-24 text-blue-800" />
              </div>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-[4px] shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-blue-900 leading-tight">Need assistance?</h4>
                <p className="text-[11.5px] text-blue-700/90 mt-1.5 leading-relaxed font-sans">
                  Configure real items, vendors, and clients via the sidebar tabs, then connect them smoothly! Or query endpoints in the Dev Playground interface.
                </p>
              </div>
            </div>

          </div>

        </div>
      ) : activeTab === "getting_started" ? (
        
        /* GETTING STARTED CONTENT */
        <div className="w-full max-w-[1400px] mx-auto px-6 py-8">
          <div className="bg-white border border-slate-200 rounded-[6px] p-8 shadow-2xs max-w-3xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full mx-auto flex items-center justify-center border border-blue-100">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-slate-900">Configure Your Warehouse</h3>
              <p className="text-[13px] text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Unlock automated item tracking and procurement metrics by completing three simple steps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-[4px] text-left">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Step 1</span>
                <span className="text-[13px] font-semibold text-slate-800 block">Add Physical Sites</span>
                <span className="text-[11.5px] text-slate-500 mt-0.5 block leading-normal">Register multiple store branches or depots.</span>
              </div>
              <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-[4px] text-left">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Step 2</span>
                <span className="text-[13px] font-semibold text-slate-800 block">Create Items</span>
                <span className="text-[11.5px] text-slate-500 mt-0.5 block leading-normal">Populate auto spare listings with stock.</span>
              </div>
              <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-[4px] text-left">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Step 3</span>
                <span className="text-[13px] font-semibold text-slate-800 block">Record Sales</span>
                <span className="text-[11.5px] text-slate-500 mt-0.5 block leading-normal">Track channel revenues and log clients.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        /* RECENT UPDATES CONTENT */
        <div className="w-full max-w-[1400px] mx-auto px-6 py-8">
          <div className="bg-white border border-slate-200 rounded-[6px] p-8 shadow-2xs max-w-2xl mx-auto space-y-6">
            <h3 className="text-[16px] font-bold text-slate-900 border-b border-slate-100 pb-3">Latest Features & Releases</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded h-fit">v1.2.0</span>
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-800">Advanced Relational Postgres Integration</h4>
                  <p className="text-[12px] text-slate-500 leading-normal mt-0.5">We completed the migration of tenant structures and user login definitions into direct drizzle relational database schemas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded h-fit">v1.1.0</span>
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-800">Branch Identity & Tenant Isolation</h4>
                  <p className="text-[12px] text-slate-500 leading-normal mt-0.5">Ensure strong multi-tenant separation across physical branches and isolated shops globally.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
