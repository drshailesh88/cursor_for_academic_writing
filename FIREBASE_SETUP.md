# Firebase Setup Guide

## 🔥 Setting Up Firebase for Your Academic Writing App

Follow these steps to configure Firebase for authentication and document storage.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `academic-writer` (or any name you prefer)
4. Click **Continue**
5. Disable Google Analytics (optional) or keep it enabled
6. Click **Create project**
7. Wait for project creation, then click **Continue**

---

## Step 2: Add a Web App

1. In Firebase Console, click the **Web icon (</>) ** to add a web app
2. Enter app nickname: `Academic Writing Web App`
3. **Check** "Also set up Firebase Hosting" (optional)
4. Click **Register app**
5. Copy the Firebase config object (you'll need this in Step 4)
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123:web:abc123"
   };
   ```
6. Click **Continue to console**

---

## Step 3: Enable Google Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **Get started**
3. Click on **Google** in the "Sign-in providers" list
4. Toggle **Enable**build authentication
5. Select a **Project support email** from the dropdown
6. Click **Save**

---

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll add rules next)
4. Select a location close to you (e.g., `us-central1`)
5. Click **Enable**

### Add Security Rules:

1. Click on the **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Documents collection
    match /documents/{documentId} {
      allow read, write: if request.auth != null &&
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
                      request.auth.uid == request.resource.data.userId;
    }

    // Citations collection (optional)
    match /citations/{citationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

---

## Step 5: Create Service Account for Admin SDK

1. In Firebase Console, click the **⚙️ Settings** icon → **Project settings**
2. Go to the **Service accounts** tab
3. Click **Generate new private key**
4. Click **Generate key** in the confirmation dialog
5. **Save the JSON file** securely (you'll need it in Step 6)

---

## Step 6: Configure Environment Variables

1. Open `/Users/shaileshsingh/cursor for academic writing/.env.local`

2. Fill in your Firebase config from Step 2:

```bash
# Firebase Client Config (from Step 2)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
```

3. Fill in your Firebase Admin SDK config from Step 5 (from the JSON file):

```bash
# Firebase Admin SDK (from Step 5 JSON file)
FIREBASE_ADMIN_PROJECT_ID=your-project
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT:**
- Keep the quotes around `FIREBASE_ADMIN_PRIVATE_KEY`
- Keep the `\n` newline characters in the private key

---

## Step 7: Restart the Dev Server

```bash
cd "/Users/shaileshsingh/cursor for academic writing"
# Kill the current dev server (Ctrl+C)
npm run dev
```

---

## Step 8: Test the Integration

1. Open http://localhost:2550 in your browser
2. You should see the sign-in screen
3. Click **"Sign in with Google"**
4. Sign in with your Google account
5. You should be redirected to the editor
6. Start typing - your content will auto-save every 30 seconds
7. Check the top-right corner for "Saved X ago" status
8. Create a new document using the "New Document" button in the left panel

---

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Google Authentication enabled
- [ ] Firestore Database created with security rules
- [ ] Service account JSON downloaded
- [ ] `.env.local` file updated with all credentials
- [ ] Dev server restarted
- [ ] Sign-in working
- [ ] Document creation working
- [ ] Auto-save working (check save status in top-right)
- [ ] Document list showing in left panel

---

## 🐛 Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add `localhost` to the list

### "Permission denied" errors
- Double-check Firestore security rules (Step 4)
- Make sure you're signed in

### "Invalid API key"
- Verify all environment variables in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart the dev server

### Auto-save not working
- Check browser console for errors
- Verify Firestore rules allow write access
- Make sure you're signed in

---

## 📚 What's Next?

Once Firebase is set up and working:
1. ✅ Authentication - DONE
2. ✅ Document persistence - DONE
3. ✅ Auto-save - DONE
4. ⏳ DOCX Export - Coming next
5. ⏳ PDF Export - Coming next

Your documents are now securely saved in Firebase and will be available on any device where you sign in!

---

**Need Help?**
If you encounter issues, check the browser console (F12) for error messages.
