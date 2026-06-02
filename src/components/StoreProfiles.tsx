import { StoreConfig } from "../types";
import { MapPin, Navigation, ShoppingBag, Landmark, CheckSquare, Square } from "lucide-react";

interface StoreProfilesProps {
  stores: StoreConfig[];
  postalCode: string;
  regionDescription?: string;
  selectedStoreIds: string[];
  onToggleStore: (storeId: string) => void;
}

export default function StoreProfiles({ 
  stores, 
  postalCode, 
  regionDescription = "Ottawa Regional Corridor",
  selectedStoreIds,
  onToggleStore
}: StoreProfilesProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-600" />
            {regionDescription}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Toggle stores below to customize which flyer pricing is matched in comparison splits!
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold shrink-0">
          <MapPin className="w-3.5 h-3.5" />
          <span>Local Sector</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map((store) => {
          const isSelected = selectedStoreIds.includes(store.id);
          const isWalmart = store.id === "walmart";
          const isFreshCo = store.id === "freshco";
          const isFoodBasics = store.id === "foodbasics";
          const isMetro = store.id === "metro";

          let colorClasses = "border-slate-200 bg-slate-50/40 opacity-50 grayscale-[40%]";
          let indicatorColor = "bg-slate-400";
          let iconBg = "bg-slate-100 text-slate-400";

          if (isSelected) {
            if (isWalmart) {
              colorClasses = "border-blue-100 bg-blue-50/10 hover:border-blue-200";
              indicatorColor = "bg-blue-600";
              iconBg = "bg-blue-50 text-blue-700 border border-blue-100/30";
            } else if (isFreshCo) {
              colorClasses = "border-amber-100 bg-amber-50/10 hover:border-amber-200";
              indicatorColor = "bg-amber-500";
              iconBg = "bg-amber-50 text-amber-800 border border-amber-100/30";
            } else if (isFoodBasics) {
              colorClasses = "border-emerald-100 bg-emerald-50/10 hover:border-emerald-200";
              indicatorColor = "bg-emerald-600";
              iconBg = "bg-emerald-50 text-emerald-800 border border-emerald-100/30";
            } else if (isMetro) {
              colorClasses = "border-rose-100 bg-rose-50/10 hover:border-rose-200";
              indicatorColor = "bg-rose-600";
              iconBg = "bg-rose-50 text-rose-800 border border-rose-100/30";
            }
          }

          return (
            <div
              key={store.id}
              onClick={() => onToggleStore(store.id)}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer select-none ${colorClasses}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="mr-1 mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4.5 h-4.5 text-slate-800 shrink-0" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${indicatorColor}`} />
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {store.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 max-w-[200px]">
                    {store.address}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${iconBg}`}>
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100/80 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-slate-400" />
                  <span>{store.distance} range</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-700 font-semibold">{store.approxTime}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-sans">
        💡 <strong>Sector Savings Tip:</strong> Combining trips between these closely-linked local stores takes only a few minutes of extra travel time and can easily reduce your checkout bill by 15-30% by capitalizing on active Rollbacks and flyer discounts!
      </div>
    </div>
  );
}
