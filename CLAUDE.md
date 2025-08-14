# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 15.2.4** image management application designed for static deployment to GitHub Pages. The application supports cross-browser data synchronization through localStorage and JSON file export/import. It features a modern UI built with Tailwind CSS and shadcn/ui components.

## Key Architecture

### Static Export Configuration
- **Output Mode**: Static export (`output: 'export'`) for GitHub Pages deployment
- **Environment Detection**: `lib/config.ts` dynamically detects static vs server mode
- **Conditional Features**: File upload/delete APIs disabled in static mode
- **Path Handling**: `scripts/fix-paths.js` fixes asset paths for static deployment

### Data Management Strategy
- **Dual Storage**: JSON files for cross-browser sync + localStorage for local changes
- **Static Mode**: Uses `public/data/bookmarks.json` + localStorage
- **Server Mode**: API endpoints for file operations
- **Image Storage**: `public/uploads/` directory for uploaded images

### Component Architecture
- **Main Page**: `app/page.tsx` - Masonry grid layout with image cards
- **Core Components**: 
  - `enhanced-bulk-upload.tsx` - Batch image upload with File System Access API
  - `github-upload-dialog.tsx` - GitHub repository integration
- **UI Components**: shadcn/ui components in `components/ui/`

## Common Development Commands

```bash
# Development
npm run dev

# Build for GitHub Pages deployment
npm run export

# Lint and type check
npm run lint

# Build only (without path fixes)
npm run build
```

## File Upload Architecture

### Static Mode (GitHub Pages)
- Uses **File System Access API** for Chrome/Edge users
- Falls back to memory storage + manual export/import
- No server-side file operations

### Server Mode (Development)
- API routes: `/api/upload`, `/api/delete-files`, `/api/clear-data`
- Direct file system operations
- Real-time file management

## Key Configuration Files

### `next.config.js`
- Static export configuration with GitHub Actions detection
- Asset prefix for GitHub Pages subdirectory deployment
- Image optimization disabled for static mode

### `lib/config.ts`
- Runtime environment detection
- Feature flags based on deployment mode
- API availability checking

### `lib/file-saver.ts`  
- Multi-strategy file saving (File System Access API, Web Share, download)
- Browser compatibility detection
- Batch operations with ZIP compression

## Deployment

### GitHub Pages (Automatic)
- Workflow: `.github/workflows/deploy.yml`
- Triggers on push to `main` branch
- Runs `npm run export` and deploys to `gh-pages` branch

### Manual Export
```bash
npm run export
# Static files generated in `out/` directory
```

## Data Synchronization

### Export Data (Cross-browser sync)
- Users can export bookmarks as JSON
- Place in `public/data/bookmarks.json` for sharing

### Import Data
- Users can import JSON files to sync across browsers
- Merges with existing localStorage data

## Browser Compatibility

- **Chrome/Edge 86+**: Full features with File System Access API
- **Firefox/Safari**: Basic features with download fallbacks
- **Mobile**: Responsive design with touch optimizations

## Image Handling

### Upload Process
1. **Client-side compression** via Canvas API
2. **Aspect ratio preservation** for grid layout
3. **Multiple storage strategies** based on browser support
4. **Masonry grid layout** with CSS columns

### File Organization
- `public/uploads/` - User uploaded images
- `public/data/bookmarks.json` - Shared bookmark data
- `public/placeholder.*` - Default placeholder images