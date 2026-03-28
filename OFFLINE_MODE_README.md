# LEXORA Offline Mode - Complete Implementation

## 🎯 Overview

LEXORA now has full offline support, allowing users to work seamlessly without internet connection. All changes are automatically synced when connection is restored.

## ✅ What's Implemented

### 1. **Service Worker (`public/sw.js`)**
- ✅ Caches static assets (CSS, JS, images)
- ✅ Caches API responses (cases, documents, contacts, time entries)
- ✅ Network First strategy for API calls
- ✅ Cache First strategy for static assets
- ✅ Stale While Revalidate for documents/images
- ✅ Automatic cache updates on new deployment
- ✅ Old cache cleanup

### 2. **PWA Manifest (`public/manifest.json`)**
- ✅ App metadata and icons
- ✅ Standalone display mode
- ✅ Theme colors
- ✅ Shortcuts (New Case, Cases, Documents, etc.)
- ✅ Installable on mobile and desktop

### 3. **IndexedDB Storage (`lib/offline/indexeddb.ts`)**
- ✅ Wrapper for offline data storage
- ✅ Stores cases, documents, contacts, time entries
- ✅ Sync queue storage
- ✅ Metadata storage (last sync time, etc.)
- ✅ Automatic cleanup of old data

### 4. **Network Detection (`lib/offline/network.ts`)**
- ✅ Real-time online/offline status
- ✅ Periodic connectivity checks (every 30s when online, 10s when offline)
- ✅ Network quality metrics (downlink, RTT, etc.)
- ✅ React hooks (`useNetwork`, `useNetworkStatus`)

### 5. **Sync Queue (`lib/offline/sync-queue.ts`)**
- ✅ Queue failed API calls when offline
- ✅ Auto-retry when back online
- ✅ Priority-based syncing
- ✅ Conflict detection
- ✅ Retry logic with max attempts
- ✅ Progress tracking

### 6. **Data Sync (`lib/offline/data-sync.ts`)**
- ✅ Full sync (initial download)
- ✅ Incremental sync (only changed data)
- ✅ Last sync timestamp tracking
- ✅ Estimated download size calculation

### 7. **UI Components**

#### Offline Status Banner (`components/offline/status-banner.tsx`)
- ✅ Shows at top when offline
- ✅ "You're offline. Changes will sync when you're back online."
- ✅ Auto-hide when back online
- ✅ Shows sync progress (syncing X/Y changes)

#### Sync Progress (`components/offline/sync-progress.tsx`)
- ✅ Visual progress bar
- ✅ Stats (pending, synced, failed)
- ✅ Manual sync button
- ✅ Retry failed button

#### Conflict Resolver (`components/offline/conflict-resolver.tsx`)
- ✅ Side-by-side comparison (your version vs server version)
- ✅ Choose resolution (keep mine, use server, merge)
- ✅ Bulk resolution options

### 8. **Pages**

#### Offline Page (`app/offline/page.tsx`)
- ✅ Shows when app can't load
- ✅ Indicates offline status
- ✅ Lists cached pages available
- ✅ Retry button

#### Offline Settings (`app/(authenticated)/settings/offline/page.tsx`)
- ✅ Enable/disable offline mode
- ✅ Sync frequency (manual, hourly, daily)
- ✅ Data retention (7/30/90 days, forever)
- ✅ Clear offline data button
- ✅ Download all data button
- ✅ Storage size display
- ✅ Data type selection (cases, documents, contacts, time entries)

### 9. **API Endpoints**

#### Sync API (`app/api/sync/`)
- ✅ `/api/sync/estimate` - Estimate download size
- ✅ `/api/sync/[type]` - Incremental sync (since timestamp)
- ✅ `/api/sync/[type]/all` - Full data download
- ✅ `/api/health` - Connectivity check endpoint

## 📦 Installation

### 1. **Generate PWA Icons**

