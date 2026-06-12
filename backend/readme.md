# GitTools — API Reference

Complete reference for all internal API route handlers exposed by the GitTools Next.js app.

---

## Base URL

| Environment | Base URL |
|-------------|----------|
| Local | `http://localhost:3000` |
| Production | `https://gittools.dev` |

---

## Authentication

GitTools uses **Supabase Auth** with **GitHub OAuth**. Authenticated endpoints require a valid Supabase session, which is stored as an HTTP-only cookie (`sb-*-auth-token`) after the OAuth callback.

There are no API keys for the internal API — authentication is entirely cookie-based.

### Auth Flow Summary

```
POST /auth/callback?code=<github_code>
  └─► Supabase exchanges code → sets session cookie
        └─► All subsequent API requests are authenticated
```

### Error Responses

All authenticated endpoints return the following when unauthenticated:

```json
HTTP 401 Unauthorized

{
  "error": "Unauthorized"
}
```

---

## Response Format

All responses return `application/json`.

### Success

```json
{
  "data": { ... }   // or an array
}
```

### Error

```json
{
  "error": "Human-readable error message"
}
```

### Paginated

```json
{
  "data": [ ... ],
  "count": 42
}
```

---

## Endpoints

---

### Favorites

---

#### `GET /api/favorites`

Retrieve all favorite commands saved by the authenticated user.

**Auth:** Required

