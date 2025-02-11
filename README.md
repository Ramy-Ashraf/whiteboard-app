# Whiteboard App

This is a minimal whiteboard application using Next.js

## Features
- Canvas drawing with pen, highlight, text, line, and arrow tools.
- Toggle between dark and light modes.
- PDF upload and board management.
- Recording functionality.

## Setup & Usage
1. Clone the repository.
   ```
   git clone https://github.com/Ramy-Ashraf/whiteboard-app.git
   ```
2. Navigate to the project folder:
   ```
   cd ~/whiteboard-app2
   ```
3. Open development server:

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

## Project Structure
- **public/**: Static assets
  - favicon.ico 
  - file.svg
  - ...
- **src/app/**: Application source code
  - page.js: Main whiteboard component
  - toolbar.js: Drawing toolbar component
  - ...
- **next.config.mjs**: Next.js configuration
- **package.json**: Project dependencies and scripts
- **postcss.config.mjs**: PostCSS configuration  
- **tailwind.config.mjs**: Tailwind CSS configuration
- **eslint.config.mjs**: ESLint configuration
- **jsconfig.json**: JavaScript configuration

## Customization
- Adjust tool settings and colors in `toolbar.js`.
- Modify layout and styles in both `page.js` and `toolbar.js`.

## Dependencies
- React Icons
- Framer Motion

