import React, { useState } from "react";
import { GroceryInput } from "../types";
import { Plus, Trash2, ListChecks, CheckSquare, Square, RefreshCw, Undo } from "lucide-react";

interface GroceryListManagerProps {
  items: GroceryInput[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onClear: () => void;
  onLoadTemplate: (templateName: string) => void;
}

const SUGGESTION_TEMPLATES: Record<string, string[]> = {
  "Ottawa Weekly List": [
    "Ginger", "Garlic", "Tomatoes", "Onions", "Green chillies", 
    "Cilantro", "Mint", "Curry leaves", "Cucumber", "Avocado", 
    "Carrot", "Lettuce", "Bell pepper", "Milk 4L 3.5%", "Bread whole wheat", "Yoghurt"
  ],
  "Fresh Produce & Snack": ["Bananas", "Broccoli", "English Cucumber", "Potato Chips", "Strawberries", "Baby Carrots"],
  "Baking & Pantry": ["Flour", "Granulated Sugar", "Olive Oil", "Canned Tuna", "Pasta Sauce", "Spaghetti Pasta"],
};

export default function GroceryListManager({
  items,
  onAdd,
  onRemove,
  onToggle,
  onClear,
  onLoadTemplate,
}: GroceryListManagerProps) {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onAdd(inputText.trim());
      setInputText("");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-emerald-600" />
            Your Grocery Checklist
          </h2>
          <p className="text-xs text-slate-500">
            Build your list and click analysis to seek active flyer savings.
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear List
          </button>
        )}
      </div>

      {/* Add Item Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Add product (e.g., Bananas, Milk, Salmon...)"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white p-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {/* Suggestion Bundles */}
      <div className="mb-4">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-2">
          Load Sample Shopping Lists:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(SUGGESTION_TEMPLATES).map((tmpl) => (
            <button
              key={tmpl}
              onClick={() => onLoadTemplate(tmpl)}
              className="text-xs bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 font-medium py-1 px-2.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-300"
            >
              {tmpl}
            </button>
          ))}
        </div>
      </div>

      {/* Grocery Items List */}
      <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center">
            <p className="text-sm text-slate-400 mt-2">Your list is empty.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Add items manually or load one of the grocery templates above!
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 border border-slate-100/50 transition-all"
            >
              <button
                onClick={() => onToggle(item.id)}
                className="flex items-center gap-3 text-left flex-1"
              >
                {item.checked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span
                  className={`text-sm font-medium transition-all ${
                    item.checked ? "line-through text-slate-400" : "text-slate-700"
                  }`}
                >
                  {item.name}
                </span>
              </button>
              <button
                onClick={() => onRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-all cursor-pointer"
                title="Remove Item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total Items: <strong className="text-slate-700">{items.length}</strong>
          </span>
          <span>
            Selected: <strong className="text-slate-700">{items.filter((i) => !i.checked).length} for shop</strong>
          </span>
        </div>
      )}
    </div>
  );
}
