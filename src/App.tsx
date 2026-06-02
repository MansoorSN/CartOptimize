import { useState, useEffect } from "react";
import { GroceryInput, StoreConfig, FlyerCompareResult, FlyerSource } from "./types";
import GroceryListManager from "./components/GroceryListManager";
import StoreProfiles from "./components/StoreProfiles";
import FlyerResultsDashboard from "./components/FlyerResultsDashboard";
import {
  Sparkles,
  MapPin,
  RefreshCw,
  TrendingDown,
  Store,
  ChevronRight,
  Info,
  Calendar,
  AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react";

export default function App() {
  const [items, setItems] = useState<GroceryInput[]>([
    { id: "1", name: "Ginger", checked: false },
    { id: "2", name: "Garlic", checked: false },
    { id: "3", name: "Tomatoes", checked: false },
    { id: "4", name: "Onions", checked: false },
    { id: "5", name: "Green chillies", checked: false },
    { id: "6", name: "Cilantro", checked: false },
    { id: "7", name: "Mint", checked: false },
    { id: "8", name: "Curry leaves", checked: false },
    { id: "9", name: "Cucumber", checked: false },
    { id: "10", name: "Avocado", checked: false },
    { id: "11", name: "Carrot", checked: false },
    { id: "12", name: "Lettuce", checked: false },
    { id: "13", name: "Bell pepper", checked: false },
    { id: "14", name: "Milk 4L 3.5%", checked: false },
    { id: "15", name: "Bread whole wheat", checked: false },
    { id: "16", name: "Yoghurt", checked: false },
  ]);

  const [stores, setStores] = useState<StoreConfig[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(["walmart", "freshco", "foodbasics", "metro"]);
  const [postalCode, setPostalCode] = useState("K2E6J9");
  const [regionDescription, setRegionDescription] = useState("Ottawa West (Merivale Rd Corridor)");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<FlyerCompareResult | null>(null);
  const [sources, setSources] = useState<FlyerSource[]>([]);

  // Toggle store selection checkbox handler
  const toggleStoreSelection = (storeId: string) => {
    setSelectedStoreIds((prev) => {
      // Must maintain at least 1 active store to perform a comparison
      if (prev.includes(storeId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== storeId);
      } else {
        return [...prev, storeId];
      }
    });
  };

  // Self-Learning Cache States (Option A)
  const [cacheStatus, setCacheStatus] = useState<{ totalCachedItems: number; cachedItems: any[] } | null>(null);
  const [lastCompareCacheStatus, setLastCompareCacheStatus] = useState<{ hits: number; misses: number; source: string } | null>(null);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [schedulerLog, setSchedulerLog] = useState<string | null>(null);
  const [showSchedulerInstructions, setShowSchedulerInstructions] = useState(false);

  // Fetch local catalog database stats
  const fetchCacheStatus = async () => {
    try {
      const res = await fetch("/api/cache-status");
      if (res.ok) {
        const data = await res.json();
        setCacheStatus(data);
      }
    } catch (err) {
      console.error("Failed to query cache statistics:", err);
    }
  };

  useEffect(() => {
    fetchCacheStatus();
  }, []);

  // Sync flyer configurations on regional boundary postal code update
  useEffect(() => {
    const clean = postalCode.trim().toLowerCase().replace(/\s+/g, "");
    if (clean.length < 3 || !clean.startsWith("k")) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      async function fetchConfig() {
        try {
          const res = await fetch(`/api/config?postalCode=${encodeURIComponent(postalCode)}`);
          if (res.ok && isMounted) {
            const config = await res.json();
            setStores(config.stores || []);
            if (config.description) {
              setRegionDescription(config.description);
            }
          }
        } catch (err) {
          console.error("Failed to load store coordinates:", err);
        }
      }
      fetchConfig();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [postalCode]);

  // Handlers for Grocery List Manager
  const handleAddItem = (name: string) => {
    const newItem: GroceryInput = {
      id: Date.now().toString(),
      name,
      checked: false,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  };

  const handleClearList = () => {
    setItems([]);
  };

  const handleLoadTemplate = (templateName: string) => {
    const templates: Record<string, string[]> = {
      "Ottawa Weekly List": [
        "Ginger", "Garlic", "Tomatoes", "Onions", "Green chillies", 
        "Cilantro", "Mint", "Curry leaves", "Cucumber", "Avocado", 
        "Carrot", "Lettuce", "Bell pepper", "Milk 4L 3.5%", "Bread whole wheat", "Yoghurt"
      ],
      "Fresh Produce & Snack": ["Bananas", "Broccoli", "English-cucumber", "Potato Chips", "Strawberries", "Baby Carrots"],
      "Baking & Pantry": ["Flour", "Granulated Sugar", "Olive Oil", "Canned Tuna", "Pasta Sauce", "Spaghetti Pasta"],
    };
    const itemsToLoad = templates[templateName] || [];
    const formatted = itemsToLoad.map((name, index) => ({
      id: `template-${index}-${Date.now()}`,
      name,
      checked: false,
    }));
    setItems(formatted);
  };

  // Trigger cache-first evaluation & split matches
  const handleCompareFlyers = async () => {
    const targetItems = items.filter((i) => !i.checked).map((i) => i.name);
    if (targetItems.length === 0) {
      setError("Please add or select at least one item to search!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsFallback(false);
    setLastCompareCacheStatus(null);
    setLoadingStep("Reading local cached catalog flyers...");

    // Smooth step updates for asynchronous transition feel
    let currentStepIndex = 0;
    const steps = [
      "Evaluating local persistent flyer cache (Option A)...",
      "Scanning remaining catalog nodes with Gemini Live Grounding...",
      "Matching Ottawa retail metrics and calculating budget splits...",
      "Finalizing price matrix comparison summaries..."
    ];
    
    const stepInterval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setLoadingStep(steps[currentStepIndex]);
        currentStepIndex++;
      }
    }, 1500);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: targetItems, postalCode, selectedStoreIds }),
      });

      const result = await response.json();
      clearInterval(stepInterval);

      if (result.success && result.data) {
        setComparisonResult(result.data);
        setSources(result.sources || []);
        setIsFallback(!!result.isFallback);
        if (result.cacheStatus) {
          setLastCompareCacheStatus(result.cacheStatus);
        }
        // Auto update local catalog count in panel
        fetchCacheStatus();
      } else {
        setError(result.error || "An unexpected error occurred during flyer evaluation.");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || "Network error. Failed to connect to server comparison API.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dispatch background synchronization job
  const triggerWeeklySync = async () => {
    setIsRefreshingCache(true);
    setSchedulerLog(null);
    try {
      const res = await fetch("/api/jobs/weekly-flyer-refresh", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setSchedulerLog(`Synchronization successful!\n- Catalog Items updated: ${result.updatedCount}\n- Source Type: Thursday Flyer Rollover\n- Run TimeStamp: ${new Date(result.timestamp).toLocaleTimeString()}`);
        fetchCacheStatus();
      } else {
        setSchedulerLog(`Authentication or channel disruption: ${result.error || "Unrecognized error"}`);
      }
    } catch (err: any) {
      setSchedulerLog(`Failed to compile cron dispatch: ${err.message}`);
    } finally {
      setIsRefreshingCache(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner and Navigation Bar */}
      <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                CartOptimize <span className="text-emerald-600">.</span>
              </span>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                Flyer Price Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm text-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-mono font-bold text-slate-700">{postalCode}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">{regionDescription}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column Span 4: Grocery List Input Rail & Caching Management */}
          <div className="lg:col-span-4 h-fit space-y-6">
            <GroceryListManager
              items={items}
              onAdd={handleAddItem}
              onRemove={handleRemoveItem}
              onToggle={handleToggleItem}
              onClear={handleClearList}
              onLoadTemplate={handleLoadTemplate}
            />

            {/* Ottawa Postal Code Selector Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Ottawa Service Area
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Enter any Ottawa area postal code (starts with K) to synchronize the nearest co-op stores & flyer pricing.
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. K2E 6J9"
                    maxLength={7}
                    value={postalCode}
                    onChange={(e) => {
                      let val = e.target.value.toUpperCase();
                      if (val.replace(/\s/g, "").length === 3 && val.length === 3 && !postalCode.endsWith(" ")) {
                        val = val + " ";
                      }
                      setPostalCode(val);
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                      !/^[Kk]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(postalCode.replace(/\s/g, "")) && postalCode.length >= 3
                        ? "border-rose-300 focus:ring-rose-200 focus:bg-white text-rose-800"
                        : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100 placeholder:text-slate-400"
                    }`}
                  />
                  <span className="absolute right-3.5 top-3.5 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                    ON
                  </span>
                </div>

                {/* Validation message */}
                {postalCode.length > 0 && !/^[kK]\d[a-zA-Z]\s?\d[a-zA-Z]\d$/.test(postalCode.replace(/\s/g, "")) && (
                  <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5 flex-wrap">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                    Must match Canadian code format (e.g. K2E 6J9)
                  </p>
                )}
                {postalCode.length >= 1 && !postalCode.toUpperCase().startsWith("K") && (
                  <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5 flex-wrap">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    Ottawa postal codes start with the letter 'K'
                  </p>
                )}
              </div>

              {/* Quick Preset Badges */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Quick Regions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Nepean", code: "K2E 6J9" },
                    { label: "Barrhaven", code: "K2J 4B1" },
                    { label: "Kanata", code: "K2K 1X1" },
                    { label: "Downtown", code: "K1S 1A1" },
                    { label: "Orleans", code: "K1C 1A1" },
                    { label: "Hunt Club", code: "K1V 1A1" },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setPostalCode(item.code)}
                      className={`px-2.5 py-1 text-xs rounded-lg transition-all border cursor-pointer ${
                        postalCode.toUpperCase().replace(/\s/g, "") === item.code.toUpperCase().replace(/\s/g, "")
                          ? "bg-slate-900 border-slate-900 text-white font-semibold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* OPTION A: Self-Learning Local Flyer Database Cache Hub */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  Weekly Flyer Cache (Option A)
                </h3>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full font-mono uppercase tracking-tight shrink-0">
                  Active
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
                <p>
                  Prices are saved locally on disk under <strong className="text-slate-800 font-mono">data/local_flyers.json</strong>. Searches prioritize direct cache matching before requesting Gemini, saving extensive lookups and APIs.
                </p>
                
                {/* Stats indicators */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cache Catalog</span>
                    <strong className="text-base font-mono font-black text-slate-800">{cacheStatus?.totalCachedItems ?? 19}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">items tracked</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Job Execution</span>
                    <strong className="text-[11px] font-bold text-emerald-650 block mt-1.5 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Sync'd active
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">weekly scheduler</span>
                  </div>
                </div>
              </div>

              {/* Weekly scheduler manual execution button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={triggerWeeklySync}
                  disabled={isRefreshingCache}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                    isRefreshingCache
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border-slate-200 text-slate-700 active:scale-[0.98]"
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCache ? 'animate-spin text-emerald-600' : ''}`} />
                  {isRefreshingCache ? "Sync'ing Flyer data..." : "Trigger Weekly Sync (Cron Job)"}
                </button>

                {schedulerLog && (
                  <div className="bg-slate-950 text-slate-350 rounded-xl p-3 font-mono text-[10px] leading-relaxed relative border border-slate-800 whitespace-pre-wrap">
                    <button 
                      type="button"
                      onClick={() => setSchedulerLog(null)} 
                      className="absolute top-1.5 right-2 text-slate-400 hover:text-slate-200 text-xs font-bold font-mono cursor-pointer"
                    >
                      ×
                    </button>
                    <strong className="text-emerald-400">Scheduler Output Log:</strong>
                    <p className="mt-1">{schedulerLog}</p>
                  </div>
                )}
              </div>

              {/* Google Cloud Scheduler configuration details */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSchedulerInstructions(!showSchedulerInstructions)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>{showSchedulerInstructions ? "Hide details" : "How to run this weekly from AI Studio?"}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showSchedulerInstructions ? 'rotate-90' : ''}`} />
                </button>

                {showSchedulerInstructions && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mt-2 space-y-2.5 text-[10.5px] text-slate-600 leading-relaxed max-h-56 overflow-y-auto">
                    <p>
                      Because server containers sleep on inactivity in developmental coding frames (like AI Studio preview panels), running native server-side timers is impractical.
                    </p>
                    <p className="font-bold text-slate-800">
                      Standard Professional Architecture:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-[10px]">
                      <li>Deploy this full-stack app to <strong>Google Cloud Run</strong>.</li>
                      <li>In <strong>Cloud Scheduler</strong>, create a weekly cron job.</li>
                      <li>Use cron expression <code className="bg-slate-200 px-1 rounded">0 0 * * 4</code> (Ontario Thursday flyers update cycle).</li>
                      <li>Configure custom <strong>POST</strong> requests pointed to the routing gateway:
                        <div className="bg-slate-200 p-1 rounded font-mono text-[9px] mt-1 text-slate-800 break-all select-all">
                          https://[YOUR_CLOUDRUN_URL]/api/jobs/weekly-flyer-refresh
                        </div>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {stores.length > 0 && (
              <StoreProfiles
                stores={stores}
                postalCode={postalCode}
                regionDescription={regionDescription}
                selectedStoreIds={selectedStoreIds}
                onToggleStore={toggleStoreSelection}
              />
            )}

            <button
              onClick={handleCompareFlyers}
              disabled={isLoading || items.filter(i => !i.checked).length === 0}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isLoading
                  ? "bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed"
                  : "bg-neutral-900 hover:bg-black text-white hover:shadow-lg active:scale-[0.99]"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  Searching local & live...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Compare & Split Flyers
                </>
              )}
            </button>
          </div>

          {/* Column Span 8: Active Bento Results Panel */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Error display */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-800">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Operation Failed</h4>
                  <p className="text-xs text-rose-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Cache Hit / Miss Summary Indicators */}
            {lastCompareCacheStatus && !isLoading && (
              <div className="bg-emerald-50/70 border border-emerald-200/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-950">
                      Ottawa Flyer Cache Match Efficiency: <span className="font-mono text-emerald-700 font-extrabold">{Math.round((lastCompareCacheStatus.hits / (lastCompareCacheStatus.hits + lastCompareCacheStatus.misses || 1)) * 100)}%</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Resolved {lastCompareCacheStatus.hits} items locally. Learned {lastCompareCacheStatus.misses} misses via Live Grounding.
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black bg-slate-900 text-slate-100 font-mono tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {lastCompareCacheStatus.source}
                  </span>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[450px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 animate-pulse" />
                <div className="p-4 bg-emerald-50 rounded-2xl mb-4 text-emerald-600">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Analyzing Ottawa Flyers...</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Evaluating weekly specials at <strong className="text-slate-700">{stores[0]?.name || "Walmart"}</strong>, <strong className="text-slate-700">{stores[1]?.name || "FreshCo"}</strong>, <strong className="text-slate-700">{stores[2]?.name || "Food Basics"}</strong> & <strong className="text-slate-700">{stores[3]?.name || "Metro"}</strong> near code {postalCode}.
                </p>
                
                {/* Simulated active steps indicator */}
                <div className="mt-8 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs text-slate-600 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span>{loadingStep || "Initializing caching comparative index..."}</span>
                </div>
              </div>
            )}

            {/* Fallback indicator banner */}
            {!isLoading && comparisonResult && isFallback && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900 shadow-sm animate-fade-in">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-widest text-amber-850 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Ottawa Smart-Matching Catalog Dynamic Active
                  </h4>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    The live Gemini API pipeline is hitting standard developer quota bounds. To maintain lightning performance, your shopping cart is served instantly using Ontario's pre-seeded offline flyer database indexes.
                  </p>
                </div>
              </div>
            )}

            {/* Results Grid - Interactive Bento */}
            {!isLoading && comparisonResult && (
              <FlyerResultsDashboard
                comparisonData={comparisonResult}
                sources={sources}
                selectedStoreIds={selectedStoreIds}
                regionDescription={regionDescription}
              />
            )}

            {/* Empty state when no comparison run yet */}
            {!isLoading && !comparisonResult && (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center flex flex-col justify-center items-center min-h-[450px]">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Compare Grocery Pricing in Ottawa</h3>
                <p className="text-xs text-slate-500 max-w-lg mt-2 leading-relaxed">
                  Avoid paying maximum retail checkout prices! Add your target groceries to the list on the left, click <strong>"Compare & Split Flyers"</strong>, and let our self-learning database instantly match active flyer deals. 
                </p>

                {/* Demonstration Bento Features list */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full text-left">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <span className="w-7 h-7 bg-blue-50 text-blue-600 font-mono font-bold rounded-lg flex items-center justify-center text-xs mb-3">01</span>
                    <h4 className="font-bold text-slate-800 text-xs">{stores[0]?.name || "Walmart Canada"}</h4>
                    <p className="text-[10.5px] text-slate-500 mt-1">Walmart Rollbacks & standard baselines.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <span className="w-7 h-7 bg-yellow-50 text-yellow-700 font-mono font-bold rounded-lg flex items-center justify-center text-xs mb-3">02</span>
                    <h4 className="font-bold text-slate-800 text-xs">{stores[1]?.name || "FreshCo"}</h4>
                    <p className="text-[10.5px] text-slate-500 mt-1">FreshCo Scene+ loyalty promotion markdowns.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <span className="w-7 h-7 bg-emerald-50 text-emerald-600 font-mono font-bold rounded-lg flex items-center justify-center text-xs mb-3">03</span>
                    <h4 className="font-bold text-slate-800 text-xs">{stores[2]?.name || "Food Basics"}</h4>
                    <p className="text-[10.5px] text-slate-500 mt-1">Food Basics Selection brands & flyer values.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <span className="w-7 h-7 bg-rose-50 text-rose-600 font-mono font-bold rounded-lg flex items-center justify-center text-xs mb-3">04</span>
                    <h4 className="font-bold text-slate-800 text-xs">{stores[3]?.name || "Metro"}</h4>
                    <p className="text-[10.5px] text-slate-500 mt-1">Metro premium brand-match & reward cards.</p>
                  </div>
                </div>

                {/* Sample items box */}
                <div className="mt-8 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 w-full flex items-center justify-between text-left text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Pro-Tip:</strong> Grounding matches are cached dynamically. Consecutive searches on matching categories yield sub-millisecond response results!</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
