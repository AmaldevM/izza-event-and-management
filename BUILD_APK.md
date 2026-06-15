# How to Build the Standalone APK locally 📱

Now that you have cloned the repository and installed Android Studio, follow these steps to build the APK (`.apk`) directly on your machine.

---

## 🛠️ Step 1: Install Node Dependencies
Before building, make sure all package dependencies are installed locally. Open a terminal (CMD or PowerShell) in the project folder (`C:\Projects\izza-catering`) and run:

```bash
npm install
```

---

## ⚙️ Step 2: Generate the Android Native Folder
The project configuration has been upgraded to **Expo SDK 54** (React Native 0.81). To sync the native Android project with these new versions, run the following command in your terminal:

```bash
npx expo prebuild --platform android
```
*This command will create/update the `./android` folder with all the correct Gradle files, launcher icons, and splash screens generated from your `assets/` folder.*

---

## 🏗️ Step 3: Build the APK (Choose Method A or B)

### Method A: Build inside Android Studio (Recommended & Visual)
1. **Open Android Studio**.
2. Click **Open** (or **File > Open**) and select the **`android`** folder (inside `C:\Projects\izza-catering\android`).
   > ⚠️ **Important:** Do not open the root `izza-catering` folder. Make sure to open the **`android`** sub-folder specifically, as that is the native Gradle project.
3. Wait for Android Studio to finish the Gradle Sync (progress bar is in the bottom status bar). This will automatically fetch the Android SDK and compile dependencies.
4. In the top menu, go to:
   **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. Once the build finishes, a notification popup will appear in the bottom-right corner. Click **"locate"** to find your compiled `app-debug.apk` file!

---

### Method B: Build from the Terminal (Fastest)
Open a terminal in the project directory and run:

1. Navigate to the android folder:
   ```powershell
   cd android
   ```
2. Stop any locking Gradle daemons:
   ```powershell
   .\gradlew.bat --stop
   ```
3. Run the Gradle build task:
   ```powershell
   .\gradlew.bat assembleDebug
   ```
4. Once completed, your APK will be located at:
   `C:\Projects\izza-catering\android\app\build\outputs\apk\debug\app-debug.apk`

---

## 📲 Step 4: Install the APK on Your Phone
1. Transfer the `app-debug.apk` file to your Android phone (via USB, Google Drive, WhatsApp, etc.).
2. Open the file on your phone.
3. If prompted, allow "Install from Unknown Sources".
4. Install and open the app! 🎉
