# Ottawa Smart-Flyer Split Comparison & Analytics

A responsive full-stack Smart Grocery Assistant designed for Ottawa shoppers, mapping neighborhood postal codes directly to their nearest clusters of Walmart, FreshCo, Food Basics, and Metro. It utilizes an advanced, self-learning JSON-based caching engine and the Google Gemini API (with Search Grounding) to deliver real-time pricing analysis, split-shopping lists, and calculated aggregate savings.

---

## 🗺️ Key Features

### 1. Smart Grocery List Manager
- Add, update, and manage dynamic personal grocery lists.
- Prepopulated with a customizable 16-item **Ottawa Weekly Groceries** template (including Ginger, Garlic, fresh Tomatoes, Onions, Green chillies, and bunch-matched aromatic herbs).
- Toggle list items dynamically to adjust calculation targets.

### 2. Location-Based Profile Mapping
- Dynamically maps Ottawa-region postal codes to the closest cluster of four competitors:
  - **Ottawa West (Merivale Rd Corridor)**
  - **Ottawa South (Barrhaven Marketplace)**
  - **Ottawa Kanata (Hazeldean Centre)**
  - **Ottawa Central (Downtown & Glebe & Vanier)**
- Retrieves specific addresses, driving/walking commute estimates, and distances to formulate convenient split-shopping paths.

### 3. Smart Flyer-Split Dashboard
- Calculates and showcases side-by-side pricing metrics for all 4 storefronts (Walmart, FreshCo, Food Basics, Metro) with highlighted active flyer promotions and "member-only specials" (e.g., scene+, rewards, rollback deals).
- Automatically computes the **Unified Lowest Split-Price**: Tells the user exactly what to buy where to secure the absolute maximum savings.
- Formulates a visual savings summary showcasing potential percentage cash-back advantages compared to buy-all-at-one-store baseline alternatives.

---

## 🏗️ Architectural Decisions

```
               [ User Interface (React + Vite) ]
                               │
                       (POST /api/compare)
                               │
                               ▼
                [ Express Server (server.ts) ]
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
   [ Cache Check: Item exists? ]        [ Cache Miss! ]
    Matches in local_flyers.json             │
              │                         [ Gemini Call ]
         (Hit: ~0ms)             Attempts model cascading fallback with
              │                  Google Gemini with Search Grounding
              │                                 │
              │                       (Self-Learning Save)
              │                    Commits fresh flyer deals/prices
              │                    back into `local_flyers.json`
              ▼                                 ▼
    [ Formulate Results JSON ] ◄────────────────┘
```

### 1. Self-Learning Hybrid Cache-First Engine
- Serves queries instantly when cached in `/data/local_flyers.json`.
- When an item is requested that doesn't yet exist in the local cache (a **Cache Miss**), the server triggers a live, real-time Gemini Search Grounding API call.
- The returned structural flyer node (featuring precise CAD pricing, brand labels, pack details, and specific flyers) is merged back into the persistent physical `/data/local_flyers.json` file.
- **Result**: Self-expanding corpus that responds to later duplicate queries with near **0ms latency** and zero API pricing overhead.

### 2. API Resiliency & Graceful Fallback Cascades
- To offset Google Cloud's temporary "503 High Demand" or rate-limit constraints, the sever incorporates a highly robust, multi-tiered protection system:
  1. **Exponential Backoff**: Transient errors (429, 503, overloads) trigger up to 3 automatic retries with progressively doubled delay.
  2. **Cascading Model Pipeline**: If the primary chosen model (`gemini-3.5-flash`) fails, the sever falls back gracefully to `gemini-3.1-flash-lite`, and lastly `gemini-flash-latest`.
  3. **High-Fidelity Offline / Quota Fallback**: If an item cannot be fetched via Gemini (due to offline state, quota limits, or generic query), the server checks a robust local catalog containing correct predefined rates for common Ottawa staples (like local Gala apples, bag milk, bread, produce, herbs, etc.). If the target item is completely unresolvable and missing from the predefined list, instead of generating misleading mock flyer prices, the system safely marks the store flyers as unavailable (`available: false`) and reports that the price could not be extracted. Crucially, to prevent temporary 503 "High Demand" API failures from poisoning the persistent database cache with "Not Found" state entries, these transient fallback items are excluded from cache-saving so they are cleanly re-evaluated via Gemini once service connectivity is restored.

