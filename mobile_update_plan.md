# 🏛️ The Critic's Temple: Mobile Distribution & Update Plan

This document outlines how to distribute the app and ensure end-users always have the latest version.

---

## 🌎 1. User Distribution (Production)

For real users, you want them to either get updates automatically or be prompted in-app to download the latest version.

### 🟢 Method A: Google Play Store (Official)
The most trusted method for Android users.
- **Workflow**: 
  1. Generate a signed **App Bundle (.aab)** in Android Studio.
  2. Upload to **Google Play Console**.
  3. Google handles distribution and "Delta Updates" (only downloading what changed).
- **Pros**: Automatic updates, high trust, security scans.
- **Cons**: Verification can take 1-7 days.

### 🔵 Method B: Self-Hosted Direct Download (with Version Check)
If you don't want to use the Play Store, you can host the APK on your own server/website.
- **Workflow**:
  1. Host `app-release.apk` on `https://critiquetemple.vercel.app/download`.
  2. Create a small `version.json` file on your server: `{"version": "1.0.5", "url": "..."}`.
  3. **In-App Logic**: When the app starts, it fetches this JSON. If the server version > current app version, it shows a popup: *"A new version 1.0.5 is available! [Download Now]"*.
- **Implementation**: I can help you add this "Update Prompt" logic to `App.jsx`.

---

## ⚡ 2. Over-The-Air (OTA) Updates (Web Assets)

Your current **Capgo** setup is perfect for **instant** updates of the design and logic without requiring a new APK download.

- **Usage**: Use this for bug fixes in React, new UI features, or updated CSS.
- **How to Push**: 
  ```bash
  cd public-enclave
  npm run build
  npx capgo bundle upload --app-id com.sanctuary.app --channel production
  ```
- **Limitation**: Cannot update native features (e.g., adding a new plugin like a Camera plugin).

---

## 🧪 3. Internal Testing (For You)

For your own development and quick testing.

### 🟠 Method C: Firebase App Distribution
- **Usage**: Push new APKs to your own phone instantly.
- **Experience**: You get a notification, click update, and the APK is swapped.

---

## 🛠️ Recommended Hybrid Strategy for "Users"

For the best user experience, I recommend the **Hybrid Approach**:

1.  **Initial Install**: User downloads the APK from your website or Play Store.
2.  **Design/Logic Updates**: You push via **Capgo** (Users get it automatically when they open the app).
3.  **Critical Native Updates**: If you add a new plugin, use the **In-App Update Prompt** (Method B) to tell users they need to download a new APK to keep using the latest features.

**Would you like me to implement the "Version Check" logic in the app so you can prompt users to update their APK?**
