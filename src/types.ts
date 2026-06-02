export interface StoreItemDetails {
  available: boolean;
  price: number;
  unit: string;
  deal: string;
  details: string;
}

export interface AnalyzedGroceryItem {
  name: string;
  originalQuery: string;
  walmart: StoreItemDetails;
  freshco: StoreItemDetails;
  foodbasics: StoreItemDetails;
  metro: StoreItemDetails;
  comparisonReasoning: string;
}

export interface FlyerCompareResult {
  items: AnalyzedGroceryItem[];
  generalSavingsTips: string;
}

export interface FlyerSource {
  title: string;
  url: string;
}

export interface CompareApiResponse {
  success: boolean;
  data: FlyerCompareResult;
  sources: FlyerSource[];
  error?: string;
}

export interface StoreConfig {
  id: string;
  name: string;
  address: string;
  distance: string;
  approxTime: string;
  color: "blue" | "yellow" | "green" | "red";
}

export interface GroceryInput {
  id: string;
  name: string;
  checked: boolean;
}
