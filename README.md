# Whiteboard

A Next.js application for viewing, annotating, and collaborating on PDF documents.

## Overview

Whiteboard is a web-based application that provides a powerful interface for working with PDF documents. It enables users to view, annotate, and collaborate on PDF files with features like:

- PDF rendering and viewing
- Annotation tools (highlight, freetext, stamps)
- Drawing capabilities
- Document manipulation
- Text content extraction
- Collaborative editing features

## Features

### PDF Viewing
- Responsive document rendering
- Page navigation
- Zoom and rotation controls
- Text selection and search

### Annotation Capabilities
- Highlight text
- Add text annotations
- Insert stamps and images
- Draw freehand
- Add comments

### Document Management
- Save annotated documents
- Extract document metadata
- Manage attachments
- Export and share

## Technology Stack

- **Frontend**: Next.js, React
- **Rendering**: PDF.js (Mozilla)
- **Styling**: CSS (with Next.js styling features)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/whiteboard.git
   cd whiteboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

Upload a PDF document to begin viewing and editing. Use the toolbar to access various annotation tools and features.

## Building for Production

```bash
npm run build
# or
yarn build
```

Start the production server:
```bash
npm start
# or
yarn start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE) (or specify your license)