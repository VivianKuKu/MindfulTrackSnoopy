# MindfulTrack

A heartfelt daily mood and habit tracker built with React, Tailwind CSS, and Framer Motion.

## Features

- **Daily Ritual**: Track your mood and habits in a beautiful, minimalist interface.
- **Journey**: Visualize your progress and mood trends over time.
- **Reflections**: A quiet space to look back at your past thoughts.
- **PWA Support**: Installable on your mobile device for a native app experience.
- **Offline Ready**: Works offline using Service Workers.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: GitHub Actions & GitHub Pages

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Build for production: `npm run build`

## Deployment using GitHub Actions

This project is configured to deploy automatically to GitHub Pages using GitHub Actions.

The workflow (`.github/workflows/deploy.yml`) triggers on pushes to the `main` or `master` branch, or via manual dispatch. It performs the following automatically:
1. Sets up the environment with Node.js 20.
2. Installs dependencies (`npm install`) and builds the project for production (`npm run build`).
3. Uploads the `dist` directory as a deployment artifact.
4. Deploys the artifact to your repository's GitHub Pages.

**Note:** Ensure your repository settings allow read and write access for GitHub Pages Workflows under **Settings > Actions > General > Workflow permissions**.
