# API Plan - Malowanko

## Overview

This document describes the API architecture for the Malowanko application built with Next.js 16, utilizing Server Actions for mutations and Server Components for data fetching. Instead of traditional REST endpoints, we leverage Next.js patterns for a more integrated approach.

## 1. Resources and Data Models

### 1.1 Core Entities

| Entity      | Database Table | Description                          |
| ----------- | -------------- | ------------------------------------ |
| Profile     | `profiles`     | User profile extending Supabase Auth |
| Coloring    | `colorings`    | Generated coloring pages             |
| UserLibrary | `user_library` | User's personal library (junction)   |
| Favorite    | `favorites`    | Global favorites (junction)          |

### 1.2 Database Views

| View                | Description                              |
| ------------------- | ---------------------------------------- |
| `public_gallery`    | Public view of colorings without user_id |
| `user_library_view` | User library with coloring metadata      |

### 1.3 Database Functions

| Function                       | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `check_and_update_daily_limit` | Atomically checks and updates generation limit |
| `get_remaining_generations`    | Returns remaining generations for today        |

---

## 2. Type Definitions (DTOs)

### 2.1 Common Types

```typescript
// src/types/common.ts

export type AgeGroup = "0-3" | "4-8" | "9-12";
export type ColoringStyle = "prosty" | "klasyczny" | "szczegolowy" | "mandala";
export type SortOrder = "newest" | "popular";
export type PrintOrientation = "portrait" | "landscape";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### 2.2 Profile DTOs

```typescript
// src/types/profile.ts

export interface ProfileDTO {
  id: string;
  email: string;
  createdAt: string;
  generationsToday: number;
  remainingGenerations: number;
}

export interface GenerationLimitDTO {
  used: number;
  remaining: number;
  limit: number;
  resetsAt: string; // ISO timestamp of next midnight
}
```

### 2.3 Coloring DTOs

```typescript
// src/types/coloring.ts

export interface ColoringDTO {
  id: string;
  imageUrl: string;
  prompt: string;
  tags: string[];
  ageGroup: AgeGroup;
  style: ColoringStyle;
  createdAt: string;
  favoritesCount: number;
}

export interface GalleryColoringDTO extends ColoringDTO {
  isFavorited?: boolean; // Only for authenticated users
}

export interface LibraryColoringDTO extends ColoringDTO {
  addedAt: string;
  isLibraryFavorite: boolean;
  isGlobalFavorite: boolean;
}

// Input DTOs
export interface GenerateColoringInput {
  prompt: string;
  ageGroup: AgeGroup;
  style: ColoringStyle;
  count: 1 | 2 | 3 | 4 | 5;
}

export interface GenerateColoringResult {
  colorings: ColoringDTO[];
  remainingGenerations: number;
}
```

### 2.4 Gallery DTOs

```typescript
// src/types/gallery.ts

export interface GalleryFilters {
  search?: string;
  ageGroups?: AgeGroup[];
  styles?: ColoringStyle[];
  sortBy: SortOrder;
}

