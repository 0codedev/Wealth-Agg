# Dashboard Segregation & Advanced Spending Hub

## Goal Description
The dashboard has become cluttered. The goal is to maximize the "Dashboard" view by moving detailed widgets into dedicated **Sub-Hubs** (Spending, Markets, Community).
-   **Main Dashboard**: Shows only *one* high-level summary widget per section. Clicking the header/widget opens the full Hub.
-   **Spending Hub**: A dedicated, full-screen "Pro" view for expense analysis (Fold-like), managing transactions, tagging, and reports.
-   **Navigation**: Internal state-based routing (`Dashboard` -> `Hub`). Not visible in the global sidebar. Includes a "Back" button.

## User Review Required
> [!IMPORTANT]
> The "Spending & Optimization" section will no longer display all 3 widgets inline. It will show a single "Summary Card". Clicking it opens the full `SpendingAnalyticsHub`.

## Proposed Changes

### 1. Architecture: Internal Routing in `DashboardTab`
-   **State**: `view: 'MAIN' | 'SPENDING' | 'MARKETS' | 'COMMUNITY'`
-   **Main View**: Displays the existing "Time Traveler", "Stats", "Charts", "Calendar", "Wealth Simulator".
-   **Power Features Section**: Replaced by a `PowerFeaturesGrid` displaying 3 "Entry Cards":
    1.  **Spending Card**: "₹X Spent this month" + Mini Trend. Click -> `SpendingAnalyticsHub`.
    2.  **Market Card**: "Market is Bullish". Click -> `MarketInsightsHub`.
    3.  **Community Card**: "3 Active Challenges". Click -> `CommunityHub`.

### 2. New Component: `SpendingAnalyticsHub` (The "Fold x Track" Hybrid)
*Location: `/components/dashboard/hubs/SpendingAnalyticsHub.tsx`*

#### Design Philosophy
-   **Aesthetic**: "Fold-like" Premium Dark Mode. Solid backgrounds, high contrast, merchant logos.
-   **UX**: "Track Wallet-like" intuitive navigation and visual feedback.

#### Features by Tab
1.  **Overview (The "Smart Feed")**:
    -   **Net Worth / Cash Flow Header**: "Income vs Expense" monthly comparison (Fold style).
    -   **Smart Insights Feed**: "You spent ₹12k on Swiggy this month (Top Merchant)".
    -   **Account Aggregation Carousel**: Horizontal scroll of linked cards/banks.
    -   **Recent "Enriched" Transactions**: List with Merchant Logos (using Lucide proxies) + Auto-tags.

2.  **Transactions (The "Timeline")**:
    -   **Search & Filter**: "Fold-style" powerful search (by tag, merchant, amount).
    -   **Visual List**: Clean list with date headers.
    -   **Bulk Actions**: Select multiple -> Tag / Categorize.

3.  **Analytics (The "Track Wallet" View)**:
    -   **Calendar View**: Monthly calendar with daily spend indicators (Heatmap style).
    -   **Category Breakdown**: Interactive Pie Chart with drill-down.
    -   **Merchant Ranking**: "Top 5 Merchants" bar chart.

### 3. Usage of Existing Widgets
-   `UPITrackerWidget` -> Integrated into Overview.
-   `CreditCardOptimizer` -> Integrated into Overview.
-   `BankStatementParser` -> "Import" button in Header.

## Component Structure

#### [MODIFY] [DashboardTab.tsx](file:///c:/Users/gadda/Downloads/wealth-aggregator-v1.1%20(3)/components/tabs/DashboardTab.tsx)
-   Implement the `view` state switch.
# Dashboard Segregation & Advanced Spending Hub

## Goal Description
The dashboard has become cluttered. The goal is to maximize the "Dashboard" view by moving detailed widgets into dedicated **Sub-Hubs** (Spending, Markets, Community).
-   **Main Dashboard**: Shows only *one* high-level summary widget per section. Clicking the header/widget opens the full Hub.
-   **Spending Hub**: A dedicated, full-screen "Pro" view for expense analysis (Fold-like), managing transactions, tagging, and reports.
-   **Navigation**: Internal state-based routing (`Dashboard` -> `Hub`). Not visible in the global sidebar. Includes a "Back" button.

## User Review Required
> [!IMPORTANT]
> The "Spending & Optimization" section will no longer display all 3 widgets inline. It will show a single "Summary Card". Clicking it opens the full `SpendingAnalyticsHub`.

## Proposed Changes

