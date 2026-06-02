import { FlyerCompareResult, FlyerSource } from "../types";
import {
  Sparkles,
  ArrowRight,
  TrendingDown,
  ExternalLink,
  Store,
  Info,
  Calendar,
  Layers,
  ShoppingBag,
  HeartCrack,
  BadgeDollarSign
} from "lucide-react";
import { motion } from "motion/react";

interface FlyerResultsDashboardProps {
  comparisonData: FlyerCompareResult;
  sources: FlyerSource[];
  selectedStoreIds: string[];
  regionDescription?: string;
}

const REGIONAL_TRIP_DATA: Record<string, {
  title: string;
  description: string;
  transitCost: string;
}> = {
  "Ottawa West": {
    title: "Merivale Trip Coordinates",
    description: "Your selected Ottawa West retailers are clustered closely along the Merivale Road corridor, Nepean, or adjacent regional hubs. They are under a 5-minute drive range stretch apart!",
    transitCost: "Minimal (Clustered Corridor)"
  },
  "Ottawa South (Barrhaven": {
    title: "Barrhaven Marketplace Trip Coordinates",
    description: "Your selected Barrhaven retailers are situated along Strandherd Drive and Greenbank Road. Doing a circular route covers all active stores under a 6-minute drive radius!",
    transitCost: "Very Low (Avenue Corridor)"
  },
  "Kanata": {
    title: "Kanata Hazeldean Trip Coordinates",
    description: "Your selected Kanata retailers span Hazeldean Road, Katimavik Road, and Eagleson Road. Driving between endpoints takes about 8 minutes along major Kanata arterials.",
    transitCost: "Low (Hazeldean Route)"
  },
  "Ottawa Central": {
    title: "Downtown & Glebe Trip Coordinates",
    description: "Your selected central retailers are distributed across Bank Street (Glebe), McArthur Avenue (Vanier), and Kirkwood Avenue. Navigating the downtown core takes a moderate 12-15 minute drive.",
    transitCost: "Medium (Downtown Core Transit)"
  },
  "Ottawa East": {
    title: "Orleans Innes Trip Coordinates",
    description: "Your selected Orleans retailers are located mainly along the Innes Road power center corridor. Walmart, FreshCo, and Metro are highly clustered; Food Basics Gloucester is only a 9-minute drive away.",
    transitCost: "Low-Medium (Innes Parkway Corridor)"
  },
  "Ottawa Southlands": {
    title: "Hunt Club & South Keys Trip Coordinates",
    description: "Your selected south-end retailers are clustered along Bank Street near South Keys Shopping Centre and Findlays Creek. Driving between these locations takes roughly 4 to 10 minutes.",
    transitCost: "Low-Medium (Bank / Southlands Segment)"
  }
};

const getRegionalTripInfo = (desc: string) => {
  const normalizedDesc = desc || "Ottawa West (Merivale Rd Corridor)";
  const matchedKey = Object.keys(REGIONAL_TRIP_DATA).find(key => 
    normalizedDesc.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(normalizedDesc.toLowerCase())
  );
  
  if (matchedKey) {
    return REGIONAL_TRIP_DATA[matchedKey];
  }
  
  return REGIONAL_TRIP_DATA["Ottawa West"]; // Default to Merivale Rd
};

