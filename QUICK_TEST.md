# ⚡ QUICK TEST - 5 Minute Verification

Run these steps in the browser console at `http://localhost:8000` to verify Layer 2 is working:

## Step 1: Check Initialization (copy-paste in console)
```javascript
console.log("🔍 Checking app state...");
console.log("APP initialized?", window.__APP__ !== undefined);
console.log("Router exists?", window.__APP__?.router !== undefined);
console.log("DbAdapter exists?", window.__APP__?.dbAdapter !== undefined);
```

**Expected:** All three should be `true`

## Step 2: Check Data Access
```javascript
// Get variation config
const config = await window.__APP__.dbAdapter.obtenerDocumento("config", "variacionActual");
console.log("Variation config:", config);
```

**Expected:** Should see object with `key: "variacionActual"` and nested `value` object with exercise data

## Step 3: Test Navigation
```javascript
// Switch to Workout screen
window.__APP__.router.goToTab("workout");
window.__APP__.controller.renderScreen("workout");
console.log("Current tab:", window.__APP__.router.getCurrentTab());
```

**Expected:** Page shows WORKOUT screen, console shows `"workout"`

## Step 4: Test Back to Home
```javascript
// Switch back to Home
window.__APP__.router.goToTab("home");
window.__APP__.controller.renderScreen("home");
```

**Expected:** Back to HOME screen with greeting and variation card

## Step 5: Check All Screens Load
```javascript
// Try each screen
["home", "workout", "history", "settings"].forEach(screen => {
  window.__APP__.router.goToTab(screen);
  window.__APP__.controller.renderScreen(screen);
  console.log(`✅ ${screen} loaded`);
});
```

**Expected:** All 4 screens load without errors

## Step 6: Verify No Errors
Open DevTools (F12) and check:
- ✅ Console tab is clear (no red errors)
- ✅ Network tab shows all files loaded (green 200s)
- ✅ Application > IndexedDB shows "gym-app" database with 4 stores

## Manual Test Flow

1. **Go to HOME** - See greeting + variation + exercises
2. **Click "Comenzar Entrenamiento"** - Navigate to WORKOUT
3. **Enter weight** (e.g., 75.5) in the input field
4. **Click "Serie OK"** - Weight should be saved to database
5. **Go to HISTORY** - See the saved weight in the table
6. **Go to SETTINGS** - See sync status and options
7. **Refresh page** - Data should persist (check HISTORY still has weight)

## Expected Behavior

| Screen | Should Show |
|--------|------------|
| HOME | Greeting, variation card, exercise list |
| WORKOUT | Timer, current exercise, weight input, action buttons |
| HISTORY | Exercise filter, stats (max/avg), data table |
| SETTINGS | Sync status, Google button, dark mode toggle, clear data button |

## If Something Breaks

1. **Blank screen?** Check console for errors (F12)
2. **No data?** Refresh page, check IndexedDB (DevTools > Application > IndexedDB > gym-app)
3. **Navigation not working?** Click on nav icons at bottom (🏠 💪 📊 ⚙️)
4. **Errors about "obtenerDocumento"?** DatabaseAdapter not initialized - check main.js imports

## Success Criteria

✅ All 4 screens load and navigate smoothly  
✅ Weights can be saved (WORKOUT → input weight → "Serie OK")  
✅ Saved weights appear in HISTORY table  
✅ Data persists after page refresh  
✅ No console errors (except maybe warnings about dark mode placeholder)  
✅ Bottom nav shows active state (highlight on current tab)  

**If all ✅ pass: Layer 2 is READY! You can proceed to Layer 3 (Google Drive Sync)**

---

See `TESTING_GUIDE.md` for comprehensive tests  
See `FIXES_APPLIED.md` for technical details of what was fixed
