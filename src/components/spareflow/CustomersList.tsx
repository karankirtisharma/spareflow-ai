import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, 
  ChevronDown, Search, ArrowRight, User, Mail, Phone, 
  MapPin, Check, Info, FileDown, Trash2, X, AlertCircle, 
  Upload, Building, CreditCard, Shield, ExternalLink, Globe, Key, FileText, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImportCustomersModal } from './ImportCustomersModal.js';

export function CustomersList() {
  const { 
    customers, 
    addCustomer, 
    fetchCustomers, 
    isLoading 
  } = useInventoryStore();

  const [search, setSearch] = useState("");
  const [showCreateView, setShowCreateView] = useState(false);
  const [showImportView, setShowImportView] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'address' | 'contact' | 'remarks'>('details');
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [customerType, setCustomerType] = useState<'Business' | 'Individual'>('Business');
  const [salutation, setSalutation] = useState('Mr.');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [customerLanguage, setCustomerLanguage] = useState('English');
  
  // Other Details tab fields
  const [panValue, setPanValue] = useState('');
  const [currencyValue, setCurrencyValue] = useState('INR- Indian Rupee');
  const [paymentTermsValue, setPaymentTermsValue] = useState('Due on Receipt');
  const [enablePortal, setEnablePortal] = useState(false);

  // Address tab fields
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingCountry, setBillingCountry] = useState('India');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingCountry, setShippingCountry] = useState('India');

  // Contact Persons tab fields
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');

  // Remarks tab fields
  const [remarksValue, setRemarksValue] = useState('');

  // Selected customer for modal details view
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Sync display name with company name or first/last names by default to provide smooth UX
  useEffect(() => {
    if (customerType === 'Business' && companyName) {
      setDisplayName(companyName);
    } else if (customerType === 'Individual' && (firstName || lastName)) {
      setDisplayName(`${salutation} ${firstName} ${lastName}`.trim());
    }
  }, [customerType, companyName, firstName, lastName, salutation]);

  const openCreateForm = () => {
    // Reset all form field states
    setCustomerType('Business');
    setSalutation('Mr.');
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setDisplayName('');
    setEmailAddress('');
    setWorkPhone('');
    setMobilePhone('');
    setCustomerLanguage('English');
    setPanValue('');
    setCurrencyValue('INR- Indian Rupee');
    setPaymentTermsValue('Due on Receipt');
    setEnablePortal(false);
    
    setBillingStreet('');
    setBillingCity('');
    setBillingState('');
    setBillingZip('');
    setBillingCountry('India');
    setShippingStreet('');
    setShippingCity('');
    setShippingState('');
    setShippingZip('');
    setShippingCountry('India');

    setContactPersonName('');
    setContactPersonEmail('');
    setContactPersonPhone('');
    setRemarksValue('');

    setFormError('');
    setActiveTab('details');
    setShowCreateView(true);
  };

  const handleCopyBillingAddress = () => {
    setShippingStreet(billingStreet);
    setShippingCity(billingCity);
    setShippingState(billingState);
    setShippingZip(billingZip);
    setShippingCountry(billingCountry);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!displayName.trim()) {
      setFormError("Customer Display Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addCustomer({
        customer_type: customerType,
        primary_contact_salutation: salutation,
        primary_contact_first_name: firstName,
        primary_contact_last_name: lastName,
        company_name: companyName,
        display_name: displayName,
        email: emailAddress,
        work_phone: workPhone,
        mobile: mobilePhone,
        language: customerLanguage,
        pan: panValue,
        currency: currencyValue,
        payment_terms: paymentTermsValue,
        enable_portal: enablePortal
      });

      setShowCreateView(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save Customer record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = (customers || []).filter(c => {
    const term = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.company_name && c.company_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative font-sans antialiased text-slate-800">
      
      {/* Top Header Controls bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer group">
            <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              {showCreateView ? 'New Customer' : 'All Customers'} <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5" />
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!showCreateView && (
            <div className="relative mr-2 hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search Customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-[4px] text-[13px] bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500 w-56 transition-all"
              />
            </div>
          )}

          {!showCreateView ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={openCreateForm}
                className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3px]" /> New
              </button>
              <button 
                onClick={() => setShowImportView(true)}
                className="border border-slate-200 text-slate-655 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-[4px] text-[13px] font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-500" /> Import
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowCreateView(false)}
              className="border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 px-4 py-1.5 rounded-[4px] text-[14px] font-semibold transition-colors cursor-pointer"
            >
              Back to List
            </button>
          )}

          <div className="h-5 w-px bg-slate-200 mx-1.5"></div>

          <button className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="Settings">
            <Settings className="w-[17px] h-[17px]" />
          </button>

          <button className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="Filters">
            <ListFilter className="w-[17px] h-[17px]" />
          </button>

          <button className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="More Options">
            <MoreHorizontal className="w-[17px] h-[17px]" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          <button className="text-[#2485e8] p-1.5 hover:bg-blue-50 rounded-md transition-colors" title="Help Manual">
            <HelpCircle className="w-[17px] h-[17px]" />
          </button>
        </div>
      </div>

      {/* Main Container Workspace */}
      <div className="flex-1 overflow-y-auto relative bg-white">
        
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: ENTIRE NEW CUSTOMER FORM (Matches Screenshot 2 Exactly) */}
          {showCreateView ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-5xl mx-auto p-6 space-y-6 pb-20"
            >
              
              {/* Notice Banner */}
              <div className="bg-[#e9f4ff] border border-blue-100 px-4 py-2.5 rounded-[4px] flex items-center justify-between text-[12px] text-blue-700 font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Prefill Customer details from the GST portal using the Customer's GSTIN.</span>
                </div>
                <button type="button" className="text-blue-600 hover:text-blue-800 font-bold hover:underline">
                  Prefill ➔
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Core Basic info grid */}
                <div className="space-y-3.5 max-w-3xl">
                  
                  {/* Customer Type radio buttons */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Customer Type
                    </label>
                    <div className="flex items-center gap-6 text-[13px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="customer_type_radio"
                          checked={customerType === 'Business'}
                          onChange={() => setCustomerType('Business')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700">Business</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="customer_type_radio"
                          checked={customerType === 'Individual'}
                          onChange={() => setCustomerType('Individual')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700">Individual</span>
                      </label>
                    </div>
                  </div>

                  {/* Primary Contact Input with salutation and first/last names */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Primary Contact
                    </label>
                    <div className="grid grid-cols-[110px_1fr_1fr] gap-2">
                      <select 
                        value={salutation} 
                        onChange={(e) => setSalutation(e.target.value)}
                        className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 text-slate-700 focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Miss">Miss</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                      />
                      <input 
                        type="text" 
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Company Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Pioneer Auto Spares Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  {/* Customer Display Name* */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-rose-650 font-bold text-right text-[12px] uppercase tracking-wider flex items-center justify-end gap-1">
                      Customer Display Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Select or enter unique display alias"
                        className="w-full text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 focus:outline-hidden focus:border-blue-500 font-semibold text-slate-850"
                      />
                      <Info className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3.5" title="The name displayed in transaction documents" />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      <input 
                        type="email"
                        placeholder="sales@pioneerauto.in"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full pl-9 text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Customer Phone
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex border border-slate-300 bg-white rounded-[4px] overflow-hidden focus-within:border-blue-500">
                        <select className="bg-slate-50 border-r border-slate-200 text-[12px] px-1 text-slate-600 focus:outline-hidden">
                          <option>+91</option>
                          <option>+1</option>
                          <option>+62</option>
                          <option>+44</option>
                          <option>+971</option>
                        </select>
                        <input 
                          type="tel"
                          placeholder="Work Phone"
                          value={workPhone}
                          onChange={(e) => setWorkPhone(e.target.value)}
                          className="text-[13px] px-2 py-1.5 w-full focus:outline-hidden text-slate-850"
                        />
                      </div>

                      <div className="flex border border-slate-300 bg-white rounded-[4px] overflow-hidden focus-within:border-blue-500">
                        <select className="bg-slate-50 border-r border-slate-200 text-[12px] px-1 text-slate-600 focus:outline-hidden">
                          <option>+91</option>
                          <option>+1</option>
                          <option>+62</option>
                          <option>+44</option>
                          <option>+971</option>
                        </select>
                        <input 
                          type="tel"
                          placeholder="Mobile"
                          value={mobilePhone}
                          onChange={(e) => setMobilePhone(e.target.value)}
                          className="text-[13px] px-2 py-1.5 w-full focus:outline-hidden text-slate-850"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Language */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Language
                    </label>
                    <select 
                      value={customerLanguage}
                      onChange={(e) => setCustomerLanguage(e.target.value)}
                      className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 text-slate-850 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi / हिन्दी</option>
                      <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                      <option value="Spanish">Spanish / Español</option>
                      <option value="Arabic">Arabic / العربية</option>
                    </select>
                  </div>

                </div>

                {/* Tabbed Auxiliary Section (Other Details | Address | Contact Persons | Remarks) */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="flex border-b border-slate-200 text-[13px] font-semibold text-slate-500 gap-1.5 overflow-x-auto mb-5 select-none">
                    
                    <button 
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className={`pb-2 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'details' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Other Details
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => setActiveTab('address')}
                      className={`pb-2 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'address' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Address
                    </button>

                    <button 
                      type="button"
                      onClick={() => setActiveTab('contact')}
                      className={`pb-2 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'contact' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Contact Persons
                    </button>

                    <button 
                      type="button"
                      onClick={() => setActiveTab('remarks')}
                      className={`pb-2 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'remarks' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-805'
                      }`}
                    >
                      Remarks
                    </button>

                  </div>

                  {/* ACTIVE TAB PANELS */}
                  <div className="bg-slate-50/50 p-6 rounded-lg border border-slate-200">
                    
                    {/* TAB A: Other Details */}
                    {activeTab === 'details' && (
                      <div className="space-y-4 max-w-2xl text-[13px]">
                        
                        {/* PAN */}
                        <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                          <label className="text-slate-600 font-semibold text-right flex items-center justify-end gap-1">
                            PAN <Info className="w-3.5 h-3.5 text-slate-400" title="10 Digit Indian Income Tax Identifier" />
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. ABCDE1234F"
                            value={panValue}
                            onChange={(e) => setPanValue(e.target.value.toUpperCase())}
                            maxLength={10}
                            className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800 uppercase font-mono tracking-wider"
                          />
                        </div>

                        {/* Currency */}
                        <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                          <label className="text-slate-600 font-semibold text-right">Currency</label>
                          <select 
                            value={currencyValue}
                            onChange={(e) => setCurrencyValue(e.target.value)}
                            className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500"
                          >
                            <option value="INR- Indian Rupee">INR- Indian Rupee (₹)</option>
                            <option value="USD- US Dollar">USD- United States Dollar ($)</option>
                            <option value="EUR- Euro">EUR- Euro (€)</option>
                            <option value="AED- Emirati Dirham">AED- UAE Dirham</option>
                            <option value="IDR- Indonesian Rupiah">IDR- Indonesian Rupiah (Rp)</option>
                          </select>
                        </div>

                        {/* Payment Terms */}
                        <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                          <label className="text-slate-600 font-semibold text-right">Payment Terms</label>
                          <select 
                            value={paymentTermsValue}
                            onChange={(e) => setPaymentTermsValue(e.target.value)}
                            className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500"
                          >
                            <option value="Due on Receipt">Due on Receipt</option>
                            <option value="Net 15">Net 15 Days</option>
                            <option value="Net 30">Net 30 Days</option>
                            <option value="Net 45">Net 45 Days</option>
                            <option value="Net 60">Net 60 Days</option>
                          </select>
                        </div>

                        {/* Enable Portal? */}
                        <div className="grid grid-cols-[160px_1fr] gap-4 items-center pt-2">
                          <label className="text-slate-600 font-semibold text-right">Enable Portal?</label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-705">
                            <input 
                              type="checkbox"
                              checked={enablePortal}
                              onChange={(e) => setEnablePortal(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span>Allow portal access for this customer to review invoice ledger</span>
                          </label>
                        </div>

                        {/* Attached documents */}
                        <div className="grid grid-cols-[160px_1fr] gap-4 pt-3 items-start">
                          <label className="text-slate-600 font-semibold text-right mt-1">Documents</label>
                          <div className="border border-dashed border-slate-300 rounded-md p-4 text-center cursor-pointer bg-white group hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col items-center justify-center text-[12px] text-slate-500">
                              <Upload className="w-6 h-6 text-slate-400 mb-1 group-hover:text-blue-500 transition-colors" />
                              <span className="font-semibold text-slate-700">Upload File</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Maximum size of 10MB per attachment</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* TAB B: Address form fields */}
                    {activeTab === 'address' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[13px]">
                        
                        {/* Billing Address */}
                        <div className="space-y-3">
                          <h4 className="text-[14px] font-bold text-slate-755 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-slate-500" /> Billing Address
                          </h4>
                          
                          <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Street Address</label>
                            <input 
                              type="text"
                              value={billingStreet}
                              onChange={(e) => setBillingStreet(e.target.value)}
                              placeholder="House no, Street Name..."
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">City</label>
                              <input 
                                type="text"
                                value={billingCity}
                                onChange={(e) => setBillingCity(e.target.value)}
                                placeholder="City"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">State</label>
                              <input 
                                type="text"
                                value={billingState}
                                onChange={(e) => setBillingState(e.target.value)}
                                placeholder="State"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono">ZIP Code</label>
                              <input 
                                type="text"
                                value={billingZip}
                                onChange={(e) => setBillingZip(e.target.value)}
                                placeholder="e.g. 110001"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">Country</label>
                              <input 
                                type="text"
                                value={billingCountry}
                                onChange={(e) => setBillingCountry(e.target.value)}
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                            <h4 className="text-[14px] font-bold text-slate-755 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-slate-500" /> Shipping Address
                            </h4>
                            <button 
                              type="button"
                              onClick={handleCopyBillingAddress}
                              className="text-[11px] text-[#2485e8] hover:text-blue-800 font-bold uppercase cursor-pointer"
                            >
                              📋 Copy Billing Address
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Street Address</label>
                            <input 
                              type="text"
                              value={shippingStreet}
                              onChange={(e) => setShippingStreet(e.target.value)}
                              placeholder="House no, Street Name..."
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">City</label>
                              <input 
                                type="text"
                                value={shippingCity}
                                onChange={(e) => setShippingCity(e.target.value)}
                                placeholder="City"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">State</label>
                              <input 
                                type="text"
                                value={shippingState}
                                onChange={(e) => setShippingState(e.target.value)}
                                placeholder="State"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono">ZIP Code</label>
                              <input 
                                type="text"
                                value={shippingZip}
                                onChange={(e) => setShippingZip(e.target.value)}
                                placeholder="e.g. 110001"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">Country</label>
                              <input 
                                type="text"
                                value={shippingCountry}
                                onChange={(e) => setShippingCountry(e.target.value)}
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* TAB C: Contact Persons */}
                    {activeTab === 'contact' && (
                      <div className="space-y-4 max-w-2xl text-[13px]">
                        <h4 className="text-[14.5px] font-bold text-slate-700">Add Primary Contact Person details</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                            <input 
                              type="text"
                              value={contactPersonName}
                              onChange={(e) => setContactPersonName(e.target.value)}
                              placeholder="e.g. Amit Kumar Shinde"
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mobile Phone</label>
                            <input 
                              type="tel"
                              value={contactPersonPhone}
                              onChange={(e) => setContactPersonPhone(e.target.value)}
                              placeholder="Mobile"
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Direct Work Email</label>
                          <input 
                            type="email"
                            value={contactPersonEmail}
                            onChange={(e) => setContactPersonEmail(e.target.value)}
                            placeholder="amit@pioneerauto.in"
                            className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB D: Remarks text input */}
                    {activeTab === 'remarks' && (
                      <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-slate-450 uppercase">Internal Store keeper Remarks</label>
                        <textarea 
                          value={remarksValue}
                          onChange={(e) => setRemarksValue(e.target.value)}
                          placeholder="Add any internal private notes regarding payment behavior, logistics preferences..."
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-2.5 h-28 focus:outline-hidden focus:border-blue-500 placeholder-slate-400"
                        />
                      </div>
                    )}

                  </div>
                </div>

                {/* Submit Actions Footer (Matches screenshot 2 bottom save/cancel exactly) */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-[#2485e8] hover:bg-[#1a74d4] disabled:bg-blue-300 text-white font-bold text-[13.5px] px-5 py-2 rounded-[3px] shadow-sm select-none cursor-pointer transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateView(false)}
                    className="border border-slate-300 text-slate-650 bg-white hover:bg-slate-50 font-semibold text-[13.5px] px-5 py-2 rounded-[3px] select-none cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>

              </form>

            </motion.div>
          ) : (
            
            /* VIEW 2: ALL CUSTOMERS LIST / EMPTY DISPLAY (Matches Screenshot 1 Exactly) */
            <div className="h-full flex flex-col">
              
              {customers.length === 0 ? (
                /* Empty state container (Illustration matching Zoho Screenshot 1) */
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 min-h-[500px]">
                  
                  {/* Central beautiful card container */}
                  <div className="max-w-2xl bg-white rounded-lg border border-slate-180 p-8 shadow-xs flex flex-col items-center text-center">
                    
                    {/* Illustration vector avatar icon badge */}
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 relative">
                        <User className="w-10 h-10 text-slate-400" />
                        <div className="absolute right-0 bottom-0 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[14px] font-bold border-2 border-white">
                          +
                        </div>
                      </div>
                    </div>

                    <h3 className="text-[18px] font-bold text-slate-800 mb-1.5">
                      Every sales starts with a customer
                    </h3>
                    
                    <p className="text-[13px] text-slate-500 max-w-md leading-relaxed mb-6">
                      Create and manage your customers and their contact persons, all in one place.
                    </p>

                    {/* Standard Zoho Action row buttons */}
                    <div className="flex flex-wrap gap-3 justify-center items-center mb-8">
                      <button 
                        onClick={openCreateForm}
                        className="bg-[#2485e8] hover:bg-[#1a74d4] text-white text-[13px] font-bold px-5 py-2 rounded-[4px] shadow-sm cursor-pointer transition-colors"
                      >
                        Create New Customer
                      </button>
                      
                      <button 
                        onClick={() => setShowImportView(true)}
                        className="border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 text-[13px] font-bold px-5 py-2 rounded-[4px] shadow-2xs transition-colors cursor-pointer"
                      >
                        Import File
                      </button>
                    </div>

                    <div className="flex items-center gap-3 w-full max-w-xs mb-8">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span className="text-[11px] text-slate-400 font-medium uppercase select-none">- or -</span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="flex items-center gap-4 text-[12px] text-slate-450 font-semibold mb-8">
                      <span>Import using</span>
                      <div className="flex gap-2">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600 font-mono text-[10px] select-none hover:bg-slate-200 transition-colors">
                          LINK
                        </span>
                        <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-red-500 font-mono text-[10px] select-none hover:bg-slate-200 transition-colors">
                          GOOGLE
                        </span>
                        <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-indigo-500 font-mono text-[10px] select-none hover:bg-slate-200 transition-colors">
                          EXCEL
                        </span>
                      </div>
                    </div>

                    {/* KEY BENEFITS PANEL */}
                    <div className="w-full text-left bg-slate-50/50 p-6 rounded-md border border-slate-200/80">
                      
                      <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-4 select-none">
                        <Check className="w-4 h-4 text-emerald-500" /> Key Benefits
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-[12px] font-medium text-slate-650">
                        <div className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                          <span>Stay connected with multiple contact persons</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                          <span>Provide portal access to customers</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                          <span>Handle multiple addresses effortlessly</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                          <span>Create multi-currency transactions for contacts</span>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              ) : (
                
                /* Active customer table visualization with rich CRM info drawer support */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-[#f8fafc] border-b border-slate-200 sticky top-0 z-10 select-none">
                      <tr className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-6 w-10 text-center">
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 cursor-pointer" />
                        </th>
                        <th className="py-3 px-6">Name</th>
                        <th className="py-3 px-6">Company</th>
                        <th className="py-3 px-6">Email Address</th>
                        <th className="py-3 px-6">Phone Number</th>
                        <th className="py-3 px-6">Pay Terms</th>
                        <th className="py-3 px-6">Currency</th>
                        <th className="py-3 px-6 text-center">Portal status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px] bg-white">
                      {filteredCustomers.map(c => {
                        return (
                          <tr 
                            key={c.id} 
                            onClick={() => setSelectedCustomer(c)}
                            className="hover:bg-blue-50/20 transition-colors group cursor-pointer"
                          >
                            <td className="py-3.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="rounded border-slate-300 text-blue-600 cursor-pointer" />
                            </td>
                            
                            <td className="py-3.5 px-6 font-semibold text-[#2485e8] hover:underline">
                              {c.name || 'General Customer'}
                            </td>

                            <td className="py-3.5 px-6 text-slate-650">
                              {c.company_name || <span className="text-slate-300 italic">No Company</span>}
                            </td>

                            <td className="py-3.5 px-6 text-slate-500 font-mono text-[12.5px]">
                              {c.email || '—'}
                            </td>

                            <td className="py-3.5 px-6 text-slate-500 font-mono text-[12.5px]">
                              {c.mobile || c.work_phone || '—'}
                            </td>

                            <td className="py-3.5 px-6">
                              <span className="bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-[11px] text-slate-600 font-medium">
                                {c.payment_terms || 'Due on Receipt'}
                              </span>
                            </td>

                            <td className="py-3.5 px-6 font-semibold text-slate-700">
                              {c.currency || 'INR- Indian Rupee'}
                            </td>

                            <td className="py-3.5 px-6 text-center">
                              {c.enable_portal ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-[3px] text-[10px] font-extrabold uppercase">
                                  <Check className="w-3 h-3 stroke-[2.5]" /> Open Portal
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-400 border border-slate-150 px-2 py-0.5 rounded-[3px] text-[10px] font-extrabold uppercase">
                                  Off
                                </span>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              )}

            </div>

          )}

        </AnimatePresence>

      </div>

      {/* OVERLAY DRAWER: CUSTOMER DETAILS SPECIFIC VIEW (Gives Zoho high-fidelity completeness) */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 z-50 overflow-y-auto font-sans flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 backdrop-blur-md z-12">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <span className="text-[16px] font-bold text-slate-800">Customer Details Card</span>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 flex-1 text-[13px] text-slate-700">
              
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 text-[20px] font-bold border border-blue-100 uppercase">
                  {selectedCustomer.name ? selectedCustomer.name[0] : 'C'}
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded uppercase">
                    {selectedCustomer.customer_type || 'Business'}
                  </span>
                </div>
              </div>

              {/* Personal Card fields */}
              <div className="space-y-4">
                
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
                  Identity Core
                </h4>

                <div className="grid grid-cols-[140px_1fr] gap-x-2 border-b border-slate-100 pb-2.5">
                  <span className="text-slate-400 font-medium">Company Name</span>
                  <span className="font-bold text-slate-750">{selectedCustomer.company_name || '—'}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-x-2 border-b border-slate-100 pb-2.5">
                  <span className="text-slate-400 font-medium">Email Address</span>
                  <span className="font-mono text-[#2485e8] font-semibold">{selectedCustomer.email || 'No email registered'}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-x-2 border-b border-slate-100 pb-2.5">
                  <span className="text-slate-400 font-medium">Phone Number</span>
                  <span className="font-mono text-slate-750">{selectedCustomer.mobile || selectedCustomer.work_phone || '—'}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-x-2 border-b border-slate-100 pb-2.5">
                  <span className="text-slate-400 font-medium">language Preference</span>
                  <span className="text-slate-750">{selectedCustomer.language || 'English'}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-x-2 border-b border-slate-100 pb-2.5">
                  <span className="text-slate-400 font-medium">Income Tax PAN</span>
                  <span className="font-mono uppercase font-bold tracking-wide text-slate-750">{selectedCustomer.pan || '—'}</span>
                </div>

                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest pt-3">
                  Finance & Payment Settings
                </h4>

                <div className="grid grid-cols-[140px_1fr] gap-x-2 border-b border-slate-100 pb-2.5">
                  <span className="text-slate-400 font-medium">Payment Terms</span>
                  <span className="font-semibold text-slate-700">{selectedCustomer.payment_terms || 'Due on Receipt'}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-x-2 border-b border-slate-100 pb-2.5">
                  <span className="text-slate-400 font-medium">Base Currency</span>
                  <span className="font-bold text-slate-750">{selectedCustomer.currency || 'INR- Indian Rupee'}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-x-2 border-b border-slate-100 pb-2.5">
                  <span className="text-slate-400 font-medium">Portal Authorized</span>
                  <span className="text-slate-750">{selectedCustomer.enable_portal ? 'Authorized (Yes)' : 'Unauthorized (No)'}</span>
                </div>

              </div>

              {/* CRM Info Tips */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-md p-4 flex gap-2 pt-3.5 pb-3.5">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="block font-bold text-slate-705">Associated Transactions Info</span>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">
                    All sales orders, invoices, and payment receipts matching display name <b>{selectedCustomer.name}</b> are synced automatically into reports ledger.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2 text-[13px]">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="bg-[#2485e8] text-white px-4 py-1.5 rounded-[4px] font-bold cursor-pointer hover:bg-blue-600 transition-colors"
              >
                Close Drawer
              </button>
            </div>

          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportView && (
          <ImportCustomersModal 
            onClose={() => setShowImportView(false)}
            onImportComplete={() => {
              setShowImportView(false);
              fetchCustomers();
            }}
            addCustomer={addCustomer}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
