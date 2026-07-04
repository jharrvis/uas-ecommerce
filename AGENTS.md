# Agentic AI Coding Assistant Guidelines

Welcome to the **UAS Praktik E-Commerce (STIEAMA)** repository! This file provides essential guidelines, commands, and rules for agentic AI coding assistants operating in this Next.js codebase.

## 1. Project Overview

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript (`^5.5.3`)
- **Styling**: Tailwind CSS (`^3.4.6`) with `postcss` and `autoprefixer`
- **State Management**: Zustand (`^4.5.4`)
- **Icons**: Lucide React (`^0.383.0`)
- **Data Source**: External API (Google Apps Script), fetched via `src/lib/sheets.ts`.

## 2. Build, Lint, and Development Commands

### Start the Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start the Production Server
```bash
npm run start
```

### Run Linter
```bash
npm run lint
```
*Note: Run `npm run lint` before committing or finalizing a task to ensure code quality.*

### Testing
There is currently no configured test framework (like Jest or Playwright) in this repository. If you are instructed to write or run tests, first verify if a testing framework has been added to `package.json`. If not, ask the user to clarify or suggest adding one (e.g., `npm install -D jest @testing-library/react`).

To run a single test (if Jest is installed later):
```bash
npx jest src/path/to/file.test.ts
```

## 3. Code Style Guidelines

### 3.1. File Structure & Naming Conventions
- **Components**: `src/components/`. Use PascalCase for filenames (e.g., `ThemeToggle.tsx`). Group shared UI components in `src/components/ui/`.
- **App Router**: `src/app/`. Use standard Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`).
- **Types**: `src/types/index.ts`. All shared interfaces and types belong here.
- **Store**: `src/store/`. Zustand stores should use camelCase (e.g., `examStore.ts`).
- **Lib**: `src/lib/`. Helper functions and API calls (e.g., `sheets.ts`, `shuffle.ts`).

### 3.2. TypeScript & Typing
- **Strict Mode**: TypeScript is configured with `"strict": true`. Ensure all variables, function parameters, and return types are explicitly typed or properly inferred.
- **No `any`**: Avoid using `any`. Use `unknown` if the type is truly dynamic, and type-guard it.
- **Imports**: Use absolute imports starting with `@/` for local files (e.g., `import { Toko } from '@/types'`).

### 3.3. React & Next.js Conventions
- **Server vs. Client Components**: Next.js App Router defaults to Server Components.
  - Add `'use client'` at the very top of the file ONLY if the component uses hooks (`useState`, `useEffect`, `useStore`), browser APIs (`localStorage`), or event listeners (`onClick`).
  - Keep `'use client'` boundaries as low in the component tree as possible.
- **Data Fetching**: Use standard `fetch` with Next.js caching options in Server Components or API routes (see `src/lib/sheets.ts`).
- **Environment Variables**: Use `process.env.NEXT_PUBLIC_*` for variables needed in the browser. Always provide fallbacks where appropriate.

### 3.4. State Management
- Use Zustand for global state.
- Zustand stores are located in `src/store/`.
- Use the `persist` middleware if state needs to survive page reloads (as seen in `examStore.ts`).

### 3.5. Styling (Tailwind CSS)
- Use standard Tailwind utility classes.
- Avoid inline styles (`style={{ ... }}`) unless strictly necessary for dynamic values.
- Respect the existing theme structure (e.g., `bg-slate-950 text-slate-100` found in `layout.tsx`).

### 3.6. Error Handling
- Wrap async API calls in `try/catch` blocks.
- Throw informative errors when API requests fail (e.g., `throw new Error('API error')`).
- Ensure UI components gracefully handle `null` or loading states when consuming data from context/store or async functions.

### 3.7. Code Formatting
- No semicolons at the end of lines (enforced by existing style).
- Single quotes for strings (`'...'`).
- Use 2 spaces for indentation.
- Group imports logically: React/Next first, external libraries second, internal `@/` imports last.

## 4. Cursor / Copilot Rules
*If using an AI assistant natively within the IDE (Cursor or GitHub Copilot), adhere to the following defaults:*
- Do not output explanation summaries unless explicitly requested.
- Avoid rewriting entire files if only a small change is needed.
- Follow the exact indentation and line-ending styles of the file being edited.
- Keep comments minimal and focused on "why" rather than "what", unless generating documentation is requested.