export interface GalleryQueryParams extends GalleryFilters, PaginationParams {}
```

---

## 3. Server Actions (Mutations)

All server actions are located in `src/lib/actions/` and use the `"use server"` directive.

### 3.1 Authentication Actions

**File:** `src/lib/actions/auth.ts`

#### `signInWithMagicLink`

Sends a magic link to the user's email for authentication.

```typescript
export async function signInWithMagicLink(email: string): Promise<ActionResult>;
```

**Input:**

- `email`: Valid email address

**Success Response:**

```json
{
  "success": true
}
```

**Error Codes:**

- `INVALID_EMAIL` - Invalid email format
- `RATE_LIMITED` - Too many requests
- `EMAIL_SEND_FAILED` - Failed to send email

---

#### `signOut`

Signs out the current user.

```typescript
export async function signOut(): Promise<ActionResult>;
```

**Success Response:**

```json
{
  "success": true
}
```

---

### 3.2 Coloring Generation Actions

**File:** `src/lib/actions/colorings.ts`

#### `generateColorings`

Generates new coloring pages based on user input.

```typescript
export async function generateColorings(
  input: GenerateColoringInput
): Promise<ActionResult<GenerateColoringResult>>;
```

**Input:**

```json
{
  "prompt": "kot grający na gitarze",
  "ageGroup": "4-8",
  "style": "klasyczny",
  "count": 2
}
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "colorings": [
      {
        "id": "uuid",
        "imageUrl": "https://...",
        "prompt": "kot grający na gitarze",
        "tags": ["kot", "muzyka", "gitara", "zwierzęta"],
        "ageGroup": "4-8",
        "style": "klasyczny",
        "createdAt": "2026-01-03T12:00:00Z",
        "favoritesCount": 0
      }
    ],
    "remainingGenerations": 8
  }
}
```

**Error Codes:**

- `UNAUTHORIZED` - User not authenticated
- `DAILY_LIMIT_EXCEEDED` - Daily generation limit reached
- `INVALID_PROMPT` - Prompt is empty or too long (>500 chars)
- `UNSAFE_CONTENT` - Prompt contains inappropriate content
- `GENERATION_FAILED` - OpenAI API error
- `GENERATION_TIMEOUT` - Generation took longer than 30s

**Validation:**

- `prompt`: Required, max 500 characters
- `ageGroup`: Must be one of: '0-3', '4-8', '9-12'
- `style`: Must be one of: 'prosty', 'klasyczny', 'szczegolowy', 'mandala'
- `count`: Integer between 1-5, must not exceed remaining daily limit

**Business Logic:**

1. Validate user is authenticated
2. Check daily limit allows requested count
3. Validate prompt safety using GPT-4
4. Generate images using DALL-E 3
5. Generate tags using GPT-4
6. Store colorings in database
7. Upload images to Supabase Storage
8. Update daily generation count
9. Auto-add to user's library (via database trigger)

---

#### `deleteColoring`

Deletes a coloring owned by the user.

```typescript
export async function deleteColoring(coloringId: string): Promise<ActionResult>;
```

**Success Response:**

```json
{
  "success": true
}
```

**Error Codes:**

- `UNAUTHORIZED` - User not authenticated
- `NOT_FOUND` - Coloring not found
- `FORBIDDEN` - User doesn't own this coloring

---

### 3.3 Library Actions

**File:** `src/lib/actions/library.ts`

#### `addToLibrary`

Adds a coloring from the public gallery to user's library.

```typescript
export async function addToLibrary(coloringId: string): Promise<ActionResult>;
```

**Success Response:**

```json
{
  "success": true
}
```

**Error Codes:**

- `UNAUTHORIZED` - User not authenticated
- `NOT_FOUND` - Coloring not found
- `ALREADY_IN_LIBRARY` - Coloring already in user's library

---

#### `removeFromLibrary`

Removes a coloring from user's library.

```typescript
export async function removeFromLibrary(
  coloringId: string
): Promise<ActionResult>;
```

**Success Response:**

```json
{
  "success": true
}
```

**Error Codes:**

- `UNAUTHORIZED` - User not authenticated
- `NOT_FOUND` - Coloring not in user's library
- `CANNOT_REMOVE_OWN` - Cannot remove own generated coloring from library

---

#### `toggleLibraryFavorite`

Toggles the favorite status within user's library.

```typescript
export async function toggleLibraryFavorite(
  coloringId: string
): Promise<ActionResult<{ isFavorite: boolean }>>;
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "isFavorite": true
  }
}
```

**Error Codes:**

- `UNAUTHORIZED` - User not authenticated
- `NOT_FOUND` - Coloring not in user's library

---

### 3.4 Favorites Actions

**File:** `src/lib/actions/favorites.ts`

#### `toggleGlobalFavorite`

Toggles global favorite status (affects public favorites count).

```typescript
export async function toggleGlobalFavorite(
  coloringId: string
): Promise<ActionResult<{ isFavorite: boolean; favoritesCount: number }>>;
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "isFavorite": true,
    "favoritesCount": 42
  }
}
```

**Error Codes:**

- `UNAUTHORIZED` - User not authenticated
- `NOT_FOUND` - Coloring not found

---

## 4. Data Fetching Functions (Queries)

All query functions are located in `src/lib/queries/` and are designed to be used in Server Components.

### 4.1 Profile Queries

**File:** `src/lib/queries/profile.ts`

#### `getCurrentProfile`

Gets the current authenticated user's profile.

```typescript
export async function getCurrentProfile(): Promise<ProfileDTO | null>;
```

---

#### `getGenerationLimit`

Gets the current user's generation limit status.

```typescript
export async function getGenerationLimit(): Promise<GenerationLimitDTO | null>;
```

**Response:**

```json
{
  "used": 3,
  "remaining": 7,
  "limit": 10,
  "resetsAt": "2026-01-04T00:00:00Z"
}
```

---

### 4.2 Gallery Queries

**File:** `src/lib/queries/gallery.ts`

#### `getPublicGallery`

Fetches colorings for the public gallery with filtering, search, and pagination.

```typescript
export async function getPublicGallery(
  params: GalleryQueryParams
): Promise<PaginatedResponse<GalleryColoringDTO>>;
```

**Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 50)
- `search`: Optional search query (searches prompts and tags)
- `ageGroups`: Optional filter by age groups
- `styles`: Optional filter by styles
- `sortBy`: 'newest' | 'popular' (default: 'newest')

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "imageUrl": "https://...",
      "prompt": "kot grający na gitarze",
      "tags": ["kot", "muzyka", "gitara"],
      "ageGroup": "4-8",
      "style": "klasyczny",
      "createdAt": "2026-01-03T12:00:00Z",
      "favoritesCount": 42,
      "isFavorited": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Notes:**

- Works for both authenticated and unauthenticated users
- `isFavorited` is only included for authenticated users

---

#### `getColoringById`

Fetches a single coloring by ID (for detail view/printing).

```typescript
export async function getColoringById(
  id: string
): Promise<GalleryColoringDTO | null>;
```

---

### 4.3 Library Queries

**File:** `src/lib/queries/library.ts`

#### `getUserLibrary`

Fetches the authenticated user's library with optional filtering.

```typescript
export async function getUserLibrary(
  params: LibraryQueryParams
): Promise<PaginatedResponse<LibraryColoringDTO>>;
```

**Parameters:**

```typescript
interface LibraryQueryParams extends PaginationParams {
  favoritesOnly?: boolean;
  sortBy?: "added" | "created";
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "imageUrl": "https://...",
      "prompt": "kot grający na gitarze",
      "tags": ["kot", "muzyka"],
      "ageGroup": "4-8",
      "style": "klasyczny",
      "createdAt": "2026-01-03T12:00:00Z",
      "favoritesCount": 42,
      "addedAt": "2026-01-03T12:00:00Z",
      "isLibraryFavorite": true,
      "isGlobalFavorite": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

#### `getUserFavorites`

Fetches colorings that user has globally favorited.

```typescript
export async function getUserFavorites(
  params: PaginationParams
): Promise<PaginatedResponse<GalleryColoringDTO>>;
```

---

## 5. API Routes (Edge Cases)

Some operations require traditional API routes due to their nature.

### 5.1 PDF Generation

**File:** `app/api/colorings/[id]/pdf/route.ts`

#### `GET /api/colorings/[id]/pdf`

Generates and downloads a PDF of the coloring page.

**Query Parameters:**

- `orientation`: 'portrait' | 'landscape' (default: 'portrait')

**Response:**

- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="kolorowanka-{prompt-slug}.pdf"`

**Error Responses:**

- `404` - Coloring not found
- `500` - PDF generation failed

---

### 5.2 Image Proxy (Optional)

**File:** `app/api/images/[...path]/route.ts`

Proxies images from Supabase Storage with optional transformations.

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

The application uses Supabase Auth with magic link authentication.

```
User enters email
    ↓
signInWithMagicLink() sends magic link
    ↓
User clicks link in email
    ↓
Supabase Auth callback creates session
    ↓
Profile created automatically (database trigger)
    ↓
User redirected to app
```

### 6.2 Session Management

- Sessions are managed via Supabase SSR package (`@supabase/ssr`)
- Session tokens stored in HTTP-only cookies
- Middleware refreshes tokens on each request
- Server Actions access session via `createServerClient()`

### 6.3 Authorization Rules

| Resource   | Action     | Authenticated | Owner Only | Public |
| ---------- | ---------- | ------------- | ---------- | ------ |
| Profile    | Read       | ✅ (own only) | ✅         | ❌     |
| Profile    | Update     | ✅ (own only) | ✅         | ❌     |
| Coloring   | Create     | ✅            | -          | ❌     |
| Coloring   | Read       | ✅            | ❌         | ✅     |
| Coloring   | Delete     | ✅            | ✅         | ❌     |
| Library    | Read       | ✅ (own only) | ✅         | ❌     |
| Library    | Add/Remove | ✅ (own only) | ✅         | ❌     |
| Favorites  | Toggle     | ✅            | -          | ❌     |
| Gallery    | Browse     | ✅            | ❌         | ✅     |
| PDF Export | Download   | ✅            | ❌         | ✅     |

### 6.4 Row Level Security

RLS policies are enforced at the database level (see db-plan.md for details):

- `profiles`: Users can only read/update their own profile
- `colorings`: Public read, authenticated create, owner delete
- `user_library`: Users can only access their own library entries
- `favorites`: Users can only access their own favorites

---

## 7. Validation & Business Logic

### 7.1 Input Validation

All input validation is performed using Zod schemas.

**File:** `src/lib/validations/`

```typescript
// src/lib/validations/coloring.ts
import { z } from "zod";

export const ageGroupSchema = z.enum(["0-3", "4-8", "9-12"]);
export const styleSchema = z.enum([
  "prosty",
  "klasyczny",
  "szczegolowy",
  "mandala",
]);

export const generateColoringSchema = z.object({
  prompt: z
    .string()
    .min(1, "Opis jest wymagany")
    .max(500, "Opis może mieć maksymalnie 500 znaków"),
  ageGroup: ageGroupSchema,
  style: styleSchema,
  count: z.number().int().min(1).max(5),
});

// src/lib/validations/gallery.ts
export const galleryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
  ageGroups: z.array(ageGroupSchema).optional(),
  styles: z.array(styleSchema).optional(),
  sortBy: z.enum(["newest", "popular"]).default("newest"),
});
```

### 7.2 Business Logic Implementation

#### Daily Generation Limit

```typescript
// src/lib/services/generation-limit.ts

