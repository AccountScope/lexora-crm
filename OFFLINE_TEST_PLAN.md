# 🧪 LEXORA Offline Mode - Testing Plan

## Pre-Testing Setup

### 1. Build the Application
```bash
cd lexora
npm run build
npm start
```

### 2. Verify Installation
```bash
node scripts/verify-offline-setup.js
```

Expected output: ✅ All required files are in place!

---

## Test Suite 1: Service Worker Registration

### Test 1.1: Service Worker Installs
1. Open `http://localhost:3000` in Chrome
2. Open DevTools (F12) → Application → Service Workers
3. ✅ Should see service worker registered for `/`
4. ✅ Status should be "activated and running"

### Test 1.2: Caches Created
1. DevTools → Application → Cache Storage
2. ✅ Should see caches: `lexora-v1-static`, `lexora-v1-api`, `lexora-v1-documents`

### Test 1.3: IndexedDB Created
1. DevTools → Application → IndexedDB
2. ✅ Should see `lexora-offline` database
3. ✅ Should have stores: cases, documents, contacts, time_entries, sync_queue, metadata

**Pass Criteria:** All 3 checks pass ✅

---

## Test Suite 2: Offline Detection

### Test 2.1: Offline Banner Shows
1. Open app
2. DevTools → Network → Set to "Offline"
3. ✅ Yellow banner appears at top: "You're offline"
4. ✅ Banner shows pending changes count (if any)

### Test 2.2: Online Banner Shows
1. Network → Set to "Online"
2. ✅ Green banner appears: "You're back online"
3. ✅ Banner auto-hides after 3 seconds

### Test 2.3: Manual Retry
1. Set to Offline
2. Click "Check connection" in banner
3. ✅ Shows checking status
4. ✅ Updates to offline status

**Pass Criteria:** All 3 checks pass ✅

---

## Test Suite 3: Data Download

### Test 3.1: Settings Page Loads
1. Go to `/settings/offline`
2. ✅ Page loads without errors
3. ✅ Toggle switch visible
4. ✅ Download data section visible

### Test 3.2: Enable Offline Mode
1. Click toggle switch
2. ✅ Switch turns blue
3. ✅ Success message appears
4. ✅ Service worker registered

### Test 3.3: Download Data
1. Select data types: Cases, Documents, Contacts
2. Click "Download Now"
3. ✅ Button shows "Downloading..."
4. ✅ Data downloads successfully
5. ✅ Success message appears
6. ✅ Storage size updates

### Test 3.4: Verify Downloaded Data
1. DevTools → Application → IndexedDB → lexora-offline
2. Click on "cases" store
3. ✅ Should see cases data
4. Repeat for documents, contacts
5. ✅ All data present

**Pass Criteria:** All 4 checks pass ✅

---

## Test Suite 4: Offline Usage

### Test 4.1: View Cases Offline
1. Go to `/cases`
2. DevTools → Network → Set to "Offline"
3. ✅ Cases list loads from cache
4. ✅ Can click and view case details
5. ✅ No error messages

### Test 4.2: Create Case Offline
1. While offline, click "New Case"
2. Fill in case details
3. Click "Create"
4. ✅ Case saves to IndexedDB
5. ✅ Request queues in sync_queue
6. ✅ Success message shows

### Test 4.3: Edit Case Offline
1. While offline, open an existing case
2. Edit case details
3. Save changes
4. ✅ Changes save to IndexedDB
5. ✅ Update queues in sync_queue

### Test 4.4: View Documents Offline
1. Go to `/documents`
2. ✅ Documents list loads
3. ✅ Can view document details
4. ✅ Can search documents (cached)

### Test 4.5: Offline Page Fallback
1. Clear all caches (DevTools → Application → Clear storage)
2. Go offline
3. Try to load a new page
4. ✅ Redirects to `/offline`
5. ✅ Shows offline message
6. ✅ Shows list of cached pages
7. ✅ Retry button works

