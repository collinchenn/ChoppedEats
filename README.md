# ChopEats 🍽️

A collaborative restaurant decision-making web application that helps groups of friends decide where to eat together. Share your dining vibes, budget, and preferences, then get AI-powered restaurant recommendations that satisfy everyone in the group.

## Features

- **Party Creation**: Create parties with unique codes to invite friends
- **Vibe Sharing**: Share your dining preferences, budget, and what you're craving
- **AI Recommendations**: Get intelligent restaurant suggestions using Groq AI
- **Group Voting**: Vote on recommended restaurants to make the final decision
- **Real-time Updates**: See what everyone is thinking in real-time

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI Integration**: Groq API for restaurant recommendations
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Groq API key (get one at [console.groq.com](https://console.groq.com/))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd choppedeats
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Groq API key to `.env.local`:
```
GROQ_API_KEY=your_groq_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Create a Party**: Click "Create Party" and enter a party name and location
2. **Share the Code**: Copy the 6-character party code and share it with friends
3. **Join a Party**: Use "Join Party" to enter a party code
4. **Share Your Vibe**: Tell everyone what you're craving and your budget
5. **Get Recommendations**: Click "Find Restaurants" to get AI-powered suggestions
6. **Vote Together**: Vote on your favorite restaurants and see the group's choice

## API Integration

The app uses the Groq API to analyze group preferences and generate restaurant recommendations. The AI considers:
- Cuisine preferences
- Budget constraints
- Dietary restrictions
- Location preferences
- Group dynamics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