export async function checkGenerationLimit(
  userId: string,
  requestedCount: number
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createServerClient();

  // Uses database function for atomic check
  const { data, error } = await supabase.rpc("check_and_update_daily_limit", {
    p_user_id: userId,
    p_count: requestedCount,
  });

  if (error || !data) {
    return { allowed: false, remaining: 0 };
  }

  const remaining = await supabase.rpc("get_remaining_generations", {
    p_user_id: userId,
  });

  return { allowed: true, remaining: remaining.data ?? 0 };
}
```

#### Prompt Safety Validation

```typescript
// src/lib/services/content-moderation.ts

export async function validatePromptSafety(
  prompt: string
): Promise<{ safe: boolean; message?: string }> {
  // Uses GPT-4 to analyze prompt for inappropriate content
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a content moderator for a children's coloring book app. 
                  Analyze the following prompt and determine if it's appropriate for children.
                  Respond with JSON: { "safe": boolean, "reason": string }`,
      },
      { role: "user", content: prompt },
    ],
  });

  // Parse and return result
}
```

#### Automatic Tag Generation

```typescript
// src/lib/services/tag-generator.ts

export async function generateTags(prompt: string): Promise<string[]> {
  // Uses GPT-4 to generate 3-5 Polish tags
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Generate 3-5 Polish tags for a coloring page based on the description.
                  Return as JSON array of strings.`,
      },
      { role: "user", content: prompt },
    ],
  });

  // Parse and return tags array
}
```

---

## 8. Error Handling

### 8.1 Error Response Format

All server actions return a consistent error format:

```typescript
interface ActionError {
  code: string;      // Machine-readable error code
  message: string;   // User-friendly Polish message
}