**Pass Criteria:** All 5 checks pass ✅

---

## Test Suite 5: Data Synchronization

### Test 5.1: View Sync Queue
1. Create/edit items while offline (from Test Suite 4)
2. Go to `/settings/offline`
3. Scroll to Sync Progress section
4. ✅ Shows pending count > 0
5. ✅ Shows "Syncing X of Y changes"

### Test 5.2: Automatic Sync on Reconnect
1. Go back online (Network → No throttling)
2. ✅ Banner shows "Back online - Syncing changes"
3. ✅ Progress updates in real-time
4. ✅ Pending count decreases
5. Wait for sync to complete
6. ✅ Banner shows "All changes synced successfully"

### Test 5.3: Manual Sync
1. Create a change while offline
2. Go online
3. Go to `/settings/offline`
4. Click "Sync Now" button
5. ✅ Button shows "Syncing..."
6. ✅ Progress updates
7. ✅ Completes successfully

### Test 5.4: Failed Sync Retry
1. Go to DevTools → Network
2. Block a specific API endpoint (e.g., `/api/cases`)
3. Create a case while offline
4. Go online (but endpoint still blocked)
5. ✅ Sync fails
6. ✅ Failed count increases
7. Unblock endpoint
8. Click "Retry Failed"
9. ✅ Retry succeeds

**Pass Criteria:** All 4 checks pass ✅

---

## Test Suite 6: Sync Progress UI

### Test 6.1: Progress Display
1. Queue multiple changes offline
2. Go online
3. Watch `/settings/offline` page
4. ✅ Progress bar animates
5. ✅ Percentage updates
6. ✅ Stats update (pending/synced/failed)

### Test 6.2: Last Sync Time
1. Complete a sync
2. Check "Last synced" timestamp
3. ✅ Shows "X minutes ago"
4. Wait 1 minute, refresh
5. ✅ Updates to "X+1 minutes ago"

**Pass Criteria:** Both checks pass ✅

---

## Test Suite 7: Conflict Resolution

### Test 7.1: Create Conflict
1. Open case in browser A
2. Open same case in browser B
3. Edit different fields in both
4. Save in browser A (online)
5. Save in browser B (offline, then online)
6. ✅ Conflict detected
7. ✅ Conflict resolver UI appears

### Test 7.2: Resolve Conflict - Keep Mine
1. In conflict UI, click "Keep Mine"
2. ✅ Local changes preserved
3. ✅ Server updated with local data
4. ✅ Conflict removed from queue

### Test 7.3: Resolve Conflict - Use Server
1. Create another conflict
2. Click "Use Server"
3. ✅ Server data preserved
4. ✅ Local changes discarded
5. ✅ Conflict resolved

### Test 7.4: Bulk Resolution
1. Create multiple conflicts
2. Click "Keep My Changes" (bulk)
3. ✅ All conflicts resolved with local data
4. ✅ All conflicts removed

**Pass Criteria:** All 4 checks pass ✅

---

## Test Suite 8: PWA Installation

### Test 8.1: Install Prompt (Desktop)
1. Visit app in Chrome (desktop)
2. ✅ Install icon appears in address bar
3. Click install icon
4. ✅ Install prompt appears
5. Click "Install"
6. ✅ App installs as standalone app
7. ✅ App icon appears in taskbar/dock

### Test 8.2: Installed App Works Offline
1. Open installed app
2. Go offline
3. ✅ App continues working
4. ✅ Offline banner shows
5. Create/edit data
6. ✅ Changes queue for sync

### Test 8.3: App Shortcuts
1. Right-click installed app icon
2. ✅ Should see shortcuts: New Case, Cases, Documents
3. Click "New Case"
4. ✅ Opens directly to new case form

### Test 8.4: Install on Mobile (iOS)
1. Open app in Safari (iOS)
2. Tap Share button
3. Tap "Add to Home Screen"
4. ✅ Icon added to home screen
5. Tap icon to launch
6. ✅ Opens in standalone mode
7. ✅ Works offline

