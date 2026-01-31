# The Cubby - Household Inventory Management

## Overview

The Cubby is a household inventory management application designed for tracking kitchen pantry items, managing shopping lists, and generating recipes based on available ingredients. It features barcode scanning, expiration date tracking, and AI-powered recipe suggestions. The app is built as a mobile-first progressive web application with an elegant "modern farmhouse" design aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for local state (InventoryContext, ShoppingListContext)
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom "modern farmhouse" theme (sage, cream, charcoal palette)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Style**: RESTful JSON API under `/api/*` routes
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **AI Integration**: OpenAI API (via Replit AI Integrations) for recipe generation with streaming responses

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Key Data Models
- **Users**: Basic authentication structure (id, username, password)
- **Inventory Items**: Name, brand, quantity (count), amount/amountUnit (size/volume), category, expiry date, barcode
- **Shopping List Items**: Name, category, checked status
- **Conversations/Messages**: AI chat history for recipe generation
- **Recipes**: Title, description, ingredients (array), instructions, prep/cook time, servings, category, source, favorite status

### API Structure
- `GET/POST /api/inventory` - Inventory CRUD operations
- `GET /api/inventory/category/:category` - Filter by category
- `GET /api/inventory/expired` - Expired items query
- `GET/POST/PATCH/DELETE /api/shopping-list` - Shopping list management
- `POST /api/generate-recipe` - AI recipe generation with streaming
- `GET/POST/PATCH/DELETE /api/recipes` - Recipe Book CRUD operations
- `POST /api/recipes/parse-pdf` - Upload PDF and extract recipe using AI

### Feature Modules
- **Barcode Scanning**: ZXing library for camera-based barcode detection
- **Recipe Book**: Store and manage recipes with PDF upload and AI extraction
- **AI Integration**: Replit-specific OpenAI integration modules in `server/replit_integrations/`
  - Chat routes for conversation management
  - Image generation capabilities
  - Batch processing utilities with rate limiting
  - PDF-to-recipe extraction using OpenAI

### Build Configuration
- Development: Vite dev server with HMR on port 5000
- Production: esbuild bundles server, Vite builds client to `dist/public`
- Server serves static files in production, proxies to Vite in development

## External Dependencies

### Database
- PostgreSQL database (provisioned via Replit, connection via DATABASE_URL)

### AI Services
- OpenAI API via Replit AI Integrations
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Third-Party Libraries
- **@zxing/library**: Barcode scanning and decoding
- **Framer Motion**: Animation library
- **date-fns**: Date manipulation and formatting
- **Zod**: Runtime schema validation (shared with drizzle-zod)
- **pdf-parse**: PDF text extraction for recipe upload
- **multer**: File upload handling middleware

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Development tooling
- `@replit/vite-plugin-dev-banner`: Development environment indicator
- Custom `vite-plugin-meta-images`: OpenGraph image URL handling for deployments