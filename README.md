# Whiteboard App

This is a minimal whiteboard application using HTML, CSS, and JavaScript.

## Features
- Canvas drawing with pen, highlight, text, line, and arrow tools.
- Toggle between dark and light modes.
- PDF upload and board management.
- Recording functionality.

## Setup & Usage
1. Clone the repository.
2. Navigate to the project folder:
   ```
   cd /home/ramy/whiteboard-app2
   ```
3. Open `index.html` in your browser to start.

## Project Structure
- **index.html**: Main HTML file with the canvas and script links.
- **style.css**: Styles for the application.
- **main.js**: Logic for drawing and canvas events.
- **src/app/toolbar.js**: React component for the drawing toolbar.

## Customization
- Adjust tool settings and colors in `toolbar.js`.
- Modify layout and styles in `style.css`.

## Dependencies
- React Icons
- Framer Motion

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

