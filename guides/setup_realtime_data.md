# 🌊 Turning on the Data Hose: Real-Time Data Setup

To transform the **Alpha Predator Engine** from a simulation into a live hunting tool, you need to connect it to real-world data pipelines.

We use **RapidAPI** (Yahoo Finance Core) and **AlphaVantage** because they offer generous **FREE** tiers that are perfect for personal use.

---

## 🚀 Step 1: Get Your RapidAPI Key (Yahoo Finance)

This powers the **Bulk Deal Scanner** and general market data.

1. Go to **[Yahoo Finance 2.0 (ApiDojo)](https://rapidapi.com/apidojo/api/yahoo-finance1)**.
2. Click **"Sign Up"** (You can use Google/GitHub login).
3. Once logged in, click **"Subscribe to Test"**:
    * Select the **Basic (Free)** plan (500 requests/month).
4. After subscribing, go to the **"Endpoints"** tab.
5. Look for the code snippet area on the right/middle.
6. Copy the value next to `X-RapidAPI-Key`.
    * It looks like a long string of random characters: `8f3c...1a2b`

**Save this key.** You will paste it into the app settings.

---

## 📈 Step 2: Get Your AlphaVantage Key

This powers the **Insider Radar** and global market indicators.

1. Go to **[AlphaVantage - Get Key](https://www.alphavantage.co/support/#api-key)**.
2. Fill out the tiny form (Name, Organization: "Personal", Email).
3. Click **"Get Free API Key"**.
4. Your key will appear instantly on the screen (e.g., `WEALTHAGG_DEMO_KEY`).

**Save this key.**

---

## ⚙️ Step 3: Activate Live Mode

1. Open **WealthAggregator**.
2. Go to **Settings** (Gear Icon).
3. Scroll down to **"Data Feeds & API"**.
4. Paste your **RapidAPI Key** and **AlphaVantage Key**.
5. Toggle **"Enable Live Data"** to ON.

**Done!** 🦈
The "Simulation Mode" badge will disappear, and you will see live data streaming into your Predator Engine.
