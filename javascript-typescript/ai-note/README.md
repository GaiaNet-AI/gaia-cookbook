# Thought Catcher - AI-Powered Note Taking App

![Thought Catcher Demo](ai-notes.gif)

Thought Catcher is an intelligent note-taking application that uses AI to automatically categorize, organize, and enhance your notes. Built with Next.js and featuring a beautiful, modern UI, it helps you capture and organize your thoughts with minimal effort.

## ✨ Features

### 🤖 AI-Powered Processing
- **Dual AI Support**: Choose between OpenAI and Gaia AI for note processing
- **Smart Categorization**: Automatically categorizes notes into relevant categories
- **Deadline Detection**: Identifies and extracts deadlines from natural language
- **Link Extraction**: Automatically detects and formats URLs in your notes
- **Priority Assignment**: AI-determined priority levels (high, medium, low)
- **Tag Generation**: Creates relevant tags for better organization

### 📝 Note Categories
- Content Creation
- Health & Wellness
- Work & Career
- Learning & Education
- Shopping & Errands
- Finance
- General

### 🎯 Smart Features
- **Real-time Date Detection**: Instantly recognizes dates and deadlines as you type
- **Visual Categories**: Each category has its own icon and color scheme
- **Priority Indicators**: Color-coded priority badges
- **Deadline Tracking**: Visual indicators for upcoming and overdue tasks
- **Link Previews**: Clickable links with domain previews
- **Tag System**: Automatic tag generation and display

### 🎨 Modern UI/UX
- **Beautiful Animations**: Smooth transitions and loading states
- **Responsive Design**: Works seamlessly on all devices
- **Dark Mode Support**: Easy on the eyes in any lighting condition
- **Real-time Updates**: Instant feedback as you type
- **Notification System**: Track upcoming deadlines

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- OpenAI API key (for OpenAI processing)
- Gaia API key (for Gaia AI processing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/meowyx/ai-note
cd ai-note
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key
GAIA_API_KEY=your_gaia_api_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 💻 Usage

1. **Adding Notes**
   - Type your note in the input field
   - The AI will automatically detect dates, deadlines, and links
   - Click "Organize This Thought" to process your note

2. **Viewing Notes**
   - Notes are automatically categorized
   - Each category has its own section
   - Use the notification bell to track upcoming deadlines

3. **Managing Notes**
   - Delete notes using the trash icon
   - View note details including priority, deadline, and tags
   - Click on extracted links to open them

## ⚙️ Configuration

Access the settings panel to:
- Choose between OpenAI and Gaia AI
- Enable/disable AI processing
- Configure API keys
- Customize the interface


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


