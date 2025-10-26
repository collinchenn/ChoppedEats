# 🍽️ ChoppedEats

<div align="center">

**A collaborative restaurant decision-making platform that eliminates the "where should we eat?" debate**

*Built for groups who want to find the perfect restaurant together*

[Live Demo](https://www.youtube.com/watch?v=J5GTRfs5ZoA) • [Features](#-features) • [Tech Stack](#%EF%B8%8F-tech-stack) • [Getting Started](#-getting-started)

</div>

---

## 📖 Overview

ChoppedEats is an intelligent, real-time collaborative platform designed to solve one of the most common challenges when dining with friends: deciding where to eat. By combining AI-powered recommendations with democratic voting, ChoppedEats transforms the frustrating restaurant selection process into a fun, efficient group experience.

### The Problem

- Groups waste 20+ minutes deciding where to eat
- Everyone has different preferences (cuisine, budget, dietary needs)
- Traditional methods (group chats, polls) are chaotic and inefficient
- No easy way to discover restaurants that satisfy everyone

### Our Solution

ChoppedEats provides a streamlined 3-step process:
1. **Share Your Vibe** - Each person expresses what they're craving
2. **Get AI Recommendations** - Smart suggestions based on everyone's preferences  
3. **Vote Together** - Democratic selection with real-time updates

---

## ✨ Features

### 🎉 Party Management
- **Unique Party Codes**: Create instant party rooms with shareable codes
- **No Authentication Required**: Jump in and start deciding - no signup needed
- **Multi-User Support**: Invite unlimited friends to join the decision

### 💬 Vibe Sharing
- **Natural Language Input**: Express preferences in your own words
- **Budget Specification**: Set spending limits per person
- **Real-Time Updates**: See everyone's vibes as they're shared
- **Persistent Storage**: Vibes and preferences are saved across sessions

### 🤖 AI-Powered Recommendations
- **Google Places Integration**: Access millions of real restaurants with verified data
- **Intelligent Cuisine Matching**: Automatically categorizes restaurants by cuisine type
- **Smart Filtering**: Considers location, budget, and group preferences
- **Dynamic Results**: Get fresh recommendations with each new vibe

### 🗳️ Democratic Voting System
- **One Vote Per User**: Fair voting with localStorage-based user tracking
- **Toggle Voting**: Change your mind? Click again to remove your vote
- **Real-Time Vote Counts**: See results update instantly across all devices
- **Candidate Selection**: Curate the final voting list from recommendations

### 🔄 Real-Time Collaboration
- **Firebase Firestore Listeners**: Real-time database subscriptions with `onSnapshot()`
- **Instant Synchronization**: Changes propagate to all clients within milliseconds
- **Persistent State**: Full state recovery on page refresh via Firestore
- **Anonymous Authentication**: Seamless user experience without sign-up required
- **Optimistic Updates**: Changes appear instantly while syncing in background

### 📊 Restaurant Information
- **Google Places Photos**: Real restaurant images via Places API
- **Ratings & Reviews**: Display authentic Google ratings
- **Price Levels**: Visual price range indicators ($$$, $$$$, $$$$$$$, $$$$$$$$)
- **Location Details**: Full addresses with map integration ready
- **Cuisine Types**: Automatic categorization (Chinese, Italian, etc.)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - Runtime environment
- **Firebase Firestore** - Real-time NoSQL database for party data, vibes, and voting
- **Server-Sent Events** - Real-time event streaming for instant updates

### APIs & Services
- **Google Places API** - Restaurant discovery and photos
- **Groq AI** - NLP and restaurant recommendation
- **Firebase Realtime Sync** - Realtime user sync

### Key Libraries
```json
{
  "next": "^14.2.33",
  "react": "^18.2.0",
  "typescript": "^5.2.2",
  "tailwindcss": "^3.3.5",
  "lucide-react": "^0.292.0",
  "groq-sdk": "^0.3.3",
  "firebase": "^10.14.1",
  "firebase-admin": "^12.7.0"
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm
- Firebase project with Firestore enabled ([Create one here](https://console.firebase.google.com/))
- Google Places API key ([Get one here](https://developers.google.com/maps/documentation/places/web-service/get-api-key))
- Groq API key for enhanced AI features

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/collinchenn/ChoppedEats.git
cd ChoppedEats
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:
```env
# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Groq AI (optional)
GROQ_API_KEY=your_groq_api_key_here

# Firebase Admin (Server-side)
FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", "project_id": "...", ...}'

# Firebase Client (Browser-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Firebase Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Firestore Database
4. Go to Project Settings → Service Accounts → Generate new private key
5. Copy the JSON content to `FIREBASE_SERVICE_ACCOUNT` environment variable
6. Get your web app config from Project Settings → General → Your apps
7. Copy the config values to the `NEXT_PUBLIC_FIREBASE_*` variables

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📱 How It Works

### 1️⃣ Create or Join a Party

```typescript
// Simple party creation
const party = {
  code: "UNIQUE_CODE",
  name: "Friday Dinner",
  location: "San Francisco, CA"
}
```

### 2️⃣ Share Your Vibes

Each member shares what they're craving:
- "I want sushi with a budget of $30"
- "Craving Italian food, not too expensive"  
- "Mexican food, under $25 per person"

### 3️⃣ AI Generates Recommendations

The system:
- Queries Google Places API with combined preferences
- Extracts cuisine types from restaurant metadata
- Filters by location and budget constraints
- Returns personalized matches for each vibe

### 4️⃣ Vote on Favorites

- Add restaurants to the voting pool
- Each user votes once per restaurant
- Toggle votes on/off freely
- Winner is determined by popular vote

### 5️⃣ Real-Time Updates

```typescript
// Firebase Firestore listeners keep everyone in sync
const { db } = getFirebaseServices()
const vibesRef = collection(db, 'parties', partyCode, 'vibes')

// Real-time listener - updates automatically when data changes
const unsubscribe = onSnapshot(vibesRef, (snapshot) => {
  const vibes = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  setVibes(vibes) // Instant UI update across all clients
})

// Cleanup when component unmounts
return () => unsubscribe()
```

---

## 🏗️ Architecture

### Project Structure

```
ChoppedEats/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analyze-vibes/        # AI vibe analysis
│   │   ├── geocode/              # Location services
│   │   ├── parties/              # Party management
│   │   │   └── [code]/           # Dynamic party routes
│   │   │       ├── events/       # SSE endpoint
│   │   │       ├── vibes/        # Vibe management
│   │   │       ├── restaurants/  # Restaurant data
│   │   │       └── voting/       # Voting system
│   │   ├── photo/                # Google Photos proxy
│   │   └── restaurants/          # Places search
│   ├── create/                   # Party creation page
│   ├── party/[code]/             # Party main page
│   │   └── voting/               # Voting interface
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── CreateParty.tsx           # Party creation form
│   ├── JoinParty.tsx             # Party join form
│   ├── VibeInput.tsx             # Vibe submission
│   ├── VibeList.tsx              # Vibe display
│   ├── RestaurantRecommendations.tsx
│   └── WinnerDisplay.tsx         # Results page
├── lib/                          # Utilities
│   ├── party-store.ts            # Data persistence
│   └── groq.ts                   # AI integration
├── data/                         # JSON storage
│   └── parties.json              # Party data
└── public/                       # Static assets
```

### Data Flow

```
User Input → API Route → Firebase Firestore → onSnapshot Listeners → All Clients
                ↓
         Google Places API
                ↓
            Groq API
                ↓
         Restaurant Data → Firestore Collections → Real-time Updates
```

### Firestore Collections Structure

```
parties/{partyCode}
├── members/{userId}           # Party members with join timestamps
├── vibes/{vibeId}             # Shared dining preferences
│   ├── username: string
│   ├── message: string
│   ├── budget: number
│   └── timestamp: number
└── votingCandidates/{restId}  # Restaurants in voting pool
    ├── name: string
    ├── cuisine: string
    ├── rating: number
    ├── votes: number
    └── votedBy: string[]      # User IDs who voted
```

### Real-Time Sync Features

| Collection | Listener | Updates |
|------------|----------|---------|
| `members` | Join notifications | Live party member count, CS:GO-style join alerts |
| `vibes` | Vibe feed | Instant vibe updates across all clients |
| `votingCandidates` | Voting UI | Real-time vote counts and restaurant list |

---

## 🎨 Key Features Deep Dive

### Restaurant Discovery with Google Places

```typescript
// Smart cuisine type extraction
const getCuisineType = (types: string[]) => {
  const cuisineMap = {
    'chinese_restaurant': 'Chinese',
    'japanese_restaurant': 'Japanese',
    'italian_restaurant': 'Italian',
    'mexican_restaurant': 'Mexican',
    // ... 20+ cuisine types
  }
  
  for (const type of types) {
    if (cuisineMap[type]) return cuisineMap[type]
  }
  
  return 'Restaurant'
}
```

### Vote Management System

```typescript
// One vote per user per restaurant
interface Restaurant {
  id: string
  name: string
  votes: number
  votedBy: string[] // Track individual voters
}

// Toggle vote functionality
function toggleVote(restaurantId: string, userId: string) {
  if (votedBy.includes(userId)) {
    // Remove vote
  } else {
    // Add vote
  }
}
```

### Real-Time State Synchronization with Firebase

```typescript
// Firebase provides automatic real-time sync across all clients
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore'
import { getFirebaseServices } from '@/lib/firebase-client'

// Write data - automatically syncs to all listeners
async function addVote(partyCode: string, restaurantId: string, userId: string) {
  const { db } = getFirebaseServices()
  const voteRef = doc(db, 'parties', partyCode, 'votingCandidates', restaurantId)
  
  await setDoc(voteRef, {
    votes: votes + 1,
    votedBy: [...votedBy, userId]
  }, { merge: true })
  
  // All clients with listeners receive update instantly
}

// Listen for changes - updates in real-time
function listenToVotes(partyCode: string) {
  const { db } = getFirebaseServices()
  const votesRef = collection(db, 'parties', partyCode, 'votingCandidates')
  
  return onSnapshot(votesRef, (snapshot) => {
    // This callback runs automatically when data changes
    snapshot.docs.forEach(doc => {
      console.log('Vote updated:', doc.data())
    })
  })
}
```

**Why Firebase Firestore?**
- **Sub-second latency**: Changes propagate in < 100ms typically
- **Offline support**: Continues working without internet, syncs when reconnected  
- **Scalable**: Handles multiple concurrent parties and users effortlessly
- **No server maintenance**: Fully managed backend infrastructure

---

## 🔧 API Endpoints

### Party Management
- `POST /api/parties` - Create new party
- `GET /api/parties?code={code}` - Get party details
- `GET /api/parties/{code}` - Get full party data

### Vibes
- `POST /api/parties/{code}/vibes` - Add new vibe
- `GET /api/parties/{code}/vibes` - Get all vibes

### Restaurants
- `POST /api/parties/{code}/restaurants` - Update restaurant list
- `POST /api/restaurants` - Search places

### Voting
- `GET /api/parties/{code}/voting` - Get voting candidates
- `POST /api/parties/{code}/voting/add` - Add to voting
- `POST /api/parties/{code}/voting/remove` - Remove from voting
- `POST /api/parties/{code}/voting/{id}/vote` - Cast vote
- `DELETE /api/parties/{code}/voting/{id}/vote` - Remove vote

### Real-Time
- `GET /api/parties/{code}/events` - Server-Sent Events stream

---

## 🎯 Use Cases

### Perfect For:
- 👥 **Friend Groups** - Deciding on Friday night dinner
- 💼 **Work Teams** - Planning team lunches
- 🎓 **Student Groups** - Finding budget-friendly options
- 👨‍👩‍👧‍👦 **Families** - Satisfying picky eaters
- 🌍 **Travelers** - Discovering local restaurants

### Example Scenarios:

**Scenario 1: Mixed Preferences**
- Alice wants sushi ($30 budget)
- Bob wants Italian ($$$-$$$$ range)
- Carol wants vegetarian options
- ChoppedEats finds: Mediterranean restaurant with sushi, pasta, and veggie options

**Scenario 2: Budget-Conscious Group**
- All specify $15-20 per person
- System filters out expensive restaurants
- Recommends highly-rated casual dining

**Scenario 3: Cuisine Exploration**
- Vibes include: "something new", "Asian fusion", "spicy food"
- AI discovers trending restaurants matching all criteria

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

**Collin Chen**
**Derek Sun**
**Marvin Chu**
**Rick Liu**

---

## 🙏 Acknowledgments

- Google Places API for restaurant data
- Groq for AI capabilities
- Next.js team for the amazing framework
- Lucide for beautiful icons
- Tailwind CSS for styling utilities

---

<div align="center">

**Made with ❤️ for groups who can't decide where to eat**

⭐ Star this repo if you found it helpful!

</div>
