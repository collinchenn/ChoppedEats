# 🍽️ ChoppedEats

<div align="center">

**A collaborative restaurant decision-making platform that eliminates the "where should we eat?" debate**

*Built for groups who want to find the perfect restaurant together*

[Live Demo](#) • [Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started)

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
- **Server-Sent Events (SSE)**: Instant updates without polling
- **Live Synchronization**: Changes broadcast to all party members immediately
- **Persistent State**: Full state recovery on page refresh
- **Event-Driven Architecture**: Efficient real-time communication

### 📊 Restaurant Information
- **Google Places Photos**: Real restaurant images via Places API
- **Ratings & Reviews**: Display authentic Google ratings
- **Price Levels**: Visual price range indicators ($, $$, $$$, $$$$)
- **Location Details**: Full addresses with map integration ready
- **Cuisine Types**: Automatic categorization (Chinese, Italian, etc.)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icon library
- **Server-Sent Events** - Real-time updates

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - Runtime environment
- **File-Based Storage** - JSON persistence (parties.json)
- **Server-Sent Events** - Real-time event streaming

### APIs & Services
- **Google Places API** - Restaurant discovery and photos
- **Groq AI** - Natural language processing (optional)

### Key Libraries
```json
{
  "next": "^14.2.33",
  "react": "^18.2.0",
  "typescript": "^5.2.2",
  "tailwindcss": "^3.3.5",
  "lucide-react": "^0.292.0",
  "groq-sdk": "^0.3.3"
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Google Places API key ([Get one here](https://developers.google.com/maps/documentation/places/web-service/get-api-key))
- (Optional) Groq API key for enhanced AI features

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/collinchenn/ChoppedEats.git
cd ChoppedEats
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:
```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
GROQ_API_KEY=your_groq_api_key_here (optional)
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
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
// Server-Sent Events keep everyone in sync
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.type === 'vibe_added') {
    // New vibe shared
  } else if (data.type === 'restaurants_updated') {
    // New recommendations available
  } else if (data.type === 'voting_vote_updated') {
    // Vote count changed
  }
}
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
User Input → API Route → Party Store → Broadcast → All Clients
                ↓
         Google Places API
                ↓
         Restaurant Data → Storage → SSE Updates
```

### Real-Time Events

| Event Type | Trigger | Updates |
|------------|---------|---------|
| `vibe_added` | New vibe submitted | Vibes list, Recommendations |
| `restaurants_updated` | Places API returns | Restaurant list |
| `voting_candidates_updated` | Restaurant added/removed | Voting candidates |
| `voting_vote_updated` | User votes/unvotes | Vote counts |

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

### Real-Time State Synchronization

```typescript
// Broadcast updates to all connected clients
export function broadcastToParty(partyCode: string, data: any) {
  const streams = eventStreams.get(partyCode)
  streams?.forEach(controller => {
    controller.enqueue(
      new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
    )
  })
}
```

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
- Bob wants Italian ($$-$$$ range)
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

## 🚧 Future Enhancements

### Planned Features
- [ ] **User Accounts** - Save favorite restaurants and preferences
- [ ] **Map Integration** - Visual restaurant locations
- [ ] **Reservation Integration** - Book directly from the app
- [ ] **Dietary Filters** - Vegetarian, vegan, gluten-free, etc.
- [ ] **Distance Filtering** - "Restaurants within 2 miles"
- [ ] **Schedule Coordination** - Find times that work for everyone
- [ ] **Restaurant History** - Track where groups have eaten
- [ ] **Split Bill Calculator** - Integrated payment planning
- [ ] **Review Integration** - Pull reviews from multiple sources
- [ ] **Mobile App** - Native iOS/Android applications

### Technical Improvements
- [ ] Database migration (PostgreSQL/MongoDB)
- [ ] Redis for real-time state management
- [ ] WebSocket upgrade for bidirectional communication
- [ ] Rate limiting and API protection
- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Kubernetes orchestration

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write clear commit messages
- Add comments for complex logic
- Test real-time features thoroughly

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

**Collin Chen**
- GitHub: [@collinchenn](https://github.com/collinchenn)

---

## 🙏 Acknowledgments

- Google Places API for restaurant data
- Groq for AI capabilities
- Next.js team for the amazing framework
- Lucide for beautiful icons
- Tailwind CSS for styling utilities

---

## 📞 Support

Have questions or issues?
- 🐛 [Report a bug](https://github.com/collinchenn/ChoppedEats/issues)
- 💡 [Request a feature](https://github.com/collinchenn/ChoppedEats/issues)
- 📧 Contact: [your-email@example.com]

---

<div align="center">

**Made with ❤️ for groups who can't decide where to eat**

⭐ Star this repo if you found it helpful!

</div>