interface ActionResult<T = void> {
  success: false;
  error: ActionError;
} | {
  success: true;
  data?: T;
}
```

### 8.2 Error Codes Reference

| Code                   | HTTP Equiv | Description                |
| ---------------------- | ---------- | -------------------------- |
| `UNAUTHORIZED`         | 401        | User not authenticated     |
| `FORBIDDEN`            | 403        | User lacks permission      |
| `NOT_FOUND`            | 404        | Resource not found         |
| `VALIDATION_ERROR`     | 400        | Input validation failed    |
| `INVALID_EMAIL`        | 400        | Invalid email format       |
| `INVALID_PROMPT`       | 400        | Prompt validation failed   |
| `UNSAFE_CONTENT`       | 400        | Content moderation blocked |
| `DAILY_LIMIT_EXCEEDED` | 429        | Generation limit reached   |
| `RATE_LIMITED`         | 429        | Too many requests          |
| `GENERATION_FAILED`    | 500        | AI generation error        |
| `GENERATION_TIMEOUT`   | 504        | Generation took too long   |
| `INTERNAL_ERROR`       | 500        | Unexpected server error    |

### 8.3 User-Friendly Error Messages

```typescript
// src/lib/errors/messages.ts

export const errorMessages: Record<string, string> = {
  UNAUTHORIZED: "Musisz być zalogowany, aby wykonać tę akcję.",
  FORBIDDEN: "Nie masz uprawnień do wykonania tej akcji.",
  NOT_FOUND: "Nie znaleziono żądanego zasobu.",
  VALIDATION_ERROR: "Wprowadzone dane są nieprawidłowe.",
  INVALID_EMAIL: "Podaj prawidłowy adres e-mail.",
  INVALID_PROMPT: "Opis kolorowanki jest nieprawidłowy.",
  UNSAFE_CONTENT:
    "Ups! Ten temat nie nadaje się do kolorowanki. Spróbuj czegoś innego.",
  DAILY_LIMIT_EXCEEDED: "Wykorzystałeś dzienny limit generowań. Wróć jutro!",
  RATE_LIMITED: "Zbyt wiele żądań. Poczekaj chwilę.",
  GENERATION_FAILED: "Nie udało się wygenerować kolorowanki. Spróbuj ponownie.",
  GENERATION_TIMEOUT: "Generowanie trwa zbyt długo. Spróbuj ponownie.",
  INTERNAL_ERROR: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
};
```

---

## 9. File Structure

```
src/
├── lib/
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── colorings.ts
│   │   ├── library.ts
│   │   └── favorites.ts
│   ├── queries/
│   │   ├── profile.ts
│   │   ├── gallery.ts
│   │   └── library.ts
│   ├── services/
│   │   ├── openai.ts
│   │   ├── content-moderation.ts
│   │   ├── image-generator.ts
│   │   ├── tag-generator.ts
│   │   └── generation-limit.ts
│   ├── validations/
│   │   ├── auth.ts
│   │   ├── coloring.ts
│   │   └── gallery.ts
│   └── errors/
│       ├── codes.ts
│       └── messages.ts
├── types/
│   ├── common.ts
│   ├── profile.ts
│   ├── coloring.ts
│   └── gallery.ts
└── app/
    └── api/
        └── colorings/
            └── [id]/
                └── pdf/
                    └── route.ts
```

---

## 10. Security Considerations

### 10.1 Rate Limiting

- Magic link requests: Max 3 per email per 15 minutes
- Coloring generation: Enforced by daily limit (10/day)
- Gallery API: Soft limit of 100 requests/minute per IP

### 10.2 Input Sanitization

- All user inputs are validated with Zod schemas
- Prompts are validated for safety before AI processing
- SQL injection prevented by Supabase client parameterization
- XSS prevented by React's default escaping

### 10.3 File Upload Security

- Images stored in Supabase Storage with public read access
- Upload paths include user ID for ownership tracking
- Only authenticated users can upload (via generation)
- File deletion cascades with coloring deletion

---

## 11. Performance Considerations

### 11.1 Caching Strategy

- Gallery queries: Cached with `revalidate: 60` (1 minute)
- Static coloring detail pages: ISR with on-demand revalidation
- User library: No cache (always fresh)

### 11.2 Database Optimization

- Composite indexes for common gallery queries
- GIN indexes for tag and full-text search
- Denormalized `favorites_count` for sorting efficiency
- Views for optimized common queries

### 11.3 Image Optimization

- Images served via Next.js Image component
- Supabase CDN for static asset delivery
- Lazy loading for gallery grid
