# Task: Restore Original App Aesthetics

- [x] Analyze existing design system (colors, typography, common patterns) <!-- id: 0 -->
- [x] Identify recent UI implementations that deviate (look for "bright" or inconsistent styles) <!-- id: 1 -->
- [x] Create Implementation Plan to restore original aesthetics <!-- id: 2 -->
- [x] Execute styling fixes <!-- id: 3 -->
    - [x] Fix PortfolioTab.tsx <!-- id: 4 -->
    - [x] Fix other identified components (HoldingsView card hover) <!-- id: 5 -->
- [x] Fix Widget Aesthetics (Credit Card Optimizer) <!-- id: 7 -->
- [x] Fix BankStatementParser Import Trigger <!-- id: 8 -->
- [x] Fix Widget Aesthetics (Investment Clubs) <!-- id: 9 -->
- [x] Reorganize Dashboard Widgets (Spending, Markets, Community) <!-- id: 10 -->
- [x] Reorder Dashboard Rows & Redesign Achievements <!-- id: 11 -->
- [x] Verify UI consistency <!-- id: 6 -->

## Phase 3: Dashboard Architecture & Advanced Spending <!-- id: 12 -->
- [x] Plan Dashboard Segregation Strategy <!-- id: 13 -->
# Task: Restore Original App Aesthetics

- [x] Analyze existing design system (colors, typography, common patterns) <!-- id: 0 -->
- [x] Identify recent UI implementations that deviate (look for "bright" or inconsistent styles) <!-- id: 1 -->
- [x] Create Implementation Plan to restore original aesthetics <!-- id: 2 -->
- [x] Execute styling fixes <!-- id: 3 -->
    - [x] Fix PortfolioTab.tsx <!-- id: 4 -->
    - [x] Fix other identified components (HoldingsView card hover) <!-- id: 5 -->
- [x] Fix Widget Aesthetics (Credit Card Optimizer) <!-- id: 7 -->
- [x] Fix BankStatementParser Import Trigger <!-- id: 8 -->
- [x] Fix Widget Aesthetics (Investment Clubs) <!-- id: 9 -->
- [x] Reorganize Dashboard Widgets (Spending, Markets, Community) <!-- id: 10 -->
- [x] Reorder Dashboard Rows & Redesign Achievements <!-- id: 11 -->
- [x] Verify UI consistency <!-- id: 6 -->

## Phase 3: Dashboard Architecture & Advanced Spending <!-- id: 12 -->
- [x] Plan Dashboard Segregation Strategy <!-- id: 13 -->
- [x] Refactor `DashboardTab` to support Sub-Views (Router Pattern) <!-- id: 14 -->
- [x] Implement `SpendingAnalyticsHub` (Advanced "Fold-like" Features) <!-- id: 15 -->
    - [x] Transaction List with Tagging & Filtering <!-- id: 16 -->
    - [x] Detailed Charts & Reports <!-- id: 17 -->
    - [x] Bank Parsing Integration <!-- id: 18 -->
- [x] Implement `MarketInsightsHub` & `CommunityHub` Wrappers <!-- id: 19 -->
- [ ] **Navigation**: Verify "Back" logic preserves main dashboard state <!-- id: 38 -->

## Phase 5: Smart Feed Detailed Upgrades
- [ ] **Logic Fix**: Update `TransactionContext` to support Overwrite on Import <!-- id: 39 -->
- [ ] **Refactor**: Extract `BankImportModal` from `GodTierFeatures` for reuse <!-- id: 46 -->
- [ ] **Enhancement**: Integrate `BankImportModal` into `SpendingAnalyticsHub` ("+" Button) <!-- id: 47 -->
- [ ] **Enhancement**: Update `SpendingOverview` with "Edit Account" (Pencil) & "Clear Data" buttons <!-- id: 48 -->
- [ ] **New Component**: `RecurringPatternsWidget.tsx` (extracted from Insights) <!-- id: 40 -->
- [ ] **New Component**: `AnomaliesWidget.tsx` (extracted from Insights) <!-- id: 41 -->
- [ ] **Refactor**: Clean up `ExpenseInsights.tsx` to only show Savings <!-- id: 42 -->
- [ ] **New Component**: `CashFlowHeader.tsx` with Time Filters (T/W/M/Y/All) <!-- id: 43 -->
- [x] **Account Feature**: `AddAccountModal` with Form (Name, No, PIN) and SBI/ICICI mocks <!-- id: 44 -->
- [x] **Integration**: Assemble all new components in `SpendingOverview.tsx` <!-- id: 45 -->
- [x] Verify Navigation Flow & Back Button Logic <!-- id: 21 -->

## Phase 6: Analytics & Visuals Upgrade
- [ ] **New Widget**: `NetWorthTrendWidget` (Area Chart) with 1M/3M/6M toggle <!-- id: 50 -->
- [ ] **New Widget**: `MonthlySpendTrendWidget` (Line Chart) comparing current vs last month <!-- id: 51 -->
- [ ] **Enhancement**: Polish `SpendingAnalytics.tsx` with Recharts tooltips and "Fold-like" dark visuals <!-- id: 52 -->