### 3. Background Sync & Anti-Staleness Protocols
- Grocery flyers in Canada reset every Thursday morning.
- Handled via a programmatic endpoint `/api/jobs/weekly-flyer-refresh` designed to accept triggers from external automated scheduler cron jobs (such as Google Cloud Scheduler).
- The sync job crawls the entire learned/pre-populated catalog in batches, pulling newly updated flyered prices from Gemini Search Grounding to guarantee long-term data fresh-rate.

---

## 🚧 Challenges, Hurdles & Technical Resolutions

### 🔴 Model Latency & Token Depletion
- **Hurdle**: Running Live Web Search Grounding for lists of 10+ items concurrently leads to long load times and exhausts API quotas.
- **Resolution**: Implemented the **Offline Cache Look-up First**. Only items that are genuinely absent from the local store are sent to the AI in a consolidated batch, significantly streamlining overall response delay.

### 🔴 High Demand & Transient 503 AI Errors
- **Hurdle**: High concurrent demand on Gemini servers sometimes throws temporary `UNAVAILABLE` or `503` exceptions.
- **Resolution**: Designed `generateContentWithRetry` with exponential delay alongside a cascading fallback routing logic (`callGeminiWithFallback`) to verify uptime.

### 🔴 Stale Local Stores
- **Hurdle**: Stored item names can drift over time or contain typos, leading to subsequent cache misses.
- **Resolution**: Programmed semantic matching loops (`findCachedItem`) that perform clean word-boundary checks, singular/plural normalization, and substring matches to ensure excellent hit ratios.

---

## 🎯 Recent Milestones: Weekly Grocery Alignment & Store Selection Filter

To improve the fidelity and accuracy of budget comparisons, we synchronized the application's default inventory state, template libraries, and server-side fallback engines with a pristine 16-item **Ottawa Weekly Grocery List**:

1. **Aromatic & Base Crop Parity**: Prepopulated Ginger, Garlic, Onions, and Green chillies in the default checklist with deterministic multi-level CAD matching.
2. **Strict Bunch/Unit Matching (Cilantro, Mint, Curry Leaves)**: Set specific rules to ensure loose fresh herbs are compared by comparable bunches or single-unit packs, avoiding unit mismatches across competitors.
3. **Fresh Tomato Rule**: Standardized search outcomes for **Tomatoes** to filter for cheap, fresh whole vine or field tomatoes, explicitly excluding canned variations.
4. **Size & Grade Standardizations**:
   - **Milk 4L 3.5%**: Mapped specifically to local whole/homo 3.5% milk lines using standard regulated 4L bag prices (~$5.67 to $5.89).
   - **Bread Whole Wheat**: Standardized on Whole Wheat Sliced Bread loaves at 675g matching package sizes.
   - **Avocados & Bell Peppers**: Set similar packaging metrics (5-pack, 3-pack) so shoppers receive true apples-to-apples price ratios.

---

## 🏬 Recent Milestone: Multi-Store Selective Comparison Filter

We have fully implemented a high-fidelity selective comparison system allowing shoppers to tailor their route by choosing exactly which retail locations to coordinate:

1. **Checkbox-Controlled Store Profile Cards**: Users can check/uncheck checkboxes directly on the store profile dashboard to dynamically exclude any specific competitors.
2. **Dynamic Client-Side Math Engine**: The split calculation engine dynamically filters all calculations based on `selectedStoreIds`:
   - Smart-Split subtotals only accumulate across active stores.
   - Best-price finder (`getCheapestStore`) bypasses disabled channels.
   - Solo routes and "Guaranteed Savings" metrics adapt dynamically to compare only against selected stores.
3. **Visually Muted Exclusion State in side-by-side catalog**: Excluded store columns are elegantly dimmed and grayed out with a standard placeholder dash (`—`) in the comprehensive comparison ledger, drawing full visual emphasis to the selected competitors.
