# Personalized Learning Roadmap Generator

A Next.js application that generates personalized learning roadmaps using the Groq API with AI-powered recommendations tailored to your learning goals.

## Features

- 🎯 Personalized learning roadmaps based on your goals
- 🚀 Fast AI-powered generation using Groq API
- 📱 Responsive design with Tailwind CSS
- 🌐 Support for multiple languages (English, Hinglish, Hindi)
- 💰 Budget-aware resource recommendations
- 📊 Detailed weekly breakdowns with milestones and projects
- ✨ Beautiful UI with interactive components

## Prerequisites

- Node.js 18+ and npm
- A Groq API key (get one at https://console.groq.com)

## Installation

1. **Clone or download the repository**
   ```bash
   cd personalized-roadmap-gen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1. Fill in the learning form with:
   - **Learning Goal**: What you want to learn (e.g., "Learn Web Development")
   - **Current Level**: Your experience level (Beginner, Intermediate, Advanced)
   - **Hours per Week**: How much time you can dedicate weekly
   - **Duration**: Total months for the learning journey
   - **Preferred Resources**: Types of learning materials you prefer
   - **Language**: Your preferred language (English, Hinglish, Hindi)
   - **Budget**: Your budget for courses and resources

2. Click "Generate My Roadmap"

3. Get a detailed, personalized learning roadmap with:
   - Weekly breakdown of topics
   - Recommended resources for each week
   - Mini-projects to apply your learning
   - Clear milestones to track progress
   - Tips for success and motivation

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page component
│   ├── globals.css         # Global styles
│   └── api/
│       └── generate/
│           └── route.ts    # API endpoint for roadmap generation
├── components/
│   ├── LearningForm.tsx    # Form component for user input
│   ├── RoadmapDisplay.tsx  # Component to display generated roadmap
│   └── ui/                 # UI components (expandable)
└── lib/
    ├── types.ts            # TypeScript interfaces
    ├── groq.ts             # Groq API integration
    └── prompts.ts          # System prompts for AI
```

## API Endpoint

### POST /api/generate

Generates a personalized learning roadmap.

**Request Body:**
```json
{
  "goal": "Learn Full Stack Web Development",
  "level": "beginner",
  "hours": 10,
  "months": 3,
  "resources": "YouTube, Udemy, Books",
  "language": "English",
  "budget": "free"
}
```

**Response:**
```json
{
  "title": "Your Roadmap Title",
  "overview": "Brief overview...",
  "total_weeks": 12,
  "phases": [...],
  "tips": [...],
  "motivation": "..."
}
```

## Technologies Used

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI API**: Groq (mixtral-8x7b-32768)
- **HTTP Client**: Fetch API

## Environment Variables

- `GROQ_API_KEY`: Your Groq API key (required)

## Build for Production

```bash
npm run build
npm start
```

## Troubleshooting

### "GROQ_API_KEY is not set"
- Make sure you've added your API key to `.env.local`
- Restart the development server after updating environment variables

### "Failed to parse roadmap from response"
- The AI might have failed to generate valid JSON
- Try again with a clearer goal description
- Check your Groq API quota

### Styling not loading
- Make sure Tailwind CSS is properly installed
- Run `npm install` again
- Restart the dev server

## Contributing

Feel free to fork and submit pull requests for any improvements!

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues with the Groq API, visit: https://console.groq.com
For Next.js documentation: https://nextjs.org/docs
# Personalized-Learning-Roadmap-Generator
