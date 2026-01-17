# IZZA Catering & Event Management System 📱

![IZZA Logo](./original-777583a22f5a93d354b63c9413579bff.webp)

> A comprehensive React Native mobile application for digitalizing event planning and catering services

## 📋 Overview

IZZA Catering & Event Management System is a role-based mobile application designed to streamline the complete workflow of event planning and catering services. The system replaces unstructured communication methods with a centralized platform that connects users, administrators, and workers in a secure and transparent environment.

## 🎯 Key Features

- **📅 Event Management** - Request, approve, and track events
- **👥 Worker Coordination** - Efficient staff assignment and scheduling
- **✅ Attendance Tracking** - Real-time check-in/check-out system
- **💰 Payment Management** - Transparent financial tracking
- **🔔 Real-time Notifications** - Instant updates via Firebase Cloud Messaging
- **📊 Role-based Dashboards** - Customized views for Users, Admins, and Workers

## 👥 User Roles

### 1. User (Customer)
- Register and submit event requests
- View event approval status
- Receive real-time notifications
- Track event progress

### 2. Admin
- Full CRUD operations on events
- Approve/reject event requests
- Assign workers to events
- Broadcast notifications to all workers
- View calendar-based event schedules
- Track worker attendance and payments

### 3. Worker (Catering Staff)
- Register personal and payment details
- View approved events in calendar format
- Accept assigned events
- Mark attendance on event days
- Track earnings and pending payments

## 🛠️ Technology Stack

### Frontend
- **React Native** with **Expo** - Cross-platform mobile development
- **TypeScript** - Type-safe code
- **React Navigation** - Screen navigation
- **React Native Paper** - Material Design UI components
- **React Native Calendars** - Calendar views
- **Expo Vector Icons** - Beautiful icons

### Backend (Firebase)
- **Firebase Authentication** - Secure email/password auth
- **Firestore** - NoSQL real-time database
- **Firebase Storage** - Image uploads
- **Firebase Cloud Messaging** - Push notifications
- **Firebase Security Rules** - Data protection

## 📁 Project Structure

```
IZZA-Catering-Mobile/
├── App.tsx                    # Root component
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── firebase.config.ts         # Firebase setup
│
├── src/
│   ├── navigation/            # App navigation
│   │   └── AppNavigator.tsx
│   │
│   ├── screens/               # All app screens
│   │   ├── auth/              # Login & Register
│   │   ├── user/              # Customer screens
│   │   ├── admin/             # Admin management
│   │   └── worker/            # Worker screens
│   │
│   ├── components/            # Reusable UI components
│   ├── services/              # Firebase service layer
│   ├── context/               # React Context (Auth, etc.)
│   ├── types/                 # TypeScript definitions
│   └── utils/                 # Helper functions
│
├── assets/                    # Images, fonts
└── README.md
```

## 🗄️ Firestore Database Schema

### Collections

**users**
```typescript
{
  email: string
  name: string
  phone: string
  role: 'user' | 'admin' | 'worker'
  workerDetails?: {
    bankAccount: string
    ifscCode: string
    upiId: string
  }
  createdAt: timestamp
}
```

**events**
```typescript
{
  title: string
  description: string
  eventDate: timestamp
  location: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  userId: string
  assignedWorkers: string[]
  createdAt: timestamp
}
```

**attendance**
```typescript
{
  eventId: string
  workerId: string
  checkInTime: timestamp
  checkOutTime?: timestamp
  earnings: number
}
```

**payments**
```typescript
{
  workerId: string
  eventId: string
  amount: number
  status: 'pending' | 'paid'
  paidAt?: timestamp
}
```

**notifications**
```typescript
{
  recipientId: string  // or 'all' for broadcast
  title: string
  message: string
  type: string
  read: boolean
  createdAt: timestamp
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS/Android)
- Firebase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/izza-catering-mobile.git
cd izza-catering-mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **Firebase Setup**

   a. Go to [Firebase Console](https://console.firebase.google.com/)
   
   b. Create a new project named "IZZA Catering"
   
   c. Enable these services:
      - Authentication → Email/Password
      - Firestore Database
      - Storage
      - Cloud Messaging
   
   d. Add an app (iOS/Android)
   
   e. Copy your Firebase config

4. **Configure Firebase**

Create or update `firebase.config.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

5. **Setup Firestore Security Rules**

In Firebase Console → Firestore → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin() || isOwner(resource.data.userId);
      allow delete: if isAdmin();
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Payments collection
    match /payments/{paymentId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isOwner(resource.data.recipientId);
      allow delete: if isAdmin();
    }
  }
}
```

6. **Run the app**
```bash
npm start
```

Then:
- Scan the QR code with **Expo Go** app (iOS/Android)
- Press `a` for Android emulator
- Press `i` for iOS simulator (Mac only)

## 📱 App Features

### Authentication & Authorization
- ✅ Email/password registration and login
- ✅ Role-based access control
- ✅ Persistent sessions
- ✅ Secure logout

### User Features
- ✅ Submit event requests with date, location, details
- ✅ View all submitted events
- ✅ Track event status (pending/approved/rejected)
- ✅ Receive notifications for approvals

### Admin Features
- ✅ Dashboard with statistics
- ✅ View all events (pending, approved, completed)
- ✅ Approve or reject event requests
- ✅ Create, edit, delete events directly
- ✅ Assign multiple workers to events
- ✅ Calendar view of all events
- ✅ Broadcast notifications to all workers
- ✅ Track worker attendance
- ✅ Manage payments

### Worker Features
- ✅ Register with bank/UPI payment details
- ✅ View assigned events
- ✅ Calendar view of work schedule
- ✅ Accept or decline event assignments
- ✅ Mark attendance (check-in/check-out)
- ✅ View earnings history
- ✅ Track pending payments

## 🔔 Notifications

The app uses Firebase Cloud Messaging for:
- Event approval/rejection alerts
- Event assignment notifications
- Broadcast messages from admin
- Payment confirmation alerts

## 🔐 Security

- Firebase Authentication for secure user management
- Firestore Security Rules for data access control
- Role-based permissions (User, Admin, Worker)
- Secure password hashing
- Protected API endpoints

## 📸 Screenshots

*Coming soon - Screenshots of key screens*

## 🎨 UI/UX Design

- Material Design principles
- Clean, intuitive interface
- Role-specific color themes
- Responsive layouts
- Smooth animations
- Accessibility features

## 🔮 Future Enhancements

- [ ] Biometric authentication (Face ID, Fingerprint)
- [ ] Automated payment integration (Razorpay, Stripe)
- [ ] Worker availability scheduling
- [ ] Advanced analytics dashboard
- [ ] WhatsApp notification integration
- [ ] Multi-location event management
- [ ] AI-based event planning suggestions
- [ ] Inventory management
- [ ] Rating and review system
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Offline mode support

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type check
npx tsc --noEmit
```

## 📦 Building for Production

### Android APK
```bash
npx expo build:android
```

### iOS IPA (requires Mac + Apple Developer Account)
```bash
npx expo build:ios
```

### Using EAS Build (Recommended)
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## 🤝 Contributing

This is a college project. For academic collaboration:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is developed as a college project for academic purposes.

## 👨‍💻 Author

**Your Name**  
College Project - Event Management System

## 📞 Support

For questions or issues:
- Email: your.email@example.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/izza-catering-mobile/issues)

## 🙏 Acknowledgments

- College faculty and mentors
- Firebase team for excellent documentation
- React Native community
- Expo team for simplifying mobile development

---

**Note**: This is an academic project developed for learning purposes and demonstrates a complete event management mobile application workflow.

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
