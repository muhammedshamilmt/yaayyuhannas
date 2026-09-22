# 🔥 Firebase Configuration Troubleshooting

## Current Error
`FirebaseError: Firebase: Error (auth/configuration-not-found)`

## Possible Causes & Solutions

### 1. **Firebase Project Setup Issues**

The error suggests that the Firebase project configuration is not properly set up. Here are the steps to fix it:

#### A. Verify Firebase Project Settings
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wattaqa2k25-e04a8`
3. Go to **Project Settings** (gear icon)
4. In the **General** tab, verify your project configuration matches:
   - Project ID: `wattaqa2k25-e04a8`
   - Web API Key: `AIzaSyAzGdDSntSR6EwvHrYv4APWB4cPgwdjnC8`

#### B. Enable Authentication
1. In Firebase Console, go to **Authentication**
2. Click **Get Started** if not already enabled
3. Go to **Sign-in method** tab
4. Enable **Google** as a sign-in provider
5. Add your domain to **Authorized domains**:
   - `localhost` (for development)
   - Your production domain (if any)

#### C. Configure OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `wattaqa2k25-e04a8`
3. Go to **APIs & Services** > **OAuth consent screen**
4. Configure the consent screen with:
   - App name: "WATTAQA 2K25"
   - User support email: Your email
   - Authorized domains: Add your domains

### 2. **Domain Authorization Issues**

#### Add Authorized Domains
In Firebase Console > Authentication > Settings > Authorized domains:
- Add `localhost` for development
- Add `127.0.0.1` for local testing
- Add your production domain

### 3. **Environment Variables Issues**

#### Verify Environment Variables
Check that all Firebase environment variables are properly set in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAzGdDSntSR6EwvHrYv4APWB4cPgwdjnC8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wattaqa2k25-e04a8.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wattaqa2k25-e04a8
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wattaqa2k25-e04a8.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1055515910417
NEXT_PUBLIC_FIREBASE_APP_ID=1:1055515910417:web:bf2cdbaadad6b75fe46cb0
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-7YHF3F89KQ
```

#### Restart Development Server
After updating environment variables:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 4. **Testing Steps**

#### A. Test Firebase Configuration
1. Visit: `http://localhost:3000/test-firebase`
2. Check browser console for detailed error messages
3. Look for Firebase configuration logs

#### B. Check Browser Console
Open Developer Tools (F12) and look for:
- Firebase initialization messages
- Configuration errors
- Network errors

### 5. **Alternative Solutions**

#### A. Create New Firebase Web App
If the current configuration doesn't work:
1. Go to Firebase Console > Project Settings
2. Scroll down to "Your apps"
3. Click "Add app" > Web (</>) 
4. Register a new web app
5. Copy the new configuration
6. Update your `.env.local` file

#### B. Use Firebase CLI
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select Authentication and Hosting
```

### 6. **Quick Fix Attempt**

Try this immediate fix:

1. **Clear browser cache and cookies**
2. **Restart development server**
3. **Test with**: `http://localhost:3000/test-firebase`

### 7. **Debug Information**

The Firebase configuration now includes debug logging. Check your browser console for:
- Firebase Config details
- Initialization status
- Specific error codes

### 8. **Contact Support**

If none of the above solutions work:
1. Check Firebase Console for any service outages
2. Verify your Google Cloud billing account is active
3. Ensure the Firebase project hasn't been suspended

## Test URLs

- **Firebase Test Page**: `http://localhost:3000/test-firebase`
- **Login Page**: `http://localhost:3000/login`
- **Main App**: `http://localhost:3000`

## Next Steps

1. **First**: Try the test page to isolate the issue
2. **Second**: Check Firebase Console settings
3. **Third**: Verify domain authorization
4. **Fourth**: Consider creating a new Firebase web app configuration

The enhanced error handling will provide more specific error messages to help identify the exact issue.