You need to create PWA icons in various sizes. Use a tool like [PWA Asset Generator](https://www.npmjs.com/package/pwa-asset-generator):

```bash
cd lexora
npx pwa-asset-generator public/logo.png public/ --background "#ffffff" --padding "10%"
```

Or manually create these icons and place them in `public/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

### 2. **Update Database Schema** (if needed)

Make sure your tables have `updated_at` timestamps for incremental sync:

```sql
ALTER TABLE cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

### 3. **No Additional Dependencies**

All offline features use native browser APIs:
- Service Worker API
- IndexedDB
- Cache API
- Network Information API

No extra npm packages needed!

### 4. **Deploy**

Just deploy as usual:

```bash
npm run build
npm start
```

The service worker will be automatically registered on first page load.

## 🧪 Testing

### Test Offline Mode

1. **Chrome DevTools:**
   - Open DevTools (F12)
   - Go to **Network** tab
   - Set throttling to **Offline**
   - Try using the app

2. **Application Tab:**
   - Go to **Application** tab
   - Check **Service Workers** - should show registered
   - Check **Cache Storage** - should show cached assets
   - Check **IndexedDB** - should show `lexora-offline` database

3. **Test Sync:**
   - Go offline
   - Create/edit a case
   - Go back online
   - Watch the sync banner - it should sync automatically

### Test PWA Installation

1. **Desktop (Chrome):**
   - Visit the app
   - Click the install icon in the address bar
   - Or: Menu → Install LEXORA

2. **Mobile (iOS):**
   - Open in Safari
   - Tap Share button
   - Tap "Add to Home Screen"

3. **Mobile (Android):**
   - Open in Chrome
   - Tap the three dots menu
   - Tap "Install app" or "Add to Home Screen"

## 🎨 Features

### Read-Only Offline Mode
Users can:
- ✅ View cases, documents, contacts
- ✅ Search cached data
- ✅ View cached reports

### Read-Write Offline Mode
Users can:
- ✅ Create/edit cases offline
- ✅ Add time entries offline
- ✅ Upload documents offline (queued)
- ✅ All changes sync when online

### Conflict Resolution
When offline changes conflict with server data:
- Shows side-by-side comparison
- User chooses: keep mine, use server, or merge manually
- Bulk resolution options

### Progressive Web App
- ✅ Install on mobile/desktop
- ✅ Offline-first
- ✅ App-like experience
- ✅ App shortcuts
- ✅ Splash screen

## 🔧 Configuration

### Offline Settings Location
`/settings/offline`

### Cache Strategy

| Resource Type | Strategy | Description |
|--------------|----------|-------------|
| API calls | Network First | Try network, fallback to cache |
| Static assets | Cache First | Serve cache, update in background |
| Documents/Images | Stale While Revalidate | Serve cache, update in background |

### Default Settings

```typescript
{
  syncFrequency: 'manual',    // manual | hourly | daily
  dataRetention: 30,          // days
  maxRetries: 3,              // retry attempts for failed syncs
  cacheVersion: 'lexora-v1'   // update to invalidate all caches
}
```

## 🚀 Performance

### Optimizations
- ✅ Lazy-load offline data (on-demand)
- ✅ Pagination for large datasets
- ✅ Battery-friendly (doesn't sync constantly)
- ✅ Respects network conditions (doesn't download 10GB on cellular)

### Storage Limits
- Desktop Chrome: ~80% of disk space
- Mobile Chrome: ~50% of available storage
- Safari: ~1GB

## 🔒 Security

### Implemented
- ✅ All offline data is scoped to user's firm
- ✅ Authentication required for sync endpoints
- ✅ Offline data cleared on logout (optional)

### TODO (Optional Enhancements)
- ⚠️ Encrypt IndexedDB data at rest
- ⚠️ Encrypt sync queue items
- ⚠️ Implement data sanitization before caching

## 📊 Monitoring

### Check Service Worker Status
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW State:', reg?.active?.state);
});
```

### Check Cache Size
```javascript
navigator.storage.estimate().then(estimate => {
  console.log('Storage used:', estimate.usage, 'bytes');
  console.log('Storage quota:', estimate.quota, 'bytes');
});
```

### Check Network Status
```javascript
console.log('Online:', navigator.onLine);
```

## 🐛 Troubleshooting

### Service Worker Not Registering
1. Check HTTPS (required for SW)
2. Check `/sw.js` is accessible
3. Check browser console for errors
4. Try: Unregister old SW in DevTools → Application → Service Workers

### Data Not Syncing
1. Check network status (DevTools → Network)
2. Check sync queue: `/settings/offline`
3. Check API endpoints are working
4. Check browser console for errors

### Cache Not Working
1. Clear all caches: `/settings/offline` → Clear Offline Data
2. Hard refresh (Ctrl+Shift+R)
3. Check Cache Storage in DevTools → Application

### PWA Not Installing
1. Check manifest.json is valid
2. Check icons exist and are accessible
3. Check HTTPS (required for PWA)
4. Check browser supports PWA (Chrome, Edge, Safari 16.4+)

## 🎉 Next Steps (Optional Enhancements)

### Phase 2 (Nice to Have)
- [ ] Background sync for uploads
- [ ] Push notifications for sync complete
- [ ] Offline analytics (track offline usage)
- [ ] Smarter conflict resolution (auto-merge)
- [ ] Offline-first search (full-text search in IndexedDB)

### Phase 3 (Advanced)
- [ ] Peer-to-peer sync (when multiple devices offline)
- [ ] Differential sync (only send changed fields)
- [ ] Compression for large datasets
- [ ] Selective sync (choose specific cases to download)

## 📝 Files Created

```
lexora/
├── public/
│   ├── sw.js                                    ✅ Service worker
│   ├── manifest.json                            ✅ PWA manifest
│   └── icon-*.png                               ⚠️ TODO: Generate icons
├── lib/offline/
│   ├── indexeddb.ts                             ✅ IndexedDB wrapper
│   ├── network.ts                               ✅ Network detection
│   ├── service-worker.ts                        ✅ SW registration
│   ├── sync-queue.ts                            ✅ API call queue
│   └── data-sync.ts                             ✅ Data synchronization
├── components/offline/
│   ├── status-banner.tsx                        ✅ Offline indicator
│   ├── sync-progress.tsx                        ✅ Sync progress UI
│   └── conflict-resolver.tsx                    ✅ Conflict resolution UI
├── components/providers/
│   └── offline-provider.tsx                     ✅ Offline provider
├── app/offline/
│   └── page.tsx                                 ✅ Offline fallback page
├── app/(authenticated)/settings/offline/
│   └── page.tsx                                 ✅ Offline settings
└── app/api/
    ├── health/route.ts                          ✅ Health check
    └── sync/
        ├── route.ts                             ✅ Sync estimate
        ├── [type]/route.ts                      ✅ Incremental sync
        └── [type]/all/route.ts                  ✅ Full data download
```

## 🎬 Demo Script

### For Testing / Demo

1. **Open LEXORA in Chrome**
2. **Go to Settings → Offline** (`/settings/offline`)
3. **Enable Offline Mode** (toggle switch)
4. **Download Data:**
   - Select data types (cases, documents, contacts)
   - Click "Download Now"
   - Wait for download to complete
5. **Go Offline:**
   - Open DevTools (F12)
   - Network tab → Set to "Offline"
6. **Test Offline Features:**
   - Browse cases
   - View documents
   - Create a new case
   - Edit an existing case
7. **Go Back Online:**
   - Network tab → Set to "No throttling"
   - Watch the sync banner
   - Changes automatically sync
8. **Install as PWA:**
   - Click install icon in address bar
   - Launch installed app
   - Works like a native app!

## ✨ Success!

Your LEXORA app now works seamlessly offline! 🎉

Users can work without internet and all changes sync automatically when connection is restored.
