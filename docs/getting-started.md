# Getting Started

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later (or yarn/pnpm)

Check your versions:

```bash
node --version
npm --version
```

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/toolbundle.git
cd toolbundle

# Install dependencies
npm install
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

Open http://localhost:4321 in your browser. Changes are reflected instantly.

## Build

Build the static site for production:

```bash
npm run build
```

Output is generated in the `dist/` directory.

Preview the production build locally:

```bash
npm run preview
```

## Testing

### Unit Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Deployment

### Cloudflare Pages

1. Push your repo to GitHub
2. Go to Cloudflare Pages → Create a project
3. Connect your GitHub repo
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Deploy

### Vercel

```bash
npx vercel
```

Or connect your GitHub repo on vercel.com. Vercel auto-detects Astro.

### Netlify

1. Push your repo to GitHub
2. Go to Netlify → Add new site
3. Connect your GitHub repo
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Deploy

### Manual / Self-hosted

```bash
npm run build
# Upload the dist/ folder to any static hosting
# (Nginx, Apache, S3, GitHub Pages, etc.)
```

## Environment Variables

No environment variables are required. All tools run 100% client-side.

If you add features that need API keys (analytics, etc.), create a `.env` file:

```env
# .env
PUBLIC_ANALYTICS_ID=your-id-here
```

Astro exposes variables prefixed with `PUBLIC_` to the client.
