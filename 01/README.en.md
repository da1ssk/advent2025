# Day 01: Building a Markdown Previewer with TypeScript

🌐 [日本語](./README.md)

Advent Calendar 2025 - Day 1 article.

## Overview

I created a simple web app that previews Markdown in real-time using TypeScript. The Markdown you input is instantly converted to HTML and displayed in the preview area.

[Markdown Previewer](https://markdown-previewer-day01.vercel.app/)

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **marked** - Markdown → HTML conversion library (via CDN)
- **HTML/CSS** - Responsive layout using Flexbox

## Tools Used

- **Google Gemini** - Initial code generation
- **Cursor + Claude Opus 4.5** - Code refinement & debugging
- **Vercel** - Deployment & hosting

## Directory Structure

```
01/
├── index.html      # Main HTML
├── style.css       # Stylesheet
├── script.ts       # TypeScript source
├── dist/           # Compiled JS
├── package.json
└── tsconfig.json
```

## Setup

```bash
# Install dependencies
npm install

# Compile TypeScript
npx tsc

# Start local server
npx serve
# or
python3 -m http.server 8080
```

## Key Features

1. **Real-time Preview** - Preview updates instantly as you type
2. **Code Block Support** - Syntax highlight-style styling
3. **Responsive Design** - Side-by-side Flexbox layout

## Code Highlights

### TypeScript Type Declarations

Declaring the `marked` library loaded from CDN as a global variable:

```typescript
declare const marked: {
  parse(src: string): Promise<string>
}
```

### DOM Element Type Assertions

```typescript
const inputElement = document.getElementById("markdown-input") as HTMLTextAreaElement
const outputElement = document.getElementById("preview-output") as HTMLDivElement
```

### Async Processing

Since `marked.parse()` returns a Promise, we handle it with async/await:

```typescript
const renderMarkdown = async (): Promise<void> => {
  const markdownText: string = inputElement.value
  const htmlOutput: string = await marked.parse(markdownText)
  outputElement.innerHTML = htmlOutput
}
```

## Deployment

Deployed using Vercel.

```bash
# Deploy with Vercel CLI
npx vercel --prod
```

Output directory configured in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "."
}
```

**Production URL:** https://markdown-previewer-day01.vercel.app

## Notes

- Uses ES modules, so it won't work with the `file://` protocol
- Please access via a local server

## References

- [marked - GitHub](https://github.com/markedjs/marked)
- [TypeScript Official Documentation](https://www.typescriptlang.org/docs/)

## License

MIT

---

Created by Kakumei, 2025