### 1. Architecture: Internal Routing in `DashboardTab`
-   **State**: `view: 'MAIN' | 'SPENDING' | 'MARKETS' | 'COMMUNITY'`
-   **Main View**: Displays the existing "Time Traveler", "Stats", "Charts", "Calendar", "Wealth Simulator".
-   **Power Features Section**: Replaced by a `PowerFeaturesGrid` displaying 3 "Entry Cards":
    1.  **Spending Card**: "₹X Spent this month" + Mini Trend. Click -> `SpendingAnalyticsHub`.
    2.  **Market Card**: "Market is Bullish". Click -> `MarketInsightsHub`.
    3.  **Community Card**: "3 Active Challenges". Click -> `CommunityHub`.

### 2. New Component: `SpendingAnalyticsHub` (The "Fold x Track" Hybrid)
*Location: `/components/dashboard/hubs/SpendingAnalyticsHub.tsx`*

#### Design Philosophy
-   **Aesthetic**: "Fold-like" Premium Dark Mode. Solid backgrounds, high contrast, merchant logos.
-   **UX**: "Track Wallet-like" intuitive navigation and visual feedback.

#### Features by Tab
1.  **Overview (The "Smart Feed")**:
    -   **Net Worth / Cash Flow Header**: "Income vs Expense" monthly comparison (Fold style).
    -   **Smart Insights Feed**: "You spent ₹12k on Swiggy this month (Top Merchant)".
    -   **Account Aggregation Carousel**: Horizontal scroll of linked cards/banks.
    -   **Recent "Enriched" Transactions**: List with Merchant Logos (using Lucide proxies) + Auto-tags.

2.  **Transactions (The "Timeline")**:
    -   **Search & Filter**: "Fold-style" powerful search (by tag, merchant, amount).
    -   **Visual List**: Clean list with date headers.
    -   **Bulk Actions**: Select multiple -> Tag / Categorize.

3.  **Analytics (The "Track Wallet" View)**:
    -   **Calendar View**: Monthly calendar with daily spend indicators (Heatmap style).
    -   **Category Breakdown**: Interactive Pie Chart with drill-down.
    -   **Merchant Ranking**: "Top 5 Merchants" bar chart.

### 3. Usage of Existing Widgets
-   `UPITrackerWidget` -> Integrated into Overview.
-   `CreditCardOptimizer` -> Integrated into Overview.
-   `BankStatementParser` -> "Import" button in Header.

## Component Structure

#### [MODIFY] [DashboardTab.tsx](file:///c:/Users/gadda/Downloads/wealth-aggregator-v1.1%20(3)/components/tabs/DashboardTab.tsx)
-   Implement the `view` state switch.
-   Render `SpendingAnalyticsHub` when view is 'SPENDING'.

#### [NEW] [SpendingAnalyticsHub.tsx]
-   [x] The "Fold-like" advanced interface.

#### [NEW] [MarketInsightsHub.tsx] & [CommunityHub.tsx]
-   Wrapper components for the displaced widgets.
- [ ] **Empty States**: Professional empty states for all 3 tabs <!-- id: 37 -->
- [ ] **Navigation**: Verify "Back" logic preserves main dashboard state <!-- id: 38 -->

## Phase 5: Smart Feed Refinement (Current Focus)
- [ ] **Widget Decomposition**: Split `ExpenseInsights` into `SavingsWidget`, `RecurringPatternsWidget`, `AnomaliesWidget`.
- [ ] **Cash Flow Logic**: Add T/W/M/Y/All filters to Net Cash Flow header.
- [ ] **Account Management**:
    - [ ] Replace "Import Info" with "Add Bank Account" Form.
    - [ ] Mock SBI/ICICI data.
    - [ ] Fix CSV Import to **Overwrite** existing data.

## Phase 6: Analytics & Visuals Upgrade
- [ ] **New Widget**: `NetWorthTrendWidget` (Area Chart) with 1M/3M/6M toggle <!-- id: 50 -->
- [ ] **New Widget**: `MonthlySpendTrendWidget` (Line Chart) comparing current vs last month <!-- id: 51 -->
- [ ] **Enhancement**: Polish `SpendingAnalytics.tsx` with Recharts tooltips and "Fold-like" dark visuals <!-- id: 52 -->

## Verification Plan
1.  **Navigation Check**: Verify Main Dashboard -> Click "Spending" -> Opens Hub -> Click Back -> Returns to Main.
2.  **Spending Hub**: Verify Layout (Graph, Transactions, Import).
3.  **Clutter Check**: Verify Main Dashboard no longer has the massive grid of 8+ widgets at the bottom.
4.  **Analytics Check**: Toggle timelines on the new Net Worth chart.
