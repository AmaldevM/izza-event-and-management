# How to Run the IZZA Catering App

## Current Issue
The folder name **"IZZA caters and Events"** has spaces, which is causing Expo to fail on Windows.

## Solution: Rename the Folder

### Option 1: Quick Fix (Recommended)
1. Close VS Code
2. Rename the folder to remove spaces:
   - Old name: `D:\IZZA caters and Events`
   - **New name: `D:\IZZA-caters-and-Events`** (or `D:\izza-catering`)

3. Reopen the renamed folder in VS Code
4. Run the app:
   ```bash
   npm start
   ```

### Option 2: Move to a New Location
Create a new folder without spaces:
```bash
# Create new folder
mkdir D:\izza-catering

# Copy all files
xcopy "D:\IZZA caters and Events\*" "D:\izza-catering\" /E /I /H

# Open the new folder
cd D:\izza-catering
npm start
```

## After Renaming

Once you've renamed the folder, run:

```bash
npm start
```

You should see:
- A QR code in your terminal
- Text saying "Metro waiting on..."
- Instructions to press `a` for Android or `i` for iOS

## Then:
1. **Install Expo Go** app on your phone (from Play Store/App Store)
2. **Scan the QR code** with your phone camera
3. **Open in Expo Go** when prompted
4. Your app will load! 🎉

## Testing the App

1. **Register** as a new user (choose "User" role)
2. **Login** with your credentials
3. **Submit an event** request
4. You'll see the event in "My Events"

For testing Admin/Worker features:
- You'll need to manually change the user role in Firebase Firestore
- Go to Firebase Console → Firestore → users → select your user → change `role` field

---

## Important: Update GitHub After Renaming

If you rename the folder, update your git remote:

```bash
cd "D:\your-new-folder-name"
git remote -v  # Check current remote
# Remote should still point to: https://github.com/AmaldevM/izza-event-and-management.git
# If needed, you can push updates with:
git push
```

Your code is already on GitHub, so this is just for local development!
