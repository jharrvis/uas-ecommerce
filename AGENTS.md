# Agentic AI Coding Assistant Guidelines

Welcome to the **UAS Praktik E-Commerce (STIEAMA)** repository! This file provides essential guidelines, commands, and rules for agentic AI coding assistants operating in this Next.js codebase.

## 1. Project Overview

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript (`^5.5.3`) with strict mode enabled
- **Styling**: Tailwind CSS (`^3.4.6`) with `postcss` and `autoprefixer`
- **State Management**: Zustand (`^4.5.4`) with persist middleware
- **Icons**: Lucide React (`^0.383.0`)
- **Data Source**: External API (Google Apps Script), fetched via `src/lib/sheets.ts`
- **Type Safety**: Full TypeScript strict mode with path aliases (`@/*`)

## 2. Build, Lint, and Development Commands

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter (ESLint)
npm run lint
```

### Testing
Currently no test framework is configured. If instructed to write/run tests:
1. Check if testing framework exists in `package.json`
2. If not, suggest adding one: `npm install -D jest @testing-library/react`
3. For single test execution (if Jest is added):
   ```bash
   npx jest src/path/to/file.test.ts
   ```

## 3. Code Style Guidelines

### 3.1 File Structure & Naming Conventions
- **Components**: `src/components/` - Use PascalCase (e.g., `ThemeToggle.tsx`)
- **App Router**: `src/app/` - Follow Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`)
- **Types**: `src/types/index.ts` - All shared interfaces and types
- **Store**: `src/store/` - Zustand stores use camelCase (e.g., `examStore.ts`)
- **Lib**: `src/lib/` - Helper functions and API calls (e.g., `sheets.ts`, `shuffle.ts`)
- **API Routes**: `src/app/api/` - Server-side API endpoints

### 3.2 TypeScript & Typing
- **Strict Mode**: All TypeScript strict rules enabled (`"strict": true`)
- **No `any`**: Avoid `any` type. Use `unknown` for dynamic data with proper type guards
- **Explicit Typing**: Type all function parameters, return values, and variables
- **Imports**: Use absolute imports with `@/` prefix (e.g., `import { Toko } from '@/types'`)
- **Path Aliases**: Configure in `tsconfig.json` as `"@/*": ["./src/*"]`

### 3.3 React & Next.js Conventions
- **Server vs Client Components**: 
  - Default: Server Components
  - Add `'use client'` ONLY when using hooks, browser APIs, or event listeners
  - Keep client boundaries as low as possible in component tree
- **Data Fetching**: Use standard `fetch` with appropriate caching strategies
- **Environment Variables**: Use `process.env.NEXT_PUBLIC_*` for client-side variables
- **Error Boundaries**: Implement error boundaries for component error handling

### 3.4 State Management
- **Zustand**: Primary state management library
- **Store Location**: `src/store/` directory
- **Persistence**: Use `persist` middleware for state that survives page reloads
- **Actions**: Define clear actions and computed selectors in stores

### 3.5 Styling (Tailwind CSS)
- **Utility Classes**: Use standard Tailwind utilities only
- **No Inline Styles**: Avoid `style={{ ... }}` except for dynamic values
- **Theme Consistency**: Follow existing theme (e.g., `bg-slate-950 text-slate-100`)
- **Responsive Design**: Implement mobile-first responsive patterns
- **Custom Config**: Extend in `tailwind.config.js` if needed

### 3.6 Error Handling
- **Async Operations**: Wrap all API calls in `try/catch` blocks
- **Error Messages**: Provide informative error messages (e.g., `throw new Error('API error')`)
- **Loading States**: Handle loading states for async operations
- **Null Safety**: Gracefully handle `null` or undefined data in components
- **Network Errors**: Handle network timeouts and CORS issues appropriately

### 3.7 Code Formatting
- **Semicolons**: No semicolons at line endings
- **Quotes**: Use single quotes for strings (`'...'`)
- **Indentation**: 2 spaces for indentation
- **Import Organization**:
  1. React/Next.js imports
  2. External library imports  
  3. Internal `@/` imports
- **Line Length**: Keep lines under 100 characters where possible

### 3.8 API Integration
- **Google Apps Script**: Use `src/lib/sheets.ts` for all API calls
- **CORS Handling**: Proper CORS configuration for external APIs
- **Request/Response**: Consistent error handling with proper HTTP status codes
- **File Uploads**: Use base64 encoding for file uploads to Apps Script

## 4. Cursor/Copilot Rules

If using AI assistants natively within IDEs:

- **No Explanations**: Avoid outputting explanation summaries unless explicitly requested
- **Minimal Changes**: Don't rewrite entire files for small changes
- **Style Consistency**: Follow exact indentation and line-ending styles of existing code
- **Comments**: Keep comments minimal and focused on "why" rather than "what"
- **Context Awareness**: Understand the broader context before making changes

## 5. Performance & Best Practices

- **Bundle Size**: Optimize imports and avoid unnecessary dependencies
- **Image Optimization**: Use Next.js Image component for all images
- **Code Splitting**: Implement dynamic imports for large components
- **Caching**: Use appropriate caching strategies for data fetching
- **Accessibility**: Follow WCAG guidelines for all UI components
- **SEO**: Implement proper meta tags and structured data

## 6. Development Workflow

1. **Code Quality**: Run `npm run lint` before committing or finalizing tasks
2. **Type Safety**: Ensure TypeScript compilation passes without errors
3. **Testing**: Verify functionality works across different screen sizes
4. **Performance**: Check Core Web Vitals and bundle size when deploying
5. **Documentation**: Update relevant documentation when adding features