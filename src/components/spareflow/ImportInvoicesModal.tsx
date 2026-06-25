import React, { useState, useRef } from 'react';
import { 
  X, Upload, FileText, AlertCircle, CheckCircle2, 
  ArrowRight, Sparkles, RefreshCw, Trash2, HelpCircle, Check, Info, FileSpreadsheet,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventoryStore } from '../../stores/inventoryStore.js';

interface ImportInvoicesModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface RawRow {
  rowId: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
  mappedValues: any;
}

export function ImportInvoicesModal({ onClose, onImportComplete }: ImportInvoicesModalProps) {
  const { items: productsList, customers, addInvoice } = useInventoryStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dragActive, setDragActive] = useState(false);
  const [inputText, setInputText] = useState("");
  const [useType, setUseType] = useState<'csv' | 'json'>('csv');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');

  // Options styled after Zoho's import settings
  const [autoGenInv, setAutoGenInv] = useState(false);
  const [linkSalesOrders, setLinkSalesOrders] = useState(true);
  const [characterEncoding, setCharacterEncoding] = useState("UTF-8 (Unicode)");

  // Parsed records state
  const [records, setRecords] = useState<RawRow[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [errorsList, setErrorsList] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalization maps
  const keyMapping: Record<string, string> = {
    'invoice number': 'invoice_number',
    'invoice_number': 'invoice_number',
    'invoice#': 'invoice_number',
    'invoiceno': 'invoice_number',
    'invoice no': 'invoice_number',

    'customer name': 'customer_name',
    'customer_name': 'customer_name',
    'customer': 'customer_name',

    'order number': 'order_number',
    'order_number': 'order_number',
    'sales order': 'order_number',
    'so_number': 'order_number',

    'invoice date': 'invoice_date',
    'invoice_date': 'invoice_date',
    'date': 'invoice_date',

    'terms': 'terms',
    'payment terms': 'terms',
    'payment_terms': 'terms',

    'due date': 'due_date',
    'due_date': 'due_date',

    'salesperson': 'salesperson',
    'sales person': 'salesperson',

    'subject': 'subject',
    'description': 'subject',

    'status': 'status',

    'total': 'total',
    'amount': 'total',

    'discount': 'discount',
    'discount type': 'discount_type',
    'tax type': 'tax_type',
    'tax name': 'tax_name',
    'adjustment': 'adjustment',
    'customer notes': 'customer_notes',
    'terms conditions': 'terms_conditions'
  };

  const sampleCSV = `Invoice Number,Customer Name,Invoice Date,Terms,Due Date,Total,Salesperson,Subject
INV-2026-001,Royal Auto Tech,2026-06-24,Net 30,2026-07-24,3500.00,John Doe,Brake pads supply
INV-2026-002,Apex Fleet Services,2026-06-24,Due on Receipt,2026-06-24,12000.00,Jane Smith,Clutch kit installation
INV-2026-003,John Reynolds,2026-06-23,Net 15,2026-07-08,850.00,,General maintenance`;

  const sampleJSON = `[
  {
    "invoice_number": "INV-2026-004",
    "customer_name": "ABC Motors",
    "invoice_date": "2026-06-24",
    "terms": "Due on Receipt",
    "total": "4500.00",
    "subject": "Brake repairs"
  },
  {
    "invoice_number": "INV-2026-005",
    "customer_name": "Pioneer Garage",
    "invoice_date": "2026-06-24",
    "terms": "Net 30",
    "total": "7200.00",
    "subject": "Imported parts delivery"
  }
]`;

  const loadSampleData = (type: 'csv' | 'json') => {
    setParseError(null);
    if (type === 'csv') {
      setUseType('csv');
      setInputText(sampleCSV);
      setFileName("spareflow_sample_invoices.csv");
    } else {
      setUseType('json');
      setInputText(sampleJSON);
      setFileName("spareflow_sample_invoices.json");
    }
    setImportMethod('paste');
  };

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

  const handleProcessInput = () => {
    setParseError(null);
    let parsedRows: Record<string, string>[] = [];
    const sourceText = inputText;

    if (!sourceText.trim()) {
      setParseError("Please choose a file to import, or paste raw data under the Paste tab.");
      return;
    }

    try {
      if (useType === 'json') {
        const parsed = JSON.parse(sourceText);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON must be a list of invoice objects.");
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

      const mappedRows: RawRow[] = parsedRows.map((raw, index) => {
        const mappedValues: any = {
          invoice_number: '',
          customer_id: '',
          customer_name: 'General Customer',
          order_number: '',
          invoice_date: new Date().toISOString().split("T")[0],
          terms: 'Due on Receipt',
          due_date: '',
          salesperson: '',
          subject: '',
          status: 'unpaid',
          total: 0,
          discount: 0,
          discount_type: '%',
          tax_type: 'TDS',
          tax_name: 'None',
          adjustment: 0,
          customer_notes: '',
          terms_conditions: '',
          items: []
        };

        // Go through keys in raw row and map using keyMapping
        Object.keys(raw).forEach(rawKey => {
          const val = raw[rawKey]?.trim() || '';
          const cleanKey = rawKey.toLowerCase().trim();
          const mappedKey = keyMapping[cleanKey];

          if (mappedKey) {
            mappedValues[mappedKey] = val;
          }
        });

        // Auto-generation or custom recovery for Invoice Number
        if (autoGenInv || !mappedValues.invoice_number) {
          mappedValues.invoice_number = `INV-GEN-${1000 + index + Date.now() % 10000}`;
        }

        // Try matching Customer Name with existing customers
        if (mappedValues.customer_name) {
          const matchedCust = customers.find(c => 
            c.name?.toLowerCase() === mappedValues.customer_name.toLowerCase() ||
            c.company_name?.toLowerCase() === mappedValues.customer_name.toLowerCase()
          );
          if (matchedCust) {
            mappedValues.customer_id = matchedCust.id;
            mappedValues.customer_name = matchedCust.name;
          } else {
            // Assign default or first customer
            if (customers.length > 0) {
              mappedValues.customer_id = customers[0].id;
              mappedValues.customer_name = customers[0].name;
            }
          }
        } else if (customers.length > 0) {
          mappedValues.customer_id = customers[0].id;
          mappedValues.customer_name = customers[0].name;
        }

        // Assign default line item (product)
        const defaultProduct = productsList.length > 0 ? productsList[0] : { id: '1', sales_price: 100 };
        const qtyVal = 1;
        const totalNum = parseFloat(mappedValues.total) || 0;
        const rateVal = totalNum > 0 ? totalNum : (parseFloat(String(defaultProduct.sales_price)) || 100);

        mappedValues.total = totalNum > 0 ? totalNum : rateVal;
        mappedValues.items = [{
          productId: Number(defaultProduct.id),
          qty: qtyVal,
          rate: rateVal
        }];

        if (!mappedValues.due_date) {
          mappedValues.due_date = mappedValues.invoice_date;
        }

        const errors: string[] = [];
        if (!mappedValues.invoice_number) {
          errors.push("Missing 'Invoice Number'");
        }
        if (isNaN(parseFloat(String(mappedValues.total)))) {
          errors.push(`Invalid Total amount: "${mappedValues.total}"`);
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
        await addInvoice(record.mappedValues);
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
        const errMsg = `Row ${record.rowId} ("${record.mappedValues.invoice_number}"): ${err?.message || "Internal error"}`;
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
      
      <div className="bg-white rounded-[6px] shadow-2xl border border-slate-300 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden max-h-[820px] animate-in fade-in duration-150">
        
        {/* Stepper Header */}
        <div className="flex flex-col items-center justify-between px-6 py-4 border-b border-slate-200 relative shrink-0">
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-6 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
            id="import-close-btn"
          >
            <X className="w-5 h-5 stroke-[2.5px]" />
          </button>

          <div className="text-center">
            <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">
              {step === 1 ? 'Invoices - Select File' : step === 2 ? 'Invoices - Map Fields' : 'Invoices - Import Status'}
            </h3>
          </div>

          <div className="flex items-center gap-2 mt-3 select-none text-[12.5px] font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 1 ? 'bg-[#2485e8] text-white' : 'border border-slate-300 text-slate-400 bg-white'
              }`}>
                1
              </span>
              <span className={step === 1 ? 'text-[#2485e8] font-bold' : 'text-slate-600'}>Configure</span>
            </div>

            <div className={`w-16 h-[1.5px] ${step >= 2 ? 'bg-[#2485e8]' : 'bg-slate-250'}`} />

            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 2 ? 'bg-[#2485e8] text-white' : 'border border-slate-300 text-slate-400 bg-white'
              }`}>
                2
              </span>
              <span className={step === 2 ? 'text-[#2485e8] font-bold' : step > 2 ? 'text-slate-600' : 'text-slate-400'}>Map Fields</span>
            </div>

            <div className={`w-16 h-[1.5px] ${step >= 3 ? 'bg-[#2485e8]' : 'bg-slate-250'}`} />

            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 3 ? 'bg-[#2485e8] text-white' : 'border border-slate-300 text-slate-400 bg-white'
              }`}>
                3
              </span>
              <span className={step === 3 ? 'text-[#2485e8] font-bold' : 'text-slate-400'}>Preview & Status</span>
            </div>
          </div>

        </div>

        {/* Tab switcher */}
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
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                {importMethod === 'file' ? (
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

                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-2xs mb-4">
                      <Upload className="w-5 h-5 text-slate-500" />
                    </div>

                    <p className="text-[14.5px] font-bold text-slate-850 mb-4">
                      {fileName ? `Selected: ${fileName}` : "Drag and drop file to import"}
                    </p>

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
                        ? '[\n  {\n    "invoice_number": "INV-2026-001",\n    "customer_name": "Royal Auto Tech",\n    "total": "3500.00"\n  }\n]'
                        : 'Invoice Number,Customer Name,Invoice Date,Terms,Due Date,Total\nINV-2026-001,Royal Auto Tech,2026-06-24,Net 30,2026-07-24,3500.00'
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
                    {' '}and compare it to your import file to ensure format compatibility.
                  </span>
                </div>

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

                <div className="space-y-4 pt-3 border-t border-slate-150">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={autoGenInv}
                      onChange={(e) => setAutoGenInv(e.target.checked)}
                      className="rounded border-slate-300 text-[#2485e8] focus:ring-[#2485e8] mt-1 cursor-pointer w-4 h-4"
                    />
                    <div>
                      <span className="block text-[13px] font-bold text-slate-750 group-hover:text-slate-900 transition-colors">
                        Auto-Generate Invoice Numbers
                      </span>
                      <span className="block text-[11.5px] text-slate-450 leading-relaxed mt-0.5">
                        Invoice numbers will be generated automatically according to your organization settings. Any Invoice numbers listed inside the import file will be ignored.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={linkSalesOrders}
                      onChange={(e) => setLinkSalesOrders(e.target.checked)}
                      className="rounded border-slate-300 text-[#2485e8] focus:ring-[#2485e8] mt-1 cursor-pointer w-4 h-4"
                    />
                    <div>
                      <span className="block text-[13px] font-bold text-slate-750 group-hover:text-slate-900 transition-colors">
                        Link Invoices to corresponding Sales Orders
                      </span>
                      <span className="block text-[11.5px] text-slate-450 leading-relaxed mt-0.5">
                        If you enable this option, we will match the Order Number listed in the import file to any active Sales Order within the system.
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

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="bg-[#e9f4ff] border border-blue-200 p-3 rounded-lg flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2.5 text-blue-800">
                    <Info className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                    <span>
                      Successfully mapped columns. We detected <strong>{records.length} invoices</strong> ready to be uploaded. Review rows below before executing.
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

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap text-[12.5px]">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 select-none">
                        <tr className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4 w-12 text-center">Import?</th>
                          <th className="py-3 px-4">Invoice Number</th>
                          <th className="py-3 px-4">Customer Name</th>
                          <th className="py-3 px-4">Invoice Date</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Salesperson</th>
                          <th className="py-3 px-4 text-right">Total Amount</th>
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
                                  <span className="font-bold text-slate-800">{val.invoice_number}</span>
                                  {r.errors.length > 0 && (
                                    <p className="text-[10px] text-red-600 font-medium">{r.errors[0]}</p>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 font-semibold text-slate-700">
                                {val.customer_name}
                              </td>

                              <td className="py-3 px-4 text-slate-600 font-mono text-[11.5px]">
                                {val.invoice_date}
                              </td>

                              <td className="py-3 px-4 text-slate-600 font-mono text-[11.5px]">
                                {val.due_date}
                              </td>

                              <td className="py-3 px-4 text-slate-500">
                                {val.salesperson || <span className="text-slate-300">—</span>}
                              </td>

                              <td className="py-3 px-4 text-right font-bold text-slate-800 font-mono">
                                ₹{parseFloat(val.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[12px] text-slate-500 select-none font-medium px-1">
                  <div className="flex items-center gap-4">
                    <span>
                      Clean Records: <strong className="text-emerald-600 font-bold">{records.filter(r => r.errors.length === 0).length}</strong>
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

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6 flex flex-col items-center justify-center py-8"
              >
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
                    {isImporting ? "Adding invoices to registry..." : "Invoices Imported Successfully!"}
                  </h4>
                  <p className="text-[12px] text-slate-450">
                    {isImporting ? "Saving records securely. Please do not close this modal." : "The import process has completed. See results summary."}
                  </p>
                </div>

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

        {/* Footer controls */}
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
                Close & View Invoices
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
