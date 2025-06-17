# GitHub PR Review AI

A modern web application that provides AI-powered code reviews for GitHub pull requests. This tool helps developers get instant feedback on their code changes without waiting for human reviewers.


## Features

- **AI-Powered Code Reviews**: Get comprehensive feedback on code style, security, performance, and design
- **GitHub Integration**: Seamlessly fetch pull request diffs from any public GitHub repository
- **Post Comments**: Automatically post reviews as comments on GitHub pull requests
- **Markdown Rendering**: Beautifully formatted review feedback with syntax highlighting
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Choose between light and dark themes

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- GitHub Personal Access Token
- Gaia LLM API access (or another compatible LLM)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/github-pr-review-ai.git
cd github-pr-review-ai
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```bash
GITHUB_TOKEN=your_github_personal_access_token
GAIA_API_KEY=your_gaia_api_key
GAIA_API_BASE_URL=your_gaia_api_base_url
GAIA_MODEL=gpt-4o  # or your preferred model
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Enter the GitHub repository owner (username or organization)
2. Enter the repository name
3. Enter the pull request number
4. Optionally check "Post review as a GitHub comment" to post the review directly to the PR
5. Click "Review Pull Request"
6. Wait for the AI to analyze the code changes
7. Review the AI-generated feedback

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token with repo access | Yes |
| `GAIA_API_KEY` | API key for Gaia LLM | Yes |
| `GAIA_API_BASE_URL` | Base URL for Gaia API | Yes |
| `GAIA_MODEL` | Model name to use (defaults to gpt-4o) | No |

## Technologies Used

- **Next.js**: Full-stack React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components
- **React Hook Form**: Form validation
- **Zod**: Schema validation
- **LangChain**: LLM integration
- **React Markdown**: Markdown rendering
- **React Syntax Highlighter**: Code syntax highlighting

## Project Structure

```bash
github-pr-review-ai/
├── app/
│   ├── actions.ts        # Server actions for PR review
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── review-form.tsx   # Main form component
│   ├── theme-provider.tsx # Dark/light mode provider
│   └── ui/               # UI components
├── lib/
│   └── utils.ts          # Utility functions
├── public/
│   └── ...               # Static assets
├── .env.local            # Environment variables (create this)
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies
├── README.md             # This file
└── tsconfig.json         # TypeScript configuration
```

## How It Works

1. **Input Collection**: The user provides GitHub repository details and PR number
2. **GitHub API Integration**: The application fetches the PR diff using the GitHub API
3. **AI Analysis**: The diff is sent to the Gaia LLM for analysis
4. **Feedback Generation**: The AI generates structured feedback on the code changes
5. **GitHub Comment** (Optional): The review can be posted as a comment on the PR
6. **Rendering**: The feedback is rendered as formatted markdown with syntax highlighting

## Future Enhancements

- GitHub OAuth integration to avoid needing a personal token
- Save review history
- Visual diff viewer
- Customizable review templates
- Support for private repositories

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [GitHub API](https://docs.github.com/en/rest)
- [LangChain](https://js.langchain.com/)
