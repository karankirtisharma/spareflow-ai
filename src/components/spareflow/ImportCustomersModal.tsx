import React, { useState, useRef } from 'react';
import { 
  X, Upload, FileText, AlertCircle, CheckCircle2, 
  ArrowRight, Sparkles, RefreshCw, Trash2, HelpCircle, Check, Info, FileSpreadsheet,
  ChevronDown, ChevronRight, HelpCircle as HelpIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImportCustomersModalProps {
  onClose: () => void;
  onImportComplete: () => void;
  addCustomer: (customer: any) => Promise<void>;
}

interface RawRow {
  rowId: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
  mappedValues: any;
}

export function ImportCustomersModal({ onClose, onImportComplete, addCustomer }: ImportCustomersModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dragActive, setDragActive] = useState(false);
  const [inputText, setInputText] = useState("");
  const [useType, setUseType] = useState<'csv' | 'json'>('csv');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');

  // Checkbox Options styled after Zoho's import settings
  const [autoGenCodes, setAutoGenCodes] = useState(true);
  const [mapAddresses, setMapAddresses] = useState(false);
  const [characterEncoding, setCharacterEncoding] = useState("UTF-8 (Unicode)");

  // Parsed records state
  const [records, setRecords] = useState<RawRow[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [errorsList, setErrorsList] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalization maps
  const keyMapping: Record<string, string> = {
    'displayname': 'display_name',
    'display_name': 'display_name',
    'customer display name': 'display_name',
    'customer name': 'display_name',
    'name': 'display_name',
    'fullname': 'display_name',
    'full name': 'display_name',

    'customer_type': 'customer_type',
    'customertype': 'customer_type',
    'customer type': 'customer_type',
    'type': 'customer_type',

    'salutation': 'primary_contact_salutation',
    'primary_contact_salutation': 'primary_contact_salutation',
    'title': 'primary_contact_salutation',

    'first_name': 'primary_contact_first_name',
    'firstname': 'primary_contact_first_name',
    'first name': 'primary_contact_first_name',

    'last_name': 'primary_contact_last_name',
    'lastname': 'primary_contact_last_name',
    'last name': 'primary_contact_last_name',

    'company_name': 'company_name',
    'companyname': 'company_name',
    'company name': 'company_name',
    'company': 'company_name',

    'email': 'email',
    'email_address': 'email',
    'emailaddress': 'email',
    'email address': 'email',

    'work_phone': 'work_phone',
    'workphone': 'work_phone',
    'work phone': 'work_phone',
    'phone': 'work_phone',

    'mobile': 'mobile',
    'mobile_phone': 'mobile',
    'mobilephone': 'mobile',
    'mobile phone': 'mobile',

    'language': 'language',
    'pan': 'pan',
    'pan_number': 'pan',
    'pan number': 'pan',
    'currency': 'currency',

    'payment_terms': 'payment_terms',
    'paymentterms': 'payment_terms',
    'payment terms': 'payment_terms',
    'payment_term': 'payment_terms',

    'enable_portal': 'enable_portal',
    'enableportal': 'enable_portal',
    'enable portal': 'enable_portal',
    'portal': 'enable_portal'
  };

  // Pre-built Zoho-like sample dataset for easy testing
  const sampleCSV = `Customer Name,Customer Type,Company Name,Email Address,Work Phone,Mobile,Language,PAN,Currency,Payment Terms,Enable Portal
Royal Auto Tech,Business,Royal Auto Tech Ltd,procurement@royalautotech.com,022-2524141,9819123456,English,AAACR1234F,INR- Indian Rupee,Net 30,true
Apex Fleet Services,Business,Apex Fleet Logistics Inc,fleet@apexfleet.id,+62-21-44521,62812345678,Bahasa Indonesia,,IDR- Indonesian Rupiah,Due on Receipt,false
John Reynolds,Individual,,john.reynolds@gmail.com,,+1-555-0199,English,,USD- US Dollar,Net 15,true
Precision Tune Care,Business,Precision Tune Care,service@precisiontune.co.in,+91-44-24151,9176123456,English,AAYCP9876Z,INR- Indian Rupee,Net 45,false
Siti Aminah,Individual,,siti.aminah@yahoo.com,,08139876543,English,,INR- Indian Rupee,Due on Receipt,false`;

  const sampleJSON = `[
  {
    "displayName": "Global Spark Plugs Ltd",
    "customerType": "Business",
    "companyName": "Global Spark Plugs",
    "email": "purchasing@globalspark.com",
    "mobile": "0987654321",
    "language": "English",
    "currency": "EUR- Euro",
    "paymentTerms": "Due on Receipt"
  },
  {
    "displayName": "Alex Cooper",
    "customerType": "Individual",
    "salutation": "Mr.",
    "firstName": "Alex",
    "lastName": "Cooper",
    "email": "alex.cooper@outlook.com",
    "mobile": "+44 7911 123456"
  }
]`;

  const loadSampleData = (type: 'csv' | 'json') => {
    setParseError(null);
    if (type === 'csv') {
      setUseType('csv');
      setInputText(sampleCSV);
      setFileName("spareflow_sample_customers.csv");
    } else {
      setUseType('json');
      setInputText(sampleJSON);
      setFileName("spareflow_sample_customers.json");
    }
    // Switch to paste tab if they load sample to let them see and customize it
    setImportMethod('paste');
  };

  // Simple CSV parser
  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    if (headers.length === 0 || !headers[0]) return [];

    const list: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const item: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) {
          let val = values[idx] || '';
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          }
          item[h] = val;
        }
      });
      list.push(item);
    }
    return list;
  }

  // Parse JSON or CSV on user submission of step 1
  const handleProcessInput = () => {
    setParseError(null);
    let parsedRows: Record<string, string>[] = [];

    const sourceText = importMethod === 'paste' ? inputText : inputText;

    if (!sourceText.trim()) {
      setParseError("Please choose a file to import, or paste raw data under the Paste tab.");
      return;
    }

    try {
      if (useType === 'json') {
        const parsed = JSON.parse(sourceText);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON must be a list of customer objects.");
        }
        parsedRows = parsed.map((item: any) => {
          const rowObj: Record<string, string> = {};
          Object.keys(item).forEach(k => {
            rowObj[k.toLowerCase()] = String(item[k] ?? '');
          });
          return rowObj;
        });
      } else {
        parsedRows = parseCSV(sourceText);
      }

      if (parsedRows.length === 0) {
        throw new Error("No data found. Ensure headers and at least 1 record exist.");
      }

      // Map parsedRows to structured RawRows with validation
      const mappedRows: RawRow[] = parsedRows.map((raw, index) => {
        const mappedValues: any = {
          customer_type: 'Business',
          primary_contact_salutation: 'Mr.',
          primary_contact_first_name: '',
          primary_contact_last_name: '',
          company_name: '',
          display_name: '',
          email: '',
          work_phone: '',
          mobile: '',
          language: 'English',
          pan: '',
          currency: 'INR- Indian Rupee',
          payment_terms: 'Due on Receipt',
          enable_portal: false
        };

        // Go through keys in raw row and map using keyMapping
        Object.keys(raw).forEach(rawKey => {
          const val = raw[rawKey]?.trim() || '';
          const cleanKey = rawKey.toLowerCase().trim();
          const mappedKey = keyMapping[cleanKey];

          if (mappedKey) {
            if (mappedKey === 'enable_portal') {
              mappedValues[mappedKey] = val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
            } else {
              mappedValues[mappedKey] = val;
            }
          }
        });

        // Auto-generation or custom recovery
        if (!mappedValues.display_name) {
          if (mappedValues.company_name) {
            mappedValues.display_name = mappedValues.company_name;
          } else if (mappedValues.primary_contact_first_name) {
            const prefix = mappedValues.primary_contact_salutation ? mappedValues.primary_contact_salutation + ' ' : '';
            mappedValues.display_name = `${prefix}${mappedValues.primary_contact_first_name} ${mappedValues.primary_contact_last_name}`.trim();
          }
        }

        const errors: string[] = [];
        if (!mappedValues.display_name) {
          errors.push("Missing 'Customer Display Name' (unable to determine name/company)");
        }
        if (mappedValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedValues.email)) {
          errors.push(`Invalid email pattern: "${mappedValues.email}"`);
        }

        return {
          rowId: index + 1,
          data: raw,
          isValid: errors.length === 0,
          errors,
          mappedValues
        };
      });

      setRecords(mappedRows);
      setStep(2);
    } catch (e: any) {
      setParseError(e?.message || "Failed to parse data. Verify the file format or syntax.");
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePickedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePickedFile(e.target.files[0]);
    }
  };

  const handlePickedFile = (file: File) => {
    setParseError(null);
    setFileName(file.name);
    const isJson = file.name.endsWith('.json') || file.type === "application/json";
    setUseType(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text || "");
    };
    reader.readAsText(file);
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleToggleRowSelection = (id: number) => {
    setRecords(prev => prev.map(r => {
      if (r.rowId === id) {
        return { ...r, isValid: !r.isValid };
      }
      return r;
    }));
  };

  // Process the real import sequentially
  const handleExecuteImport = async () => {
    const selectedRecords = records.filter(r => r.isValid);
    if (selectedRecords.length === 0) {
      alert("No valid rows selected for import.");
      return;
    }

    setIsImporting(true);
    setStep(3);
    setImportProgress({
      current: 0,
      total: selectedRecords.length,
      successes: 0,
      failures: 0
    });
    setErrorsList([]);

    const failedRows: string[] = [];
    let processed = 0;
    let successCount = 0;
    let failCount = 0;

    for (const record of selectedRecords) {
      try {
        await addCustomer(record.mappedValues);
        successCount++;
        processed++;
        setImportProgress(prev => ({
          ...prev,
          current: processed,
          successes: successCount
        }));
      } catch (err: any) {
        failCount++;
        processed++;
        const errMsg = `Row ${record.rowId} ("${record.mappedValues.display_name}"): ${err?.message || "Internal error"}`;
        failedRows.push(errMsg);
        setErrorsList(prev => [...prev, errMsg]);
        setImportProgress(prev => ({
          ...prev,
          current: processed,
          failures: failCount
        }));
      }
      await new Promise(r => setTimeout(r, 120));
    }

    setIsImporting(false);
  };

  const handleCompleteAll = () => {
    onImportComplete();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center bg-slate-900/40 backdrop-blur-xs font-sans p-4 md:p-6">
      
      {/* Outer Card block mimicking the full-screen/pane experience in Image 4 */}
      <div className="bg-white rounded-[6px] shadow-2xl border border-slate-300 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden max-h-[820px] animate-in fade-in duration-150">
        
        {/* Header bar styled exactly like Zoho Inventory */}
        <div className="flex flex-col items-center justify-between px-6 py-4 border-b border-slate-200 relative shrink-0">
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-6 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
            id="import-close-btn"
          >
            <X className="w-5 h-5 stroke-[2.5px]" />
          </button>

          {/* Centered Title */}
          <div className="text-center">
            <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">
              {step === 1 ? 'Customers - Select File' : step === 2 ? 'Customers - Map Fields' : 'Customers - Import Status'}
            </h3>
          </div>

          {/* Centered Stepper - Pixel-perfect match with Image 4 */}
          <div className="flex items-center gap-2 mt-3 select-none text-[12.5px] font-semibold text-slate-500">
            {/* Step 1 */}
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 1 
                  ? 'bg-[#2485e8] text-white' 
                  : 'border border-slate-300 text-slate-400 bg-white'
              }`}>
                1
              </span>
              <span className={step === 1 ? 'text-[#2485e8] font-bold' : 'text-slate-600'}>Configure</span>
            </div>

            {/* Line 1 */}
            <div className={`w-16 h-[1.5px] ${step >= 2 ? 'bg-[#2485e8]' : 'bg-slate-250'}`} />

            {/* Step 2 */}
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 2 
                  ? 'bg-[#2485e8] text-white' 
                  : 'border border-slate-300 text-slate-400 bg-white'
              }`}>
                2
              </span>
              <span className={step === 2 ? 'text-[#2485e8] font-bold' : step > 2 ? 'text-slate-600' : 'text-slate-400'}>Map Fields</span>
            </div>

            {/* Line 2 */}
            <div className={`w-16 h-[1.5px] ${step >= 3 ? 'bg-[#2485e8]' : 'bg-slate-250'}`} />

            {/* Step 3 */}
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 3 
                  ? 'bg-[#2485e8] text-white' 
                  : 'border border-slate-300 text-slate-400 bg-white'
              }`}>
                3
              </span>
              <span className={step === 3 ? 'text-[#2485e8] font-bold' : 'text-slate-400'}>Preview & Status</span>
            </div>
          </div>

        </div>

        {/* Tab switcher for file upload vs pasting text to keep UI extremely clean */}
        {step === 1 && (
          <div className="flex bg-slate-50 border-b border-slate-200 px-6 shrink-0">
            <button 
              onClick={() => setImportMethod('file')}
              className={`py-2 px-4 text-[13px] font-bold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                importMethod === 'file' 
                  ? 'border-[#2485e8] text-[#2485e8] bg-white border-t border-x border-slate-200 rounded-t-[4px] font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-850'
              }`}
            >
              Upload Local File
            </button>
            <button 
              onClick={() => setImportMethod('paste')}
              className={`py-2 px-4 text-[13px] font-bold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                importMethod === 'paste' 
                  ? 'border-[#2485e8] text-[#2485e8] bg-white border-t border-x border-slate-200 rounded-t-[4px] font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-850'
              }`}
            >
              Paste Raw CSV/JSON
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CONFIGURE & UPLOAD */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                
                {importMethod === 'file' ? (
                  /* File Dropzone exactly matching Image 4 */
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all min-h-[220px] bg-slate-50/20 select-none ${
                      dragActive ? 'border-blue-500 bg-blue-50/40' : 'border-slate-300 hover:border-slate-450'
                    }`}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv,.json"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Zoho style circular cloud upload icon */}
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-2xs mb-4">
                      <Upload className="w-5 h-5 text-slate-500" />
                    </div>

                    <p className="text-[14.5px] font-bold text-slate-850 mb-4">
                      {fileName ? `Selected: ${fileName}` : "Drag and drop file to import"}
                    </p>

                    {/* Zoho split blue button for Choose File */}
                    <div className="flex items-stretch shadow-2xs rounded-[4px] overflow-hidden mb-4">
                      <button 
                        type="button"
                        onClick={handleTriggerFileInput}
                        className="bg-[#2485e8] hover:bg-[#1a74d4] text-white text-[13px] font-bold px-4 py-1.5 transition-colors border-r border-blue-600/30 cursor-pointer"
                      >
                        Choose File
                      </button>
                      <button 
                        type="button"
                        onClick={handleTriggerFileInput}
                        className="bg-[#2485e8] hover:bg-[#1a74d4] text-white px-2.5 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4 text-white/90" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-450">
                      Maximum File Size: 10 MB • File Format: CSV or JSON
                    </p>
                  </div>
                ) : (
                  /* Manual Paste Area */
                  <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/30 flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#2485e8]" /> Paste Data Content
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 cursor-pointer">
                          <input 
                            type="radio" 
                            name="format-choice" 
                            checked={useType === 'csv'} 
                            onChange={() => setUseType('csv')}
                            className="text-[#2485e8] focus:ring-[#2485e8] w-3 h-3"
                          />
                          CSV format
                        </label>
                        <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 cursor-pointer">
                          <input 
                            type="radio" 
                            name="format-choice" 
                            checked={useType === 'json'} 
                            onChange={() => setUseType('json')}
                            className="text-[#2485e8] focus:ring-[#2485e8] w-3 h-3"
                          />
                          JSON format
                        </label>
                      </div>
                    </div>

                    <textarea 
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        setFileName(null);
                      }}
                      placeholder={
                        useType === 'json' 
                        ? '[\n  {\n    "displayName": "Apex Fleet Services",\n    "companyName": "Apex Fleet Logistics Inc",\n    "email": "fleet@apexfleet.id"\n  }\n]'
                        : 'Customer Name,Company Name,Email Address\nABC Motors,ABC Motors Ltd,service@abcmotors.com\nPioneer Spares,Pioneer Spares,parts@pioneerparts.in'
                      }
                      className="w-full h-[180px] text-[12px] font-mono p-3 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-500 text-slate-800 leading-relaxed"
                    />

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Paste headers and values accurately. No quotes required around normal text.</span>
                      <button 
                        type="button"
                        onClick={() => setInputText("")}
                        className="text-red-500 hover:text-red-700 font-bold transition-colors"
                      >
                        Clear Text
                      </button>
                    </div>
                  </div>
                )}

                {/* Zoho sample dataset download bar */}
                <div className="text-[12.5px] text-slate-600 border border-dashed border-slate-200 rounded-[5px] p-3 bg-slate-50/50 flex items-center gap-1.5">
                  <span className="shrink-0 text-amber-500 font-bold">ℹ️</span>
                  <span>
                    Download a{' '}
                    <button 
                      type="button" 
                      onClick={() => loadSampleData('csv')}
                      className="text-blue-600 hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
                    >
                      sample csv file
                    </button>
                    {' '}or{' '}
                    <button 
                      type="button" 
                      onClick={() => loadSampleData('json')}
                      className="text-blue-600 hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
                    >
                      sample json file
                    </button>
                    {' '}and compare it to your import file to ensure you have the file perfect for the import.
                  </span>
                </div>

                {/* Character Encoding selector exactly matching Zoho screen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
                  <div className="flex items-center gap-1 text-[13.5px] font-semibold text-slate-700">
                    Character Encoding
                    <span className="text-slate-400 cursor-help" title="UTF-8 is recommended for global language characters support.">
                      ❓
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <select 
                      value={characterEncoding}
                      onChange={(e) => setCharacterEncoding(e.target.value)}
                      className="bg-white border border-slate-300 text-[13px] text-slate-800 rounded px-3 py-1.5 focus:border-[#2485e8] focus:outline-none w-full max-w-sm cursor-pointer shadow-3xs"
                    >
                      <option value="UTF-8 (Unicode)">UTF-8 (Unicode)</option>
                      <option value="ISO-8859-1 (Latin-1)">ISO-8859-1 (Western European)</option>
                      <option value="UTF-16 (Unicode)">UTF-16 (Unicode)</option>
                      <option value="US-ASCII">US-ASCII</option>
                    </select>
                  </div>
                </div>

                {/* Zoho checkboxes with descriptions */}
                <div className="space-y-4 pt-3 border-t border-slate-150">
                  
                  {/* Checkbox 1 */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={autoGenCodes}
                      onChange={(e) => setAutoGenCodes(e.target.checked)}
                      className="rounded border-slate-300 text-[#2485e8] focus:ring-[#2485e8] mt-1 cursor-pointer w-4 h-4"
                    />
                    <div>
                      <span className="block text-[13px] font-bold text-slate-750 group-hover:text-slate-900 transition-colors">
                        Auto-Generate Customer Codes
                      </span>
                      <span className="block text-[11.5px] text-slate-450 leading-relaxed mt-0.5">
                        Customer codes will be generated automatically according to your organization settings. Any Customer codes listed inside the import file will be ignored.
                      </span>
                    </div>
                  </label>

                  {/* Checkbox 2 */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={mapAddresses}
                      onChange={(e) => setMapAddresses(e.target.checked)}
                      className="rounded border-slate-300 text-[#2485e8] focus:ring-[#2485e8] mt-1 cursor-pointer w-4 h-4"
                    />
                    <div>
                      <span className="block text-[13px] font-bold text-slate-750 group-hover:text-slate-900 transition-colors">
                        Map the customers' addresses in the import file to their customer record
                      </span>
                      <span className="block text-[11.5px] text-slate-450 leading-relaxed mt-0.5">
                        If you enable this option, your customer's name from the import file will be used to check if the same customer already exists. If the customer exists, the address from the import file will be updated.
                      </span>
                    </div>
                  </label>

                </div>

                {parseError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}

              </motion.div>
            )}

            {/* STEP 2: COLUMN MAP FIELDS & ROW PREVIEW */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                
                {/* Info summary banner */}
                <div className="bg-[#e9f4ff] border border-blue-200 p-3 rounded-lg flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2.5 text-blue-800">
                    <Info className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                    <span>
                      Successfully mapped columns. We detected <strong>{records.length} customers</strong> ready to be uploaded. Review rows below before executing.
                    </span>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setRecords([]);
                    }}
                    className="text-[11px] font-bold bg-white text-[#2485e8] hover:bg-slate-50 px-3 py-1 rounded border border-slate-200 shadow-3xs transition-colors cursor-pointer"
                  >
                    Change File
                  </button>
                </div>

                {/* Table list preview */}
                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[380px]">
                    
                    <table className="w-full text-left border-collapse whitespace-nowrap text-[12.5px]">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 select-none">
                        <tr className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4 w-12 text-center">Import?</th>
                          <th className="py-3 px-4">Display Name</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Email Address</th>
                          <th className="py-3 px-4">Company Name</th>
                          <th className="py-3 px-4">Contact Phone</th>
                          <th className="py-3 px-4">Payment Terms</th>
                        </tr>
                      </thead>
                      
                      <tbody className="divide-y divide-slate-100">
                        {records.map((r) => {
                          const val = r.mappedValues;
                          return (
                            <tr 
                              key={r.rowId}
                              className={`hover:bg-slate-50/60 transition-colors ${!r.isValid ? 'bg-red-50/20' : ''}`}
                            >
                              <td className="py-3 px-4 text-center">
                                <input 
                                  type="checkbox"
                                  checked={r.isValid}
                                  onChange={() => handleToggleRowSelection(r.rowId)}
                                  className="rounded border-slate-300 text-[#2485e8] focus:ring-[#2485e8] cursor-pointer"
                                />
                              </td>

                              <td className="py-3 px-4">
                                <div className="space-y-0.5">
                                  {val.display_name ? (
                                    <span className="font-bold text-slate-800">{val.display_name}</span>
                                  ) : (
                                    <span className="text-red-500 italic font-semibold flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5" /> Missing Name
                                    </span>
                                  )}
                                  {r.errors.length > 0 && (
                                    <p className="text-[10px] text-red-600 font-medium">{r.errors[0]}</p>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider ${
                                  val.customer_type === 'Business' ? 'bg-[#e9f4ff] text-blue-600' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {val.customer_type}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-slate-600 font-mono text-[11.5px]">
                                {val.email || <span className="text-slate-350">—</span>}
                              </td>

                              <td className="py-3 px-4 text-slate-550 font-medium">
                                {val.company_name || <span className="text-slate-300 italic">Individual</span>}
                              </td>

                              <td className="py-3 px-4 font-mono text-[11.5px] text-slate-650">
                                {val.mobile || val.work_phone || <span className="text-slate-350">—</span>}
                              </td>

                              <td className="py-3 px-4 text-slate-500 font-medium">
                                {val.payment_terms || 'Due on Receipt'}
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                  </div>
                </div>

                {/* Import Selection count metrics bar */}
                <div className="flex items-center justify-between text-[12px] text-slate-500 select-none font-medium px-1">
                  <div className="flex items-center gap-4">
                    <span>
                      Clean Profiles: <strong className="text-emerald-600 font-bold">{records.filter(r => r.errors.length === 0).length}</strong>
                    </span>
                    <span>
                      Fixable Alerts: <strong className="text-amber-600 font-bold">{records.filter(r => r.errors.length > 0).length}</strong>
                    </span>
                  </div>
                  <span>
                    Selected for Import: <strong className="text-[#2485e8] font-bold">{records.filter(r => r.isValid).length} of {records.length}</strong>
                  </span>
                </div>

              </motion.div>
            )}

            {/* STEP 3: EXECUTING SAVE PROGRESS */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6 flex flex-col items-center justify-center py-8"
              >
                
                {/* Circular Loader */}
                <div className="relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-[#2485e8] animate-spin"></div>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-[19px] font-extrabold text-slate-800">
                      {Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%
                    </span>
                    <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">Progress</span>
                  </div>
                </div>

                <div className="text-center space-y-1.5 max-w-md">
                  <h4 className="text-[16px] font-bold text-slate-800">
                    {isImporting ? "Adding customer profiles..." : "Customers Imported Successfully!"}
                  </h4>
                  <p className="text-[12px] text-slate-450">
                    {isImporting ? "Saving records securely. Please don't close this modal." : "The import has finished. Check the summary log list below."}
                  </p>
                </div>

                {/* Progress bar metrics details */}
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
                  
                  <div className="flex items-center justify-between text-[12.5px] text-slate-600 font-bold border-b border-slate-100 pb-2 w-full">
                    <span>Summary Logs</span>
                    <span className="font-mono">{importProgress.current} / {importProgress.total}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    
                    <div className="bg-emerald-50 rounded p-3 border border-emerald-150">
                      <span className="block text-[11px] uppercase font-bold text-[#10b981] tracking-wider">Success</span>
                      <strong className="text-[20px] text-emerald-700 font-extrabold block mt-0.5">{importProgress.successes}</strong>
                    </div>

                    <div className="bg-red-50 rounded p-3 border border-red-150">
                      <span className="block text-[11px] uppercase font-bold text-red-500 tracking-wider">Failed</span>
                      <strong className="text-[20px] text-red-700 font-extrabold block mt-0.5">{importProgress.failures}</strong>
                    </div>

                  </div>

                </div>

                {errorsList.length > 0 && (
                  <div className="w-full max-w-md bg-red-50/50 border border-red-100 rounded-lg p-3 text-[11.5px] text-red-700 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Failed Rows Information:
                    </p>
                    <div className="max-h-24 overflow-y-auto font-mono text-[10.5px] space-y-0.5">
                      {errorsList.map((err, i) => (
                        <p key={i}>• {err}</p>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Footer controls matches exact bottom alignment in Image 4 */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-600 border border-slate-300 hover:bg-slate-100 px-4 py-1.5 rounded bg-white text-[13px] font-bold shadow-3xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {step === 1 && (
              <button 
                type="button"
                onClick={handleProcessInput}
                className="bg-[#2485e8] hover:bg-[#1a74d4] text-white font-bold text-[13px] px-5 py-1.5 rounded shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                id="import-next-btn"
              >
                Next <ChevronRight className="w-4 h-4 stroke-[2.5px]" />
              </button>
            )}

            {step === 2 && (
              <button 
                type="button"
                onClick={handleExecuteImport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] px-5 py-1.5 rounded shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Import Selected ({records.filter(r => r.isValid).length})
              </button>
            )}

            {step === 3 && (
              <button 
                type="button"
                disabled={isImporting}
                onClick={handleCompleteAll}
                className="bg-[#2485e8] hover:bg-[#1a74d4] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-[13px] px-5 py-1.5 rounded shadow-2xs transition-colors cursor-pointer"
              >
                Close & View Customers
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

