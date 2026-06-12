import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  MapPin,
  Tag,
  CircleDollarSign,
  Calendar,
  SlidersHorizontal,
  ArrowRight,
  UserCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Inbox,
  Upload,
  Database
} from 'lucide-react';
import { useToast } from '../App.jsx';

function Customers() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Filter states
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [lastOrderDays, setLastOrderDays] = useState('');

  // Ingestion states
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestTab, setIngestTab] = useState('customers'); // 'customers' | 'orders'
  const [ingestDataJson, setIngestDataJson] = useState('');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fillSampleCustomers = () => {
    const samples = [
      {
        "name": "Arjun Mehta",
        "email": "arjun.mehta@example.com",
        "phone": "+91 9892011223",
        "city": "Mumbai",
        "tags": ["coffee-lover", "regular", "weekend-spender"],
        "totalSpend": 1850,
        "totalOrders": 4,
        "lastOrderDate": new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        "name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "phone": "+91 8877665544",
        "city": "Delhi",
        "tags": ["croissant-fan", "new-user"],
        "totalSpend": 350,
        "totalOrders": 1,
        "lastOrderDate": new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    setIngestDataJson(JSON.stringify(samples, null, 2));
    setIngestResult(null);
  };

  const fillSampleOrders = () => {
    const samples = [
      {
        "email": "arjun.mehta@example.com",
        "amount": 450,
        "items": [
          { "name": "Cold Brew Combo", "category": "Beverage", "price": 450, "qty": 1 }
        ],
        "channel": "online"
      },
      {
        "email": "priya.sharma@example.com",
        "amount": 600,
        "items": [
          { "name": "Coffee Beans Bag (250g)", "category": "Merchandise", "price": 600, "qty": 1 }
        ],
        "channel": "in-store"
      }
    ];
    setIngestDataJson(JSON.stringify(samples, null, 2));
    setIngestResult(null);
  };

  const handleIngestData = async () => {
    if (!ingestDataJson.trim()) {
      showToast('Please enter JSON data to ingest.', 'error');
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(ingestDataJson);
    } catch (err) {
      showToast('Invalid JSON format. Please correct it.', 'error');
      return;
    }

    setIngestLoading(true);
    setIngestResult(null);

    try {
      const endpoint = ingestTab === 'customers' ? '/api/customers/ingest' : '/api/customers/ingest-orders';
      const res = await axios.post(`${API_URL}${endpoint}`, parsedData);
      
      showToast(`Successfully processed ingestion!`, 'success');
      setIngestResult({
        success: true,
        message: res.data.message,
        details: res.data.results
      });
      fetchCustomers(1); // Refresh customer list
    } catch (err) {
      console.error('Ingestion error:', err);
      showToast(err.response?.data?.error || 'Ingestion failed. Check format.', 'error');
      setIngestResult({
        success: false,
        error: err.response?.data?.error || 'Server error during ingestion'
      });
    } finally {
      setIngestLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          setIngestDataJson(JSON.stringify(parsed, null, 2));
          showToast('JSON file loaded successfully!', 'success');
          setIngestResult(null);
        } catch (err) {
          showToast('Failed to parse JSON file.', 'error');
        }
      } else if (file.name.endsWith('.csv')) {
        try {
          const rows = [];
          const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
          if (lines.length < 2) {
            showToast('CSV file must have a header row and at least one data row.', 'error');
            return;
          }
          const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            if (currentLine.length !== headers.length) continue;
            const obj = {};
            headers.forEach((header, index) => {
              const value = currentLine[index];
              if (header === 'tags') {
                obj[header] = value ? value.split(';').map(t => t.trim()) : [];
              } else if (header === 'amount' || header === 'totalSpend' || header === 'totalOrders') {
                obj[header] = Number(value);
              } else if (header === 'items') {
                try {
                  obj[header] = JSON.parse(value);
                } catch {
                  obj[header] = [{ name: value || 'Ingested Item', price: obj.amount || 0, qty: 1 }];
                }
              } else {
                obj[header] = value;
              }
            });
            rows.push(obj);
          }
          setIngestDataJson(JSON.stringify(rows, null, 2));
          showToast('CSV file converted and loaded successfully!', 'success');
          setIngestResult(null);
        } catch (err) {
          console.error(err);
          showToast('Failed to parse CSV file.', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const fetchCustomers = async (pageNumber = 1) => {
    setLoading(true);
    try {
      let queryParams = `?page=${pageNumber}&limit=20&search=${search}&city=${city}`;
      if (minSpend) queryParams += `&minSpend=${minSpend}`;
      if (lastOrderDays) queryParams += `&lastOrderDays=${lastOrderDays}`;

      const res = await axios.get(`${API_URL}/api/customers${queryParams}`);
      setCustomers(res.data.customers || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
      setPages(res.data.pages || 1);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers(1);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search, city, minSpend, lastOrderDays]);

  const handleSelectCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setDetailsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/customers/${cust._id}`);
      setSelectedCustomerOrders(res.data.orders || []);
    } catch (err) {
      console.error('Error loading customer detail orders:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Gurgaon'];

  return (
    <div class="space-y-6 flex flex-col h-full bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Header */}
      <div class="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-black tracking-tight text-slate-900">Customer Explorer</h2>
          <p class="text-xs text-slate-500 mt-1">
            Perform drill-down query checks, slice audience tags, and view user order profiles.
          </p>
        </div>
        <button
          onClick={() => {
            setIsIngestModalOpen(true);
            setIngestResult(null);
            setIngestDataJson('');
          }}
          class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Database class="w-4 h-4" /> Ingest Data
        </button>
      </div>

      {/* Filters Toolbar */}
      <div class="bg-white border border-slate-200 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end shadow-sm">
        {/* Search */}
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Profile</label>
          <div class="relative">
            <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl text-xs outline-none text-slate-850 transition-colors"
            />
          </div>
        </div>

        {/* City Filter */}
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl text-xs outline-none text-slate-850 transition-colors"
          >
            <option value="">All Cities</option>
            {cities.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Minimum Spend */}
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min Spend (₹)</label>
          <div class="relative">
            <CircleDollarSign class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={minSpend}
              onChange={(e) => setMinSpend(e.target.value)}
              placeholder="e.g. 5000"
              class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl text-xs outline-none text-slate-850 transition-colors"
            />
          </div>
        </div>

        {/* Last Order filter */}
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Order</label>
          <select
            value={lastOrderDays}
            onChange={(e) => setLastOrderDays(e.target.value)}
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl text-xs outline-none text-slate-850 transition-colors"
          >
            <option value="">Any Time</option>
            <option value="30">Within 30 days</option>
            <option value="60">Within 60 days</option>
            <option value="90">Within 90 days</option>
          </select>
        </div>
      </div>

      {/* Customers List Box */}
      <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col flex-1 shadow-sm">
        <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Shoppers List ({total})</span>
          {loading && <span class="text-[10px] text-amber-600 animate-pulse font-black uppercase tracking-wider">Loading...</span>}
        </div>

        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase bg-slate-50/20">
                <th class="py-3 px-4">Name</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">City</th>
                <th class="py-3 px-4">Total Orders</th>
                <th class="py-3 px-4">Total Spend</th>
                <th class="py-3 px-4">Last Order</th>
                <th class="py-3 px-4">Tags</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              {loading ? (
                // Skeletons
                [...Array(6)].map((_, i) => (
                  <tr key={i} class="animate-pulse">
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-2/3"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-5/6"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-1/2"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-1/3"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-1/2 text-amber-600"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-2/3"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-3/4"></div></td>
                  </tr>
                ))
              ) : (
                customers.map((cust) => (
                  <tr
                    key={cust._id}
                    onClick={() => handleSelectCustomer(cust)}
                    class={`hover:bg-slate-50 cursor-pointer transition-colors ${
                      selectedCustomer && selectedCustomer._id === cust._id ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td class="py-3.5 px-4 font-bold text-slate-800">{cust.name}</td>
                    <td class="py-3.5 px-4 text-slate-600 font-medium">{cust.email}</td>
                    <td class="py-3.5 px-4 text-slate-600 font-semibold">{cust.city}</td>
                    <td class="py-3.5 px-4 font-semibold text-slate-700">{cust.totalOrders}</td>
                    <td class="py-3.5 px-4 text-amber-600 font-bold">₹{cust.totalSpend?.toLocaleString()}</td>
                    <td class="py-3.5 px-4 text-slate-500 text-xs font-medium">
                      {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="flex flex-wrap gap-1">
                        {cust.tags?.slice(0, 2).map((t, idx) => (
                          <span key={idx} class="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-semibold border border-slate-200/55">
                            {t}
                          </span>
                        ))}
                        {cust.tags?.length > 2 && (
                          <span class="px-1.5 py-0.5 rounded bg-amber-50 text-[10px] text-amber-600 font-bold">
                            +{cust.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {customers.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" class="py-16 text-center text-slate-400">
                    <div class="flex flex-col items-center gap-2">
                      <Inbox class="w-8 h-8 text-slate-300" />
                      <span class="text-xs font-bold text-slate-550">No shoppers match these criteria</span>
                      <span class="text-[10px] text-slate-400">Try adjusting your filters or search query.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pages > 1 && !loading && (
          <div class="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Page {page} of {pages} ({total} profiles)
            </span>
            <div class="flex items-center gap-2">
              <button
                onClick={() => fetchCustomers(page - 1)}
                disabled={page === 1}
                class="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-45 cursor-pointer transition-all"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchCustomers(page + 1)}
                disabled={page === pages}
                class="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-45 cursor-pointer transition-all"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-In Right Drawer Panel */}
      {selectedCustomer && (
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          {/* Backdrop Closer */}
          <div class="flex-1" onClick={() => setSelectedCustomer(null)}></div>

          {/* Drawer content box */}
          <div class="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-250">
            <div class="space-y-6 flex-1 overflow-y-auto pr-1">
              {/* Profile Header */}
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600">
                    <UserCheck class="w-5 h-5" />
                  </div>
                  <div>
                    <h3 class="font-extrabold text-slate-900 text-base">{selectedCustomer.name}</h3>
                    <span class="text-xs text-slate-500 font-semibold">{selectedCustomer.city}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  <X class="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Bio details */}
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Email</span>
                  <span class="text-slate-700 font-semibold break-all">{selectedCustomer.email}</span>
                </div>
                <div>
                  <span class="text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Phone</span>
                  <span class="text-slate-700 font-semibold">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span class="text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Last Order</span>
                  <span class="text-slate-700 font-semibold flex items-center gap-1">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    {selectedCustomer.lastOrderDate ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span class="text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Spent Total</span>
                  <span class="text-amber-600 font-extrabold text-sm">₹{selectedCustomer.totalSpend?.toLocaleString()}</span>
                </div>
              </div>

              {/* Tag Badges */}
              <div class="space-y-2">
                <span class="text-xs text-slate-400 uppercase font-bold tracking-wider block">Audience Tag Groupings</span>
                <div class="flex flex-wrap gap-1.5">
                  {selectedCustomer.tags?.map((tag, i) => (
                    <span key={i} class="px-2.5 py-1 rounded bg-amber-50 border border-amber-200/50 text-[10px] text-amber-700 font-bold flex items-center gap-1">
                      <Tag class="w-2.5 h-2.5 text-amber-600" /> {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Order history table */}
              <div class="space-y-3 pt-4 border-t border-slate-100">
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase History ({selectedCustomerOrders.length})</h4>
                
                {detailsLoading ? (
                  <div class="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} class="h-14 bg-slate-100 border border-slate-200/40 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {selectedCustomerOrders.map((ord, idx) => (
                      <div key={idx} class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center transition-all hover:bg-slate-100/50">
                        <div>
                          <span class="text-xs font-bold text-slate-800">₹{ord.amount}</span>
                          <div class="text-[10px] text-slate-500 mt-0.5 font-semibold leading-relaxed">
                            {ord.items?.map(it => `${it.qty}x ${it.name}`).join(', ')}
                          </div>
                        </div>
                        <span class="text-[9px] font-bold text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {selectedCustomerOrders.length === 0 && (
                      <span class="text-xs text-slate-400 italic block">No order history recorded.</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div class="pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => {
                  sessionStorage.setItem('aria_prefill', JSON.stringify({
                    prefillMessage: `Draft a personalized offer message for ${selectedCustomer.name}`
                  }));
                  setSelectedCustomer(null);
                  navigate('/assistant');
                }}
                class="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all text-center block"
              >
                Draft personalized message in Assistant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingest Data Modal */}
      {isIngestModalOpen && (
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/35 flex items-center justify-center text-amber-600">
                  <Database class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-extrabold text-slate-900 text-base">Ingest CRM Data</h3>
                  <p class="text-[11px] text-slate-500 mt-0.5">Bulk upload customers or orders directly into the database.</p>
                </div>
              </div>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            {/* Tabs & Content */}
            <div class="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Tab Selector */}
              <div class="flex gap-2 border-b border-slate-200 pb-3">
                <button
                  onClick={() => {
                    setIngestTab('customers');
                    setIngestDataJson('');
                    setIngestResult(null);
                  }}
                  class={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    ingestTab === 'customers'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Ingest Customers
                </button>
                <button
                  onClick={() => {
                    setIngestTab('orders');
                    setIngestDataJson('');
                    setIngestResult(null);
                  }}
                  class={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    ingestTab === 'orders'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Ingest Orders
                </button>
              </div>

              {/* Template Helper Actions */}
              <div class="flex justify-between items-center bg-slate-50/60 p-3 rounded-xl border border-slate-100 flex-wrap gap-2">
                <span class="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Template Helpers:</span>
                {ingestTab === 'customers' ? (
                  <button
                    onClick={fillSampleCustomers}
                    class="px-3 py-1 bg-white border border-slate-200 text-amber-600 hover:text-amber-700 font-bold text-[10px] rounded-lg shadow-sm cursor-pointer transition-all"
                  >
                    Load Sample Customers JSON
                  </button>
                ) : (
                  <button
                    onClick={fillSampleOrders}
                    class="px-3 py-1 bg-white border border-slate-200 text-amber-600 hover:text-amber-700 font-bold text-[10px] rounded-lg shadow-sm cursor-pointer transition-all"
                  >
                    Load Sample Orders JSON
                  </button>
                )}
              </div>

              {/* File Upload Area */}
              <div class="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer relative group flex flex-col items-center justify-center gap-1.5">
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload class="w-6 h-6 text-slate-400 group-hover:text-amber-600 transition-colors" />
                <div>
                  <span class="text-xs font-bold text-slate-700 block">Drag & Drop or Click to Select File</span>
                  <span class="text-[10px] text-slate-400">Supports .json arrays or .csv files (auto-converted on the fly)</span>
                </div>
              </div>

              {/* JSON Textarea */}
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">JSON Data (Array or Single Object)</label>
                <textarea
                  value={ingestDataJson}
                  onChange={(e) => setIngestDataJson(e.target.value)}
                  placeholder={
                    ingestTab === 'customers'
                      ? '[\n  {\n    "name": "Jane Doe",\n    "email": "jane@example.com",\n    "phone": "+91 9999988888",\n    "city": "Mumbai",\n    "tags": ["coffee-lover"]\n  }\n]'
                      : '[\n  {\n    "email": "jane@example.com",\n    "amount": 450,\n    "items": [\n      { "name": "Cold Brew", "category": "Beverage", "price": 450, "qty": 1 }\n    ]\n  }\n]'
                  }
                  rows={8}
                  class="w-full p-4 bg-slate-900 text-emerald-450 font-mono text-xs border border-slate-800 rounded-2xl outline-none focus:border-amber-600 transition-colors shadow-inner"
                />
              </div>

              {/* Results Logs panel */}
              {ingestResult && (
                <div class={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  ingestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <h4 class="font-extrabold mb-1">{ingestResult.success ? '✓ Ingestion Successful' : '✗ Ingestion Failed'}</h4>
                  <p>{ingestResult.message || ingestResult.error}</p>
                  {ingestResult.details && (
                    <div class="mt-2 max-h-32 overflow-y-auto pr-1 space-y-1 font-mono text-[10px] border-t border-emerald-250/30 pt-2">
                      {ingestResult.details.map((res, i) => (
                        <div key={i} class="flex justify-between">
                          <span>{res.email || res.orderId || `Record ${i+1}`}</span>
                          <span class={res.success ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                            {res.success ? 'OK' : `FAIL: ${res.error}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div class="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsIngestModalOpen(false)}
                class="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-900 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleIngestData}
                disabled={ingestLoading || !ingestDataJson.trim()}
                class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {ingestLoading ? 'Ingesting...' : 'Start Ingest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
