# Tasks

- [x] Full Application Audit
- [x] Fix Critical Audit Findings
- [x] Backup Download Fix (FileSystem API)
- [x] Syndicate Tracker Refinements

---

- [/] **Smart CSV Import System**
    - [x] Create `TransactionContext.tsx` with Transaction interface
    - [x] Implement `smartMerge()` upsert algorithm
    - [x] Create `TransactionImportService.ts` (built into TransactionContext)
        - [x] Auto-detect Fold vs Paytm format
        - [x] Parse Fold CSV
        - [x] Parse Paytm CSV
        - [x] Map emoji tags to categories
    - [x] Add persistence (using localStorage instead of Dexie)
    - [x] Update `BankImportModal.tsx` with smart merge feedback
    - [ ] Verify: No duplicates on re-import
    - [ ] Verify: Missing tags filled on re-import