export default function FlyerResultsDashboard({
  comparisonData,
  sources,
  selectedStoreIds,
  regionDescription = "Ottawa West (Merivale Rd Corridor)",
}: FlyerResultsDashboardProps) {
  const { items, generalSavingsTips } = comparisonData;
  const tripInfo = getRegionalTripInfo(regionDescription);


  // Find which store has the best price
  const getCheapestStore = (item: any) => {
    const storesList = [
      { id: "walmart", available: item.walmart?.available && selectedStoreIds.includes("walmart"), price: item.walmart?.price || 0 },
      { id: "freshco", available: item.freshco?.available && selectedStoreIds.includes("freshco"), price: item.freshco?.price || 0 },
      { id: "foodbasics", available: item.foodbasics?.available && selectedStoreIds.includes("foodbasics"), price: item.foodbasics?.price || 0 },
      { id: "metro", available: item.metro?.available && selectedStoreIds.includes("metro"), price: item.metro?.price || 0 }
    ];
    
    // Filter to available ones with non-zero prices
    const availableStores = storesList.filter(s => s.available && s.price > 0);
    if (availableStores.length === 0) return null;
    
    // Return the minimum price store
    return availableStores.reduce((cheapest, current) => {
      return current.price < cheapest.price ? current : cheapest;
    }, availableStores[0]);
  };

  // Calculate shopping splits
  const walmartItems = items.filter(item => getCheapestStore(item)?.id === "walmart");
  const freshcoItems = items.filter(item => getCheapestStore(item)?.id === "freshco");
  const foodbasicsItems = items.filter(item => getCheapestStore(item)?.id === "foodbasics");
  const metroItems = items.filter(item => getCheapestStore(item)?.id === "metro");

  const unavailableItems = items.filter(item => !getCheapestStore(item));

  // Subtotals
  const walmartSplitTotal = walmartItems.reduce((acc, item) => acc + (item.walmart?.price || 0), 0);
  const freshcoSplitTotal = freshcoItems.reduce((acc, item) => acc + (item.freshco?.price || 0), 0);
  const foodbasicsSplitTotal = foodbasicsItems.reduce((acc, item) => acc + (item.foodbasics?.price || 0), 0);
  const metroSplitTotal = metroItems.reduce((acc, item) => acc + (item.metro?.price || 0), 0);

  const optimizedTotal = walmartSplitTotal + freshcoSplitTotal + foodbasicsSplitTotal + metroSplitTotal;

  // Purist options (if you wanted to do a single trip)
  const pureWalmartSum = items.reduce((acc, item) => {
    if (item.walmart?.available && item.walmart.price > 0) return acc + item.walmart.price;
    const alt = getCheapestStore(item);
    return acc + (alt ? alt.price : 0);
  }, 0);

  const pureFreshcoSum = items.reduce((acc, item) => {
    if (item.freshco?.available && item.freshco.price > 0) return acc + item.freshco.price;
    const alt = getCheapestStore(item);
    return acc + (alt ? alt.price : 0);
  }, 0);

  const pureFoodbasicsSum = items.reduce((acc, item) => {
    if (item.foodbasics?.available && item.foodbasics.price > 0) return acc + item.foodbasics.price;
    const alt = getCheapestStore(item);
    return acc + (alt ? alt.price : 0);
  }, 0);

  const pureMetroSum = items.reduce((acc, item) => {
    if (item.metro?.available && item.metro.price > 0) return acc + item.metro.price;
    const alt = getCheapestStore(item);
    return acc + (alt ? alt.price : 0);
  }, 0);

  // Calculate real savings
  const worstCasePureSum = Math.max(
    selectedStoreIds.includes("walmart") ? pureWalmartSum : 0,
    selectedStoreIds.includes("freshco") ? pureFreshcoSum : 0,
    selectedStoreIds.includes("foodbasics") ? pureFoodbasicsSum : 0,
    selectedStoreIds.includes("metro") ? pureMetroSum : 0
  );

  const splitShoppingPossible = selectedStoreIds.length > 1;
  const totalSaved = splitShoppingPossible && worstCasePureSum > optimizedTotal ? worstCasePureSum - optimizedTotal : 0;
  const percentSaved = splitShoppingPossible ? (Math.round((totalSaved / (worstCasePureSum || 1)) * 100) || 0) : 0;

  return (
    <div className="space-y-6">
      {/* Dynamic Savings Bento Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Core optimized split metrics */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-emerald-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden md:col-span-1"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-2xl opacity-50 -mr-6 -mt-6" />
          <span className="text-emerald-100 text-xs font-semibold tracking-wide uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-200" />
            Optimized Smart-Split
          </span>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-mono tracking-tight">${optimizedTotal.toFixed(2)}</span>
            <span className="text-emerald-100 text-xs block mt-1">
              Combined Checkout Spends (CAD)
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-500/50 grid grid-cols-2 gap-y-1 text-[11px] text-emerald-100 font-medium">
            {selectedStoreIds.includes("walmart") && (
              <div>
                Walmart: <span className="text-white font-semibold">${walmartSplitTotal.toFixed(2)}</span>
              </div>
            )}
            {selectedStoreIds.includes("freshco") && (
              <div>
                FreshCo: <span className="text-white font-semibold">${freshcoSplitTotal.toFixed(2)}</span>
              </div>
            )}
            {selectedStoreIds.includes("foodbasics") && (
              <div>
                Food Basics: <span className="text-white font-semibold">${foodbasicsSplitTotal.toFixed(2)}</span>
              </div>
            )}
            {selectedStoreIds.includes("metro") && (
              <div>
                Metro: <span className="text-white font-semibold">${metroSplitTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Total savings metric */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden"
        >
          <span className="text-slate-400 text-xs font-semibold tracking-wide uppercase flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-emerald-500" />
            Guaranteed Savings
          </span>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              ${totalSaved.toFixed(2)}
            </span>
            <span className="text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded-md ml-2 inline-block">
              Save {percentSaved}%
            </span>
            <span className="text-slate-500 text-xs block mt-1">
              Compared to pure shopping at the retail maximum.
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Solo Route is up to:</span>
            <span className="font-mono text-slate-700 font-medium">
              Max ${worstCasePureSum.toFixed(2)}
            </span>
          </div>
        </motion.div>

        {/* Map/Travel Profile Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wide uppercase flex items-center gap-1">
              <Store className="w-4 h-4 text-indigo-500" />
              {tripInfo.title}
            </span>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {tripInfo.description} (Selected stores: {selectedStoreIds.map(id => id === 'walmart' ? 'Walmart' : id === 'freshco' ? 'FreshCo' : id === 'foodbasics' ? 'Food Basics' : 'Metro').join(', ')})
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Extra Transit Cost:</span>
            <span className="text-emerald-600 font-bold font-sans">
              {tripInfo.transitCost}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Optimized Checklist Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Walmart Split Card */}
        {selectedStoreIds.includes("walmart") && (
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-white/10 p-1.5 rounded-lg text-white">
                    <Store className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">Walmart Purchases</h3>
                    <span className="text-[11px] text-blue-100 font-sans">Rollbacks & baseline staples</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-blue-100 block">Subtotal</span>
                  <span className="font-mono font-bold text-lg">${walmartSplitTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 divide-y divide-slate-100">
                {walmartItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No items recommended for Walmart in this split.
                  </div>
                ) : (
                  walmartItems.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-800 block">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 max-w-[280px]">
                          {item.walmart?.details}
                        </span>
                        {item.walmart?.deal && (
                          <span className="inline-block mt-1 text-[10px] uppercase tracking-wide font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded leading-none">
                            {item.walmart.deal}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ${item.walmart?.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          / {item.walmart?.unit || "each"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* FreshCo Split Card */}
        {selectedStoreIds.includes("freshco") && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-amber-500 px-6 py-4 text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900/10 p-1.5 rounded-lg text-slate-950">
                    <Store className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">FreshCo Purchases</h3>
                    <span className="text-[11px] text-slate-800 font-sans">Scene+ members & produce deals</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-800 block">Subtotal</span>
                  <span className="font-mono font-bold text-lg text-slate-950">${freshcoSplitTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 divide-y divide-slate-100">
                {freshcoItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No items recommended for FreshCo in this split.
                  </div>
                ) : (
                  freshcoItems.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-800 block">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 max-w-[280px]">
                          {item.freshco?.details}
                        </span>
                        {item.freshco?.deal && (
                          <span className="inline-block mt-1 text-[10px] uppercase tracking-wide font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded leading-none">
                            {item.freshco.deal}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ${item.freshco?.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          / {item.freshco?.unit || "each"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Food Basics Split Card */}
        {selectedStoreIds.includes("foodbasics") && (
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-white/10 p-1.5 rounded-lg text-white">
                    <Store className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">Food Basics Purchases</h3>
                    <span className="text-[11px] text-emerald-100 font-sans">Selection brand & bulk basics savings</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-100 block">Subtotal</span>
                  <span className="font-mono font-bold text-lg">${foodbasicsSplitTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 divide-y divide-slate-100">
                {foodbasicsItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No items recommended for Food Basics in this split.
                  </div>
                ) : (
                  foodbasicsItems.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-800 block">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 max-w-[280px]">
                          {item.foodbasics?.details}
                        </span>
                        {item.foodbasics?.deal && (
                          <span className="inline-block mt-1 text-[10px] uppercase tracking-wide font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded leading-none">
                            {item.foodbasics.deal}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ${item.foodbasics?.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          / {item.foodbasics?.unit || "each"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metro Split Card */}
        {selectedStoreIds.includes("metro") && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-white/10 p-1.5 rounded-lg text-white">
                    <Store className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">Metro Purchases</h3>
                    <span className="text-[11px] text-rose-100 font-sans">Irresistibles premium labels & member points</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-rose-100 block">Subtotal</span>
                  <span className="font-mono font-bold text-lg">${metroSplitTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 divide-y divide-slate-100">
                {metroItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No items recommended for Metro in this split.
                  </div>
                ) : (
                  metroItems.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-800 block">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 max-w-[280px]">
                          {item.metro?.details}
                        </span>
                        {item.metro?.deal && (
                          <span className="inline-block mt-1 text-[10px] uppercase tracking-wide font-bold bg-rose-50 text-rose-750 px-1.5 py-0.5 rounded leading-none">
                            {item.metro.deal}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ${item.metro?.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          / {item.metro?.unit || "each"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Unavailable products panel if any */}
      {unavailableItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 items-start">
          <HeartCrack className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-widest leading-none">
              Not Found in Active Store Flyers
            </h4>
            <p className="text-xs text-rose-700 mt-1">
              The following products:{" "}
              <strong>{unavailableItems.map((ui) => ui.name).join(", ")}</strong> could
              not be identified in current flyers or digital stock lists. We suggest checking inside standard grocery aisles.
            </p>
          </div>
        </div>
      )}

      {/* Comprehensive comparative product ledger */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Side-by-Side Flyer Catalog Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Complete catalog comparisons with matched packaging metrics & specific flyer reasoning.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-400" />
            Cheaper Selection Highlighted
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="py-3 px-4">Grocery Item</th>
                <th className={`py-3 px-4 ${!selectedStoreIds.includes("walmart") ? "opacity-40" : ""}`}>
                  Walmart {!selectedStoreIds.includes("walmart") && <span className="text-[9px] font-normal block font-sans text-slate-400">(Excluded)</span>}
                </th>
                <th className={`py-3 px-4 ${!selectedStoreIds.includes("freshco") ? "opacity-40" : ""}`}>
                  FreshCo {!selectedStoreIds.includes("freshco") && <span className="text-[9px] font-normal block font-sans text-slate-400">(Excluded)</span>}
                </th>
                <th className={`py-3 px-4 ${!selectedStoreIds.includes("foodbasics") ? "opacity-40" : ""}`}>
                  Food Basics {!selectedStoreIds.includes("foodbasics") && <span className="text-[9px] font-normal block font-sans text-slate-400">(Excluded)</span>}
                </th>
                <th className={`py-3 px-4 ${!selectedStoreIds.includes("metro") ? "opacity-40" : ""}`}>
                  Metro {!selectedStoreIds.includes("metro") && <span className="text-[9px] font-normal block font-sans text-slate-400">(Excluded)</span>}
                </th>
                <th className="py-3 px-4 hidden lg:table-cell">AI Smart-Comparison Guide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const cheapestStoreId = getCheapestStore(item)?.id;

                const isWalmartCheapest = cheapestStoreId === "walmart";
                const isFreshCoCheapest = cheapestStoreId === "freshco";
                const isFoodBasicsCheapest = cheapestStoreId === "foodbasics";
                const isMetroCheapest = cheapestStoreId === "metro";

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block text-sm">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Query: "{item.originalQuery}"
                      </span>
                    </td>

                    {/* Walmart */}
                    <td className={`py-3.5 px-4 ${isWalmartCheapest ? "bg-emerald-500/5 font-bold" : ""} ${!selectedStoreIds.includes("walmart") ? "opacity-25 bg-slate-50/10 cursor-not-allowed" : ""}`}>
                      {!selectedStoreIds.includes("walmart") ? (
                        <span className="text-slate-400 font-sans block py-1 font-mono text-center">—</span>
                      ) : item.walmart?.available ? (
                        <div>
                          <div className="flex items-center gap-1.5 col-span-1">
                            <span className="font-mono text-xs text-slate-800">
                              ${item.walmart.price.toFixed(2)}
                            </span>
                            {isWalmartCheapest && (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded uppercase leading-none">
                                Best
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            /{item.walmart.unit}
                          </span>
                          <span className="text-[10px] text-blue-600 block italic leading-snug">
                            {item.walmart.deal}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not in flyer</span>
                      )}
                    </td>

                    {/* FreshCo */}
                    <td className={`py-3.5 px-4 ${isFreshCoCheapest ? "bg-emerald-500/5 font-bold" : ""} ${!selectedStoreIds.includes("freshco") ? "opacity-25 bg-slate-50/10 cursor-not-allowed" : ""}`}>
                      {!selectedStoreIds.includes("freshco") ? (
                        <span className="text-slate-400 font-sans block py-1 font-mono text-center">—</span>
                      ) : item.freshco?.available ? (
                        <div>
                          <div className="flex items-center gap-1.5 col-span-1">
                            <span className="font-mono text-xs text-slate-800">
                              ${item.freshco.price.toFixed(2)}
                            </span>
                            {isFreshCoCheapest && (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded uppercase leading-none">
                                Best
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            /{item.freshco.unit}
                          </span>
                          <span className="text-[10px] text-amber-600 block italic leading-snug">
                            {item.freshco.deal}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not in flyer</span>
                      )}
                    </td>

                    {/* Food Basics */}
                    <td className={`py-3.5 px-4 ${isFoodBasicsCheapest ? "bg-emerald-500/5 font-bold" : ""} ${!selectedStoreIds.includes("foodbasics") ? "opacity-25 bg-slate-50/10 cursor-not-allowed" : ""}`}>
                      {!selectedStoreIds.includes("foodbasics") ? (
                        <span className="text-slate-400 font-sans block py-1 font-mono text-center">—</span>
                      ) : item.foodbasics?.available ? (
                        <div>
                          <div className="flex items-center gap-1.5 col-span-1">
                            <span className="font-mono text-xs text-slate-800">
                              ${item.foodbasics.price.toFixed(2)}
                            </span>
                            {isFoodBasicsCheapest && (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded uppercase leading-none">
                                Best
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            /{item.foodbasics.unit}
                          </span>
                          <span className="text-[10px] text-emerald-600 block italic leading-snug font-sans">
                            {item.foodbasics.deal}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not in flyer</span>
                      )}
                    </td>

                    {/* Metro */}
                    <td className={`py-3.5 px-4 ${isMetroCheapest ? "bg-emerald-500/5 font-bold" : ""} ${!selectedStoreIds.includes("metro") ? "opacity-25 bg-slate-50/10 cursor-not-allowed" : ""}`}>
                      {!selectedStoreIds.includes("metro") ? (
                        <span className="text-slate-400 font-sans block py-1 font-mono text-center">—</span>
                      ) : item.metro?.available ? (
                        <div>
                          <div className="flex items-center gap-1.5 col-span-1">
                            <span className="font-mono text-xs text-slate-800">
                              ${item.metro.price.toFixed(2)}
                            </span>
                            {isMetroCheapest && (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded uppercase leading-none">
                                Best
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            /{item.metro.unit}
                          </span>
                          <span className="text-[10px] text-rose-600 block italic leading-snug font-sans">
                            {item.metro.deal}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not in flyer</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 leading-normal max-w-sm hidden lg:table-cell font-sans text-[11px]">
                      <div className="flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="block font-medium text-slate-700 font-sans">
                            {item.comparisonReasoning}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* general shopping advisor pane */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
        <h4 className="text-xs font-bold text-slate-450 tracking-wider uppercase mb-2 flex items-center gap-1.5">
          <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
          Ottawa Corridor Flyer Optimizer Advisor
        </h4>
        <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line font-sans">
          {generalSavingsTips}
        </p>
      </div>

      {/* grounding flyer citations */}
      {sources.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3 px-1">
            Verified Flyer Citations & Reference Sources
          </h4>
          <div className="flex flex-wrap gap-2">
            {sources.map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-750 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{src.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