### Test 8.5: Install on Mobile (Android)
1. Open app in Chrome (Android)
2. ✅ Install banner appears
3. Tap "Install"
4. ✅ App installs
5. ✅ Icon on home screen
6. ✅ Works offline

**Pass Criteria:** 3/5 checks pass (test platforms available) ✅

---

## Test Suite 9: Settings & Configuration

### Test 9.1: Sync Frequency
1. Go to `/settings/offline`
2. Change "Sync Frequency" to "Hourly"
3. Click "Save Settings"
4. ✅ Settings saved
5. ✅ Refresh page, setting persists

### Test 9.2: Data Retention
1. Change "Data Retention" to "7 days"
2. Save settings
3. ✅ Setting saved
4. ✅ Old data cleared (check IndexedDB)

### Test 9.3: Clear Offline Data
1. Download some data
2. Click "Clear All Offline Data"
3. Confirm dialog
4. ✅ All caches cleared
5. ✅ IndexedDB cleared
6. ✅ Storage size = 0 bytes
7. Check DevTools
8. ✅ Cache Storage empty
9. ✅ IndexedDB empty

### Test 9.4: Estimate Size
1. Select data types
2. Click "Estimate Size"
3. ✅ Shows estimated size (e.g., "5.2 MB")
4. Change selections
5. ✅ Estimate updates

**Pass Criteria:** All 4 checks pass ✅

---

## Test Suite 10: Edge Cases

### Test 10.1: Large Dataset
1. Create 1000+ cases (or use seed data)
2. Download all data
3. ✅ Download completes without timeout
4. ✅ App remains responsive
5. ✅ Pagination works offline

### Test 10.2: Slow Network
1. DevTools → Network → Slow 3G
2. Download data
3. ✅ Progress indicator shows
4. ✅ Download completes
5. ✅ No errors

### Test 10.3: Network Interruption
1. Start downloading data
2. Halfway through, go offline
3. ✅ Download pauses
4. Go back online
5. ✅ Download resumes

### Test 10.4: Multiple Tabs
1. Open app in 2 tabs
2. Make changes in tab 1 (offline)
3. Go online
4. ✅ Changes sync in tab 1
5. Refresh tab 2
6. ✅ Changes visible in tab 2

### Test 10.5: Browser Restart
1. Download data and go offline
2. Close browser completely
3. Reopen browser
4. Go to app (still offline)
5. ✅ Data still available
6. ✅ App works offline

**Pass Criteria:** All 5 checks pass ✅

---

## Final Verification

### Checklist
- [ ] All 10 test suites completed
- [ ] All critical tests pass (min 80%)
- [ ] No console errors
- [ ] No network errors (when online)
- [ ] Service worker active
- [ ] IndexedDB populated
- [ ] Sync works both ways
- [ ] PWA installable
- [ ] Offline usage smooth
- [ ] Documentation accurate

### Bug Report Template
```markdown
**Test:** [Test Suite X.Y]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Steps to Reproduce:**
1. ...
2. ...
3. ...
**Console Errors:** [Paste any errors]
**Screenshots:** [If applicable]
```

---

## Performance Benchmarks

### Target Metrics
- **Service Worker Registration:** < 1 second
- **Data Download (1000 items):** < 10 seconds
- **Sync (100 changes):** < 5 seconds
- **Offline Load Time:** < 500ms (from cache)
- **Storage Overhead:** < 50% of actual data size

### Measurement Tools
- Chrome DevTools → Performance
- Lighthouse (PWA audit)
- Network tab (timing)

---

## Sign-Off

**Tested by:** _____________  
**Date:** _____________  
**Build Version:** _____________  
**Browser:** _____________  
**OS:** _____________  

**Overall Status:** ☐ PASS ☐ FAIL ☐ PASS WITH ISSUES

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

**🎉 Offline Mode Testing Complete!**

All tests pass = Production ready! 🚀