**Request:** No body, no query parameters.

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_id": "user-uuid",
      "command_slug": "git-log",
      "created_at": "2025-05-10T12:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "user_id": "user-uuid",
      "command_slug": "git-stash",
      "created_at": "2025-05-08T09:15:00.000Z"
    }
  ]
}
```

**Response `401 Unauthorized`:**

```json
{ "error": "Unauthorized" }
```

**Response `500 Internal Server Error`:**

```json
{ "error": "Failed to fetch favorites" }
```

---

#### `POST /api/favorites`

Add a command to the authenticated user's favorites.

**Auth:** Required

**Request Body:** `application/json`

```json
{
  "command_slug": "git-rebase"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command_slug` | string | Yes | The slug of the command to favorite (e.g., `"git-log"`) |

**Response `201 Created`:**

```json
{
  "data": {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "user_id": "user-uuid",
    "command_slug": "git-rebase",
    "created_at": "2025-05-20T14:30:00.000Z"
  }
}
```

**Response `400 Bad Request`:**

```json
{ "error": "command_slug is required" }
```

**Response `409 Conflict`:**

```json
{ "error": "Already favorited" }
```

**Response `401 Unauthorized`:**

```json
{ "error": "Unauthorized" }
```

---

#### `DELETE /api/favorites`

Remove a command from the authenticated user's favorites.

**Auth:** Required

**Request Body:** `application/json`

```json
{
  "command_slug": "git-rebase"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command_slug` | string | Yes | The slug of the command to unfavorite |

**Response `200 OK`:**

```json
{ "message": "Removed from favorites" }
```

**Response `404 Not Found`:**

```json
{ "error": "Favorite not found" }
```

**Response `401 Unauthorized`:**

```json
{ "error": "Unauthorized" }
```

---

### History

---

#### `GET /api/history`

Retrieve the command usage history of the authenticated user, ordered most-recent first.

**Auth:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `50` | Number of records to return. Max: `200`. |
| `offset` | integer | `0` | Number of records to skip (for pagination). |
| `slug` | string | — | Filter history to a specific command slug. |

**Example Request:**

```
GET /api/history?limit=20&offset=0&slug=git-log
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
      "user_id": "user-uuid",
      "command_slug": "git-log",
      "command_used": "git log --oneline --graph --all -n 20",
      "used_at": "2025-05-20T11:00:00.000Z"
    },
    {
      "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
      "user_id": "user-uuid",
      "command_slug": "git-log",
      "command_used": "git log --author='Vibhav' --since='1 week ago'",
      "used_at": "2025-05-19T16:45:00.000Z"
    }
  ],
  "count": 38
}
```

The `count` field reflects the total number of records matching the query (before `limit`/`offset`).

**Response `401 Unauthorized`:**

```json
{ "error": "Unauthorized" }
```

---

#### `POST /api/history`

Log a command usage event. This is called automatically when the user copies a built command.

**Auth:** Required

**Request Body:** `application/json`

```json
{
  "command_slug": "git-log",
  "command_used": "git log --oneline --graph --all"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command_slug` | string | Yes | The slug of the command category |
| `command_used` | string | Yes | The full constructed command string the user copied |

**Response `201 Created`:**

```json
{ "message": "Logged" }
```

**Response `400 Bad Request`:**

```json
{ "error": "command_slug and command_used are required" }
```

**Response `401 Unauthorized`:**

```json
{ "error": "Unauthorized" }
```

---

### Shared Commands

---

#### `POST /api/share`

Create a publicly shareable link for a specific built command.

**Auth:** Required

**Request Body:** `application/json`

```json
{
  "command_slug": "git-rebase",
  "command_used": "git rebase -i HEAD~3",
  "note": "Use this to squash the last 3 commits before opening a PR."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command_slug` | string | Yes | The slug identifying the command |
| `command_used` | string | Yes | The exact built command string |
| `note` | string | No | Optional annotation or explanation (max 500 chars) |

**Response `201 Created`:**

```json
{
  "id": "f7a2b1c9-d0e1-2345-fabc-456789012345",
  "url": "https://gittools.dev/share/f7a2b1c9-d0e1-2345-fabc-456789012345"
}
```

**Response `400 Bad Request`:**

```json
{ "error": "command_slug and command_used are required" }
```

**Response `401 Unauthorized`:**

```json
{ "error": "Unauthorized" }
```

---

#### `GET /api/share/[id]`

Retrieve a shared command by its UUID. This endpoint is publicly accessible — no auth required.

**Auth:** Not required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | The shared command ID |

**Example Request:**

```
GET /api/share/f7a2b1c9-d0e1-2345-fabc-456789012345
```

**Response `200 OK`:**

```json
{
  "data": {
    "id": "f7a2b1c9-d0e1-2345-fabc-456789012345",
    "command_slug": "git-rebase",
    "command_used": "git rebase -i HEAD~3",
    "note": "Use this to squash the last 3 commits before opening a PR.",
    "created_at": "2025-05-01T10:00:00.000Z"
  }
}
```

**Response `404 Not Found`:**

```json
{ "error": "Not found" }
```

---

### Auth

---

#### `GET /auth/callback`

Handles the GitHub OAuth redirect and establishes the Supabase session. This is called automatically by GitHub/Supabase during the OAuth flow — you do not call this manually.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | The authorization code from GitHub |
| `next` | string | (Optional) The URL to redirect to after login. Defaults to `/`. |

**Behavior:**

- Exchanges the `code` for a Supabase session.
- Sets the `sb-*-auth-token` cookie.
- Redirects the user to the `next` URL.

**Success:** Redirects `302` to `next` (or `/`).

**Failure:** Redirects `302` to `/auth/error` (with session creation failure).

---

## Rate Limits

GitTools does not currently enforce explicit rate limits on its internal API beyond Supabase's own limits. If you are self-hosting, consider adding rate limiting middleware using `@upstash/ratelimit` or similar.

---

## TypeScript Types

The following types are used across both the API and the data layer.

```typescript
// lib/types.ts

export type CommandSlug = string;

export interface Favorite {
  id: string;
  user_id: string;
  command_slug: CommandSlug;
  created_at: string;
}

export interface CommandHistoryEntry {
  id: string;
  user_id: string;
  command_slug: CommandSlug;
  command_used: string;
  used_at: string;
}

export interface SharedCommand {
  id: string;
  user_id: string | null;
  command_slug: CommandSlug;
  command_used: string;
  note: string | null;
  created_at: string;
}

export type CommandOptionType = 'boolean' | 'string' | 'number' | 'enum';

export interface CommandOption {
  id: string;
  flag: string;
  shortFlag?: string;
  label: string;
  description: string;
  type: CommandOptionType;
  default?: boolean | string | number;
  enumValues?: string[];
  placeholder?: string;
  conflicts?: string[];
  requires?: string[];
}

export interface CommandExample {
  description: string;
  command: string;
}

export interface GitCommand {
  slug: CommandSlug;
  name: string;
  category: string;
  description: string;
  longDescription?: string;
  baseCommand: string;
  options: CommandOption[];
  examples: CommandExample[];
  notes?: string[];
  relatedCommands?: CommandSlug[];
}
```

---

## Error Reference

| HTTP Status | Meaning | When It Occurs |
|-------------|---------|----------------|
| `200` | OK | Successful GET |
| `201` | Created | Successful POST |
| `400` | Bad Request | Missing or invalid request body fields |
| `401` | Unauthorized | No valid session cookie |
| `404` | Not Found | Record doesn't exist |
| `409` | Conflict | Duplicate insert (e.g., already favorited) |
| `500` | Internal Server Error | Unexpected server/database error |

---

## Supabase Client Usage (Internal)

### Server-side (Route Handlers, Server Components)

```typescript
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }

  return Response.json({ data });
}
```

### Client-side (Browser Components)

```typescript
import { createBrowserClient } from '@/lib/supabase/client';

const supabase = createBrowserClient();

// Sign in with GitHub
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

---

## Changelog

### v1.0.0

- 70+ Git commands with visual builder
- GitHub OAuth via Supabase Auth
- Favorites, history, and share endpoints
- Dark mode, search, category filter

---

> GitTools API Reference — maintained by [Vibhav Y](https://github.com/Vibhav-y)
