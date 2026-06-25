import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { 
  Settings, HelpCircle, ListFilter, MoreHorizontal, Plus, 
  ChevronDown, Search, ArrowRight, User, Mail, Phone, 
  MapPin, Check, Info, FileDown, Trash2, X, AlertCircle, 
  Upload, Building, CreditCard, Shield, ExternalLink, Globe, Key, FileText, FileSpreadsheet, Store, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContactPerson {
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  workPhone: string;
  mobile: string;
}

export function VendorsList() {
  const { 
    vendors, 
    addVendor, 
    fetchVendors, 
    isLoading 
  } = useInventoryStore();

  const [search, setSearch] = useState("");
  const [showCreateView, setShowCreateView] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'address' | 'contact' | 'bank' | 'remarks'>('details');
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [vendorType, setVendorType] = useState<'Business' | 'Individual'>('Business');
  const [salutation, setSalutation] = useState('Mr.');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [workPhonePrefix, setWorkPhonePrefix] = useState('+91');
  const [workPhone, setWorkPhone] = useState('');
  const [mobilePhonePrefix, setMobilePhonePrefix] = useState('+91');
  const [mobilePhone, setMobilePhone] = useState('');
  const [vendorLanguage, setVendorLanguage] = useState('English');
  
  // Other Details tab fields
  const [panValue, setPanValue] = useState('');
  const [msmeRegistered, setMsmeRegistered] = useState(false);
  const [currencyValue, setCurrencyValue] = useState('INR- Indian Rupee');
  const [paymentTermsValue, setPaymentTermsValue] = useState('Due on Receipt');
  const [tdsValue, setTdsValue] = useState('None');
  const [enablePortal, setEnablePortal] = useState(false);

  // Address tab fields
  // Billing Address
  const [billingAttention, setBillingAttention] = useState('');
  const [billingCountry, setBillingCountry] = useState('India');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingFax, setBillingFax] = useState('');
  
  // Shipping Address
  const [shippingAttention, setShippingAttention] = useState('');
  const [shippingCountry, setShippingCountry] = useState('India');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingFax, setShippingFax] = useState('');

  // Contact Persons tab fields
  const [contactPersonsList, setContactPersonsList] = useState<ContactPerson[]>([
    { salutation: 'Mr.', firstName: '', lastName: '', email: '', workPhone: '', mobile: '' }
  ]);

  // Bank Details tab fields
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  // Remarks tab fields
  const [remarksValue, setRemarksValue] = useState('');

  // Selected vendor for modal details view
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  // Sync display name with company name or first/last names by default to provide smooth UX
  useEffect(() => {
    if (vendorType === 'Business' && companyName) {
      setDisplayName(companyName);
    } else if (vendorType === 'Individual' && (firstName || lastName)) {
      setDisplayName(`${salutation} ${firstName} ${lastName}`.trim());
    }
  }, [vendorType, companyName, firstName, lastName, salutation]);

  const openCreateForm = () => {
    // Reset all form field states
    setVendorType('Business');
    setSalutation('Mr.');
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setDisplayName('');
    setEmailAddress('');
    setWorkPhone('');
    setMobilePhone('');
    setVendorLanguage('English');
    setPanValue('');
    setMsmeRegistered(false);
    setCurrencyValue('INR- Indian Rupee');
    setPaymentTermsValue('Due on Receipt');
    setTdsValue('None');
    setEnablePortal(false);
    
    setBillingAttention('');
    setBillingCountry('India');
    setBillingStreet('');
    setBillingCity('');
    setBillingState('');
    setBillingZip('');
    setBillingPhone('');
    setBillingFax('');

    setShippingAttention('');
    setShippingCountry('India');
    setShippingStreet('');
    setShippingCity('');
    setShippingState('');
    setShippingZip('');
    setShippingPhone('');
    setShippingFax('');

    setContactPersonsList([
      { salutation: 'Mr.', firstName: '', lastName: '', email: '', workPhone: '', mobile: '' }
    ]);

    setBankAccountHolder('');
    setBankAccountNumber('');
    setBankName('');
    setBankIfsc('');
    setBankBranch('');

    setRemarksValue('');

    setFormError('');
    setActiveTab('details');
    setShowCreateView(true);
  };

  const handleCopyBillingAddress = () => {
    setShippingAttention(billingAttention);
    setShippingCountry(billingCountry);
    setShippingStreet(billingStreet);
    setShippingCity(billingCity);
    setShippingState(billingState);
    setShippingZip(billingZip);
    setShippingPhone(billingPhone);
    setShippingFax(billingFax);
  };

  const handleAddContactPersonRow = () => {
    setContactPersonsList([
      ...contactPersonsList,
      { salutation: 'Mr.', firstName: '', lastName: '', email: '', workPhone: '', mobile: '' }
    ]);
  };

  const handleRemoveContactPersonRow = (index: number) => {
    if (contactPersonsList.length === 1) {
      setContactPersonsList([{ salutation: 'Mr.', firstName: '', lastName: '', email: '', workPhone: '', mobile: '' }]);
    } else {
      setContactPersonsList(contactPersonsList.filter((_, i) => i !== index));
    }
  };

  const handleContactPersonChange = (index: number, field: keyof ContactPerson, value: string) => {
    const updated = [...contactPersonsList];
    updated[index][field] = value;
    setContactPersonsList(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!displayName.trim()) {
      setFormError("Vendor Display Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const billingAddressObj = {
        attention: billingAttention,
        country: billingCountry,
        street: billingStreet,
        city: billingCity,
        state: billingState,
        zip: billingZip,
        phone: billingPhone,
        fax: billingFax
      };

      const shippingAddressObj = {
        attention: shippingAttention,
        country: shippingCountry,
        street: shippingStreet,
        city: shippingCity,
        state: shippingState,
        zip: shippingZip,
        phone: shippingPhone,
        fax: shippingFax
      };

      const bankDetailsObj = {
        holderName: bankAccountHolder,
        accountNumber: bankAccountNumber,
        bankName: bankName,
        ifscCode: bankIfsc,
        branchName: bankBranch
      };

      // Filter out empty contact person rows
      const validContacts = contactPersonsList.filter(c => c.firstName.trim() || c.lastName.trim() || c.email.trim());

      await addVendor({
        vendor_type: vendorType,
        primary_contact_salutation: salutation,
        primary_contact_first_name: firstName,
        primary_contact_last_name: lastName,
        company_name: companyName,
        display_name: displayName,
        email: emailAddress,
        work_phone: workPhone ? `${workPhonePrefix} ${workPhone}`.trim() : '',
        mobile: mobilePhone ? `${mobilePhonePrefix} ${mobilePhone}`.trim() : '',
        language: vendorLanguage,
        pan: panValue,
        msme_registered: msmeRegistered,
        currency: currencyValue,
        payment_terms: paymentTermsValue,
        tds: tdsValue,
        enable_portal: enablePortal,
        billing_address: JSON.stringify(billingAddressObj),
        shipping_address: JSON.stringify(shippingAddressObj),
        contact_persons: JSON.stringify(validContacts),
        bank_details: JSON.stringify(bankDetailsObj),
        remarks: remarksValue
      });

      setShowCreateView(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save Vendor record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVendors = (vendors || []).filter(v => {
    const term = search.toLowerCase();
    return (
      (v.name && v.name.toLowerCase().includes(term)) ||
      (v.email && v.email.toLowerCase().includes(term)) ||
      (v.company_name && v.company_name.toLowerCase().includes(term)) ||
      (v.pan && v.pan.toLowerCase().includes(term))
    );
  });

  return (
    <div id="vendors-list-container" className="flex-1 flex flex-col bg-white h-full relative font-sans antialiased text-slate-800">
      
      {/* Top Header Controls bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer group">
            <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              {showCreateView ? 'New Vendor' : 'All Vendors'} <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5" />
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!showCreateView && (
            <div className="relative mr-2 hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search Vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-[4px] text-[13px] bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500 w-56 transition-all"
              />
            </div>
          )}

          {!showCreateView ? (
            <div className="flex items-center gap-2">
              <button 
                id="btn-new-vendor"
                onClick={openCreateForm}
                className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3px]" /> New
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
          
          {/* VIEW 1: NEW VENDOR FORM */}
          {showCreateView ? (
            <motion.div 
              key="create-vendor-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-5xl mx-auto p-6 space-y-6 pb-20"
            >
              
              {/* Notice Banner */}
              <div className="bg-[#e9f4ff] border border-blue-100 px-4 py-2.5 rounded-[4px] flex items-center justify-between text-[12px] text-blue-700 font-medium">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span>Prefill Vendor details from the GST portal using the Vendor's GSTIN.</span>
                </div>
                <button type="button" onClick={() => alert("GST prefill integration initialized...")} className="text-blue-600 hover:text-blue-800 font-bold hover:underline">
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
                  
                  {/* Vendor Type */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Vendor Type
                    </label>
                    <div className="flex items-center gap-6 text-[13px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="vendor_type_radio"
                          checked={vendorType === 'Business'}
                          onChange={() => setVendorType('Business')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700">Business</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="vendor_type_radio"
                          checked={vendorType === 'Individual'}
                          onChange={() => setVendorType('Individual')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700">Individual</span>
                      </label>
                    </div>
                  </div>

                  {/* Primary Contact */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Primary Contact
                    </label>
                    <div className="grid grid-cols-[110px_1fr_1fr] gap-2">
                      <select 
                        value={salutation} 
                        onChange={(e) => setSalutation(e.target.value)}
                        className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer"
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
                      placeholder="e.g. Bosch Car Components India"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  {/* Vendor Display Name* */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-rose-650 font-bold text-right text-[12px] uppercase tracking-wider flex items-center justify-end gap-1">
                      Vendor Display Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Bosch India Spares"
                        className="w-full text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 focus:outline-hidden focus:border-blue-500 font-semibold text-slate-850"
                      />
                      <Info className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" title="The name displayed in purchasing documents" />
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
                        placeholder="orders@bosch-indiaspares.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full pl-9 text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 focus:outline-hidden focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Vendor Phone
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex border border-slate-300 bg-white rounded-[4px] overflow-hidden focus-within:border-blue-500">
                        <select 
                          value={workPhonePrefix}
                          onChange={(e) => setWorkPhonePrefix(e.target.value)}
                          className="bg-slate-50 border-r border-slate-200 text-[12px] px-1 text-slate-600 focus:outline-hidden cursor-pointer"
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+62">+62</option>
                          <option value="+44">+44</option>
                          <option value="+971">+971</option>
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
                        <select 
                          value={mobilePhonePrefix}
                          onChange={(e) => setMobilePhonePrefix(e.target.value)}
                          className="bg-slate-50 border-r border-slate-200 text-[12px] px-1 text-slate-600 focus:outline-hidden cursor-pointer"
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+62">+62</option>
                          <option value="+44">+44</option>
                          <option value="+971">+971</option>
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

                  {/* Vendor Language */}
                  <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                    <label className="text-slate-550 font-bold text-right text-[12px] uppercase tracking-wider">
                      Language
                    </label>
                    <select 
                      value={vendorLanguage}
                      onChange={(e) => setVendorLanguage(e.target.value)}
                      className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 text-slate-850 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi / हिन्दी</option>
                      <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                      <option value="Spanish">Spanish / Español</option>
                      <option value="Arabic">Arabic / العربية</option>
                    </select>
                  </div>

                </div>

                {/* Tabbed Auxiliary Section */}
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
                      onClick={() => setActiveTab('bank')}
                      className={`pb-2 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'bank' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Bank Details
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

                        {/* MSME Registered */}
                        <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                          <label className="text-slate-600 font-semibold text-right flex items-center justify-end gap-1">
                            MSME Registered? <Info className="w-3.5 h-3.5 text-slate-400" title="Micro, Small and Medium Enterprises" />
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                            <input 
                              type="checkbox"
                              checked={msmeRegistered}
                              onChange={(e) => setMsmeRegistered(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span>This vendor is MSME registered</span>
                          </label>
                        </div>

                        {/* Currency */}
                        <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                          <label className="text-slate-600 font-semibold text-right">Currency</label>
                          <select 
                            value={currencyValue}
                            onChange={(e) => setCurrencyValue(e.target.value)}
                            className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
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
                            className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                          >
                            <option value="Due on Receipt">Due on Receipt</option>
                            <option value="Net 15">Net 15 Days</option>
                            <option value="Net 30">Net 30 Days</option>
                            <option value="Net 45">Net 45 Days</option>
                            <option value="Net 60">Net 60 Days</option>
                          </select>
                        </div>

                        {/* TDS */}
                        <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                          <label className="text-slate-600 font-semibold text-right">TDS (Tax Deducted at Source)</label>
                          <select 
                            value={tdsValue}
                            onChange={(e) => setTdsValue(e.target.value)}
                            className="text-[13px] border border-slate-300 bg-white rounded-[4px] p-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                          >
                            <option value="None">None</option>
                            <option value="TDS - 1% (Section 194C)">TDS - 1% (Section 194C - Contractors)</option>
                            <option value="TDS - 2% (Section 194I - Rent)">TDS - 2% (Section 194I - Rent on Plant/Machinery)</option>
                            <option value="TDS - 5% (Section 194J - Tech/Professional)">TDS - 5% (Section 194J - Professional Services)</option>
                            <option value="TDS - 10% (Section 194H - Commission)">TDS - 10% (Section 194H - Commission)</option>
                          </select>
                        </div>

                        {/* Enable Portal */}
                        <div className="grid grid-cols-[160px_1fr] gap-4 items-center pt-2">
                          <label className="text-slate-600 font-semibold text-right">Enable Portal?</label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-705">
                            <input 
                              type="checkbox"
                              checked={enablePortal}
                              onChange={(e) => setEnablePortal(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span>Allow portal access for this vendor to collaborate and upload invoices</span>
                          </label>
                        </div>

                        {/* Documents */}
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

                    {/* TAB B: Address */}
                    {activeTab === 'address' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[13px]">
                        
                        {/* Billing Address */}
                        <div className="space-y-3">
                          <h4 className="text-[14px] font-bold text-slate-755 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-slate-500" /> Billing Address
                          </h4>
                          
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Attention (Contact Person)</label>
                            <input 
                              type="text"
                              value={billingAttention}
                              onChange={(e) => setBillingAttention(e.target.value)}
                              placeholder="Name of recipient"
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Country / Region</label>
                            <select 
                              value={billingCountry}
                              onChange={(e) => setBillingCountry(e.target.value)}
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                            >
                              <option value="India">India</option>
                              <option value="United States">United States</option>
                              <option value="Germany">Germany</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Indonesia">Indonesia</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Street Address</label>
                            <textarea 
                              value={billingStreet}
                              onChange={(e) => setBillingStreet(e.target.value)}
                              placeholder="Street address details..."
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 h-16 focus:outline-hidden focus:border-blue-500"
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
                              <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono">PIN Code</label>
                              <input 
                                type="text"
                                value={billingZip}
                                onChange={(e) => setBillingZip(e.target.value)}
                                placeholder="Zip code"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">Phone</label>
                              <input 
                                type="text"
                                value={billingPhone}
                                onChange={(e) => setBillingPhone(e.target.value)}
                                placeholder="Phone number"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Fax Number</label>
                            <input 
                              type="text"
                              value={billingFax}
                              onChange={(e) => setBillingFax(e.target.value)}
                              placeholder="Fax"
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
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
                              📋 Copy Billing Address ⬇
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Attention (Contact Person)</label>
                            <input 
                              type="text"
                              value={shippingAttention}
                              onChange={(e) => setShippingAttention(e.target.value)}
                              placeholder="Name of recipient"
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Country / Region</label>
                            <select 
                              value={shippingCountry}
                              onChange={(e) => setShippingCountry(e.target.value)}
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                            >
                              <option value="India">India</option>
                              <option value="United States">United States</option>
                              <option value="Germany">Germany</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Indonesia">Indonesia</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Street Address</label>
                            <textarea 
                              value={shippingStreet}
                              onChange={(e) => setShippingStreet(e.target.value)}
                              placeholder="Street address details..."
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 h-16 focus:outline-hidden focus:border-blue-500"
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
                              <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono">PIN Code</label>
                              <input 
                                type="text"
                                value={shippingZip}
                                onChange={(e) => setShippingZip(e.target.value)}
                                placeholder="Zip code"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">Phone</label>
                              <input 
                                type="text"
                                value={shippingPhone}
                                onChange={(e) => setShippingPhone(e.target.value)}
                                placeholder="Phone number"
                                className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Fax Number</label>
                            <input 
                              type="text"
                              value={shippingFax}
                              onChange={(e) => setShippingFax(e.target.value)}
                              placeholder="Fax"
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
                          </div>

                        </div>

                      </div>
                    )}

                    {/* TAB C: Contact Persons */}
                    {activeTab === 'contact' && (
                      <div className="space-y-4 text-[13px]">
                        <h4 className="text-[14.5px] font-bold text-slate-700 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-500" /> Vendor Contact Persons List
                        </h4>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[12px] border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                                <th className="pb-2 pr-2 w-[100px]">Salutation</th>
                                <th className="pb-2 px-2">First Name</th>
                                <th className="pb-2 px-2">Last Name</th>
                                <th className="pb-2 px-2">Email Address</th>
                                <th className="pb-2 px-2">Work Phone</th>
                                <th className="pb-2 px-2">Mobile</th>
                                <th className="pb-2 pl-2 w-[40px]"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {contactPersonsList.map((contact, index) => (
                                <tr key={index} className="border-b border-slate-100 last:border-b-0">
                                  <td className="py-2 pr-2">
                                    <select
                                      value={contact.salutation}
                                      onChange={(e) => handleContactPersonChange(index, 'salutation', e.target.value)}
                                      className="border border-slate-300 rounded p-1 w-full text-[12px] bg-white cursor-pointer"
                                    >
                                      <option value="Mr.">Mr.</option>
                                      <option value="Mrs.">Mrs.</option>
                                      <option value="Ms.">Ms.</option>
                                      <option value="Miss">Miss</option>
                                      <option value="Dr.">Dr.</option>
                                    </select>
                                  </td>
                                  <td className="py-2 px-2">
                                    <input 
                                      type="text"
                                      value={contact.firstName}
                                      placeholder="First name"
                                      onChange={(e) => handleContactPersonChange(index, 'firstName', e.target.value)}
                                      className="border border-slate-300 rounded p-1 w-full text-[12px] bg-white"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input 
                                      type="text"
                                      value={contact.lastName}
                                      placeholder="Last name"
                                      onChange={(e) => handleContactPersonChange(index, 'lastName', e.target.value)}
                                      className="border border-slate-300 rounded p-1 w-full text-[12px] bg-white"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input 
                                      type="email"
                                      value={contact.email}
                                      placeholder="Email"
                                      onChange={(e) => handleContactPersonChange(index, 'email', e.target.value)}
                                      className="border border-slate-300 rounded p-1 w-full text-[12px] bg-white"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input 
                                      type="tel"
                                      value={contact.workPhone}
                                      placeholder="Work Phone"
                                      onChange={(e) => handleContactPersonChange(index, 'workPhone', e.target.value)}
                                      className="border border-slate-300 rounded p-1 w-full text-[12px] bg-white"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input 
                                      type="tel"
                                      value={contact.mobile}
                                      placeholder="Mobile"
                                      onChange={(e) => handleContactPersonChange(index, 'mobile', e.target.value)}
                                      className="border border-slate-300 rounded p-1 w-full text-[12px] bg-white"
                                    />
                                  </td>
                                  <td className="py-2 pl-2 text-center">
                                    <button 
                                      type="button" 
                                      onClick={() => handleRemoveContactPersonRow(index)}
                                      className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                      title="Remove row"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <button 
                          type="button"
                          onClick={handleAddContactPersonRow}
                          className="border border-[#2485e8] text-[#2485e8] hover:bg-blue-50 px-3 py-1.5 rounded text-[12px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Add Contact Person
                        </button>

                      </div>
                    )}

                    {/* TAB D: Bank Details */}
                    {activeTab === 'bank' && (
                      <div className="space-y-4 max-w-2xl text-[13px]">
                        <h4 className="text-[14.5px] font-bold text-slate-700 flex items-center gap-1.5">
                          <Landmark className="w-4 h-4 text-slate-500" /> Vendor Settlement Bank Account
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Account Holder Name</label>
                            <input 
                              type="text"
                              value={bankAccountHolder}
                              placeholder="Account Holder"
                              onChange={(e) => setBankAccountHolder(e.target.value)}
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Account Number</label>
                            <input 
                              type="text"
                              value={bankAccountNumber}
                              placeholder="Account Number"
                              onChange={(e) => setBankAccountNumber(e.target.value)}
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Bank Name</label>
                            <input 
                              type="text"
                              value={bankName}
                              placeholder="e.g. State Bank of India"
                              onChange={(e) => setBankName(e.target.value)}
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 font-mono">IFSC Code</label>
                            <input 
                              type="text"
                              value={bankIfsc}
                              placeholder="SBIN0001234"
                              maxLength={11}
                              onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                              className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500 font-mono uppercase"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Branch Name</label>
                          <input 
                            type="text"
                            value={bankBranch}
                            placeholder="Branch location"
                            onChange={(e) => setBankBranch(e.target.value)}
                            className="w-full text-[13px] border border-slate-300 bg-white rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                          />
                        </div>

                      </div>
                    )}

                    {/* TAB E: Remarks */}
                    {activeTab === 'remarks' && (
                      <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-slate-450 uppercase">Internal Private Vendor Notes</label>
                        <textarea 
                          value={remarksValue}
                          onChange={(e) => setRemarksValue(e.target.value)}
                          placeholder="Add private details regarding quality check ratios, freight/delivery speeds..."
                          className="w-full text-[13px] border border-slate-300 bg-white rounded p-2.5 h-28 focus:outline-hidden focus:border-blue-500 placeholder-slate-400"
                        />
                      </div>
                    )}

                  </div>
                </div>

                {/* Submit Actions Footer */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <button 
                    id="btn-save-vendor"
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
            
            /* VIEW 2: ALL VENDORS LIST OR EMPTY DISPLAY */
            <div className="h-full flex flex-col">
              
              {filteredVendors.length === 0 ? (
                /* Empty state container */
                <div key="empty-state" className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 min-h-[500px]">
                  
                  {/* Central card container */}
                  <div className="max-w-2xl bg-white rounded-lg border border-slate-200 p-8 shadow-xs flex flex-col items-center text-center">
                    
                    {/* Illustration vector badge */}
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 relative">
                        <Store className="w-10 h-10 text-slate-400" />
                        <div className="absolute right-0 bottom-0 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[14px] font-bold border-2 border-white">
                          +
                        </div>
                      </div>
                    </div>

                    <h3 className="text-[18px] font-bold text-slate-800 mb-1.5">
                      Every purchase starts with a vendor
                    </h3>
                    
                    <p className="text-[13px] text-slate-500 max-w-md leading-relaxed mb-6">
                      Create and manage your vendors and their contact persons, all in one place.
                    </p>

                    {/* Zoho Action row buttons */}
                    <div className="flex flex-wrap gap-3 justify-center items-center mb-6">
                      <button 
                        id="btn-create-vendor-empty"
                        onClick={openCreateForm}
                        className="bg-[#2485e8] hover:bg-[#1a74d4] text-white text-[13px] font-bold px-5 py-2 rounded-[4px] shadow-sm cursor-pointer transition-colors"
                      >
                        Create New Vendor
                      </button>
                      
                      <button 
                        onClick={() => alert("Vendors import integration initialized...")}
                        className="border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 text-[13px] font-bold px-5 py-2 rounded-[4px] shadow-2xs transition-colors cursor-pointer"
                      >
                        Import File
                      </button>
                    </div>

                    <div className="flex items-center gap-3 w-full max-w-xs mb-6">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span className="text-[11px] text-slate-400 font-medium uppercase select-none">- or -</span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <button 
                      onClick={() => alert("GST portal fetch initialized...")}
                      className="text-[#2485e8] hover:underline text-[12px] font-semibold flex items-center gap-1.5"
                    >
                      <Globe className="w-4 h-4" /> Import from GST Network (GSTN)
                    </button>

                  </div>

                  {/* Key Benefits Card */}
                  <div className="max-w-2xl w-full bg-white rounded-lg border border-slate-200 p-6 mt-6 shadow-2xs">
                    <h4 className="text-[14px] font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-500" /> Key Benefits
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12.5px] text-slate-600">
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 stroke-[3px] shrink-0" />
                        <span>Stay connected with multiple contact persons</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 stroke-[3px] shrink-0" />
                        <span>Provide portal access to vendors</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 stroke-[3px] shrink-0" />
                        <span>Handle multiple addresses effortlessly</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 stroke-[3px] shrink-0" />
                        <span>Create multi-currency transactions for contacts</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* Normal Table View */
                <div key="table-view" className="p-6">
                  <div className="overflow-x-auto border border-slate-200 rounded-[4px] shadow-2xs">
                    <table className="w-full text-left text-[13px] border-collapse bg-white">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold select-none">
                          <th className="p-3.5 pl-6 font-bold">Display Name</th>
                          <th className="p-3.5 font-bold">Company Name</th>
                          <th className="p-3.5 font-bold">Email Address</th>
                          <th className="p-3.5 font-bold">Work Phone</th>
                          <th className="p-3.5 font-bold">MSME Registered</th>
                          <th className="p-3.5 font-bold">Currency</th>
                          <th className="p-3.5 font-bold">Payment Terms</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredVendors.map((vendor) => (
                          <tr 
                            key={vendor.id} 
                            onClick={() => setSelectedVendor(vendor)}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          >
                            <td className="p-3.5 pl-6 font-semibold text-[#2485e8] group-hover:underline">
                              {vendor.name}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {vendor.company_name || '—'}
                            </td>
                            <td className="p-3.5 text-slate-500 font-mono text-[12px]">
                              {vendor.email || '—'}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {vendor.work_phone || '—'}
                            </td>
                            <td className="p-3.5">
                              {vendor.msme_registered ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-100">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {vendor.currency || 'INR- Indian Rupee'}
                            </td>
                            <td className="p-3.5 text-slate-600 font-medium">
                              {vendor.payment_terms || 'Due on Receipt'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </AnimatePresence>

      </div>

      {/* DRAWER / DETAILED MODAL OVERLAY */}
      <AnimatePresence>
        {selectedVendor && (
          <div className="fixed inset-0 bg-slate-900/40 z-50 flex justify-end">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setSelectedVendor(null)}></div>
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-w-2xl bg-white h-full relative shadow-2xl z-10 flex flex-col"
            >
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#2485e8]" />
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-800 leading-tight">
                      {selectedVendor.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-none mt-0.5 uppercase tracking-wider font-semibold">
                      {selectedVendor.vendor_type} Vendor Record
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedVendor(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[13px] text-slate-700">
                
                {/* Section A: Contact Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-850 pb-1 border-b border-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-slate-450">
                    <User className="w-4 h-4 text-slate-400" /> Primary Contact & Identity
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">Contact Person</span>
                      <span className="font-medium">
                        {`${selectedVendor.salutation || ''} ${selectedVendor.first_name || ''} ${selectedVendor.last_name || ''}`.trim() || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">Company Name</span>
                      <span className="font-medium">{selectedVendor.company_name || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">Email Address</span>
                      <span className="font-medium font-mono text-[12px] text-slate-600">{selectedVendor.email || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">Language</span>
                      <span className="font-medium">{selectedVendor.language || 'English'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">Work Phone</span>
                      <span className="font-medium">{selectedVendor.work_phone || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">Mobile</span>
                      <span className="font-medium">{selectedVendor.mobile || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Section B: Other details (PAN, MSME, TDS, Portal, etc) */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-850 pb-1 border-b border-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-slate-450">
                    <Settings className="w-4 h-4 text-slate-400" /> Tax & Finance Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">PAN</span>
                      <span className="font-mono tracking-wider font-semibold text-slate-800">{selectedVendor.pan || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">MSME Status</span>
                      <span className="font-medium">
                        {selectedVendor.msme_registered ? (
                          <span className="text-emerald-600 font-bold">Registered (MSME)</span>
                        ) : 'Not Registered'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">TDS Rate Group</span>
                      <span className="font-medium">{selectedVendor.tds || 'None'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">Currency</span>
                      <span className="font-medium">{selectedVendor.currency || 'INR- Indian Rupee'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">Payment Terms</span>
                      <span className="font-semibold text-blue-600">{selectedVendor.payment_terms || 'Due on Receipt'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[11px] uppercase font-semibold">Vendor Portal</span>
                      <span className="font-medium">{selectedVendor.enable_portal ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>

                {/* Section C: Bank details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-850 pb-1 border-b border-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-slate-450">
                    <Landmark className="w-4 h-4 text-slate-400" /> Settlement Bank Details
                  </h4>
                  {selectedVendor.bank_details ? (() => {
                    try {
                      const bank = JSON.parse(selectedVendor.bank_details);
                      if (!bank.holderName && !bank.accountNumber && !bank.bankName) {
                        return <p className="text-slate-400 italic">No bank account configured.</p>;
                      }
                      return (
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                          <div>
                            <span className="block text-slate-400 text-[11px] uppercase font-semibold">Account Holder</span>
                            <span className="font-medium">{bank.holderName || '—'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[11px] uppercase font-semibold">Account Number</span>
                            <span className="font-mono font-semibold">{bank.accountNumber || '—'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[11px] uppercase font-semibold">Bank Name</span>
                            <span className="font-medium">{bank.bankName || '—'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[11px] uppercase font-semibold font-mono">IFSC Code</span>
                            <span className="font-mono font-semibold uppercase">{bank.ifscCode || '—'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-slate-400 text-[11px] uppercase font-semibold">Branch Location</span>
                            <span className="font-medium">{bank.branchName || '—'}</span>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return <p className="text-slate-400 italic">No bank account configured.</p>;
                    }
                  })() : <p className="text-slate-400 italic">No bank account configured.</p>}
                </div>

                {/* Section D: Addresses */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-850 pb-1 border-b border-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-slate-450">
                    <MapPin className="w-4 h-4 text-slate-400" /> Addresses
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Billing Address View */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-150 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Building className="w-3 h-3" /> Billing Address
                      </span>
                      {selectedVendor.billing_address ? (() => {
                        try {
                          const bill = JSON.parse(selectedVendor.billing_address);
                          if (!bill.street && !bill.city && !bill.state) {
                            return <p className="text-slate-400 text-[12px] italic">Not supplied.</p>;
                          }
                          return (
                            <p className="text-[12px] text-slate-650 leading-relaxed font-sans">
                              {bill.attention && <strong className="block text-slate-800 mb-0.5">{bill.attention}</strong>}
                              {bill.street && <span className="block">{bill.street}</span>}
                              {bill.city && <span>{bill.city}</span>}{bill.state && <span>, {bill.state}</span>}
                              {bill.zip && <span className="block font-mono mt-0.5">PIN: {bill.zip}</span>}
                              {bill.country && <span className="block font-semibold text-slate-700 mt-0.5">{bill.country}</span>}
                              {bill.phone && <span className="block text-slate-500 font-mono text-[11px] mt-1">📞 {bill.phone}</span>}
                            </p>
                          );
                        } catch (e) {
                          return <p className="text-slate-400 text-[12px] italic">Not supplied.</p>;
                        }
                      })() : <p className="text-slate-400 text-[12px] italic">Not supplied.</p>}
                    </div>

                    {/* Shipping Address View */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-150 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Shipping Address
                      </span>
                      {selectedVendor.shipping_address ? (() => {
                        try {
                          const ship = JSON.parse(selectedVendor.shipping_address);
                          if (!ship.street && !ship.city && !ship.state) {
                            return <p className="text-slate-400 text-[12px] italic">Not supplied.</p>;
                          }
                          return (
                            <p className="text-[12px] text-slate-650 leading-relaxed font-sans">
                              {ship.attention && <strong className="block text-slate-800 mb-0.5">{ship.attention}</strong>}
                              {ship.street && <span className="block">{ship.street}</span>}
                              {ship.city && <span>{ship.city}</span>}{ship.state && <span>, {ship.state}</span>}
                              {ship.zip && <span className="block font-mono mt-0.5">PIN: {ship.zip}</span>}
                              {ship.country && <span className="block font-semibold text-slate-700 mt-0.5">{ship.country}</span>}
                              {ship.phone && <span className="block text-slate-500 font-mono text-[11px] mt-1">📞 {ship.phone}</span>}
                            </p>
                          );
                        } catch (e) {
                          return <p className="text-slate-400 text-[12px] italic">Not supplied.</p>;
                        }
                      })() : <p className="text-slate-400 text-[12px] italic">Not supplied.</p>}
                    </div>
                  </div>
                </div>

                {/* Section E: Contact Persons list */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-850 pb-1 border-b border-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-slate-450">
                    <User className="w-4 h-4 text-slate-400" /> Secondary Contacts
                  </h4>
                  {selectedVendor.contact_persons ? (() => {
                    try {
                      const contacts = JSON.parse(selectedVendor.contact_persons);
                      if (!Array.isArray(contacts) || contacts.length === 0) {
                        return <p className="text-slate-400 italic">No secondary contact persons added.</p>;
                      }
                      return (
                        <div className="space-y-2.5">
                          {contacts.map((contact: any, i: number) => (
                            <div key={i} className="flex justify-between items-start bg-slate-50 p-2.5 rounded border border-slate-100">
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {`${contact.salutation || ''} ${contact.firstName || ''} ${contact.lastName || ''}`.trim()}
                                </span>
                                {contact.email && <span className="text-slate-500 font-mono text-[12px] block">{contact.email}</span>}
                              </div>
                              <div className="text-right text-[12px] text-slate-600 font-mono">
                                {contact.workPhone && <span className="block">W: {contact.workPhone}</span>}
                                {contact.mobile && <span className="block">M: {contact.mobile}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    } catch (e) {
                      return <p className="text-slate-400 italic">No secondary contact persons added.</p>;
                    }
                  })() : <p className="text-slate-400 italic">No secondary contact persons added.</p>}
                </div>

                {/* Section F: Remarks */}
                {selectedVendor.remarks && (
                  <div className="space-y-1.5 bg-amber-50/50 p-3.5 rounded border border-amber-100">
                    <span className="text-[10px] font-bold uppercase text-amber-800 block">Internal Private Notes</span>
                    <p className="text-slate-600 italic leading-relaxed leading-normal">{selectedVendor.remarks}</p>
                  </div>
                )}

              </div>

              {/* Drawer Footer actions */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-right">
                <button 
                  onClick={() => setSelectedVendor(null)}
                  className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-5 py-2 rounded text-[13px] font-semibold cursor-pointer shadow-sm transition-all"
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
