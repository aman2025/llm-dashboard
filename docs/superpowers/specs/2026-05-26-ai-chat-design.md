# AI Chat Feature Design

## Overview

Add a full-screen AI chat interface at `/chat` that streams responses from a local LLM (`qwen-mlx` via OpenAI-compatible API) with PostgreSQL-backed chat history.

---

## Visual Design

### Aesthetic: Deep Space

| Element | Value |
|---|---|
| Background | `#0a0a1a` → `#12101f` gradient |
| Sidebar | `#16213e` |
| Conversation panel | `#16213e` |
| Input area | `#1a1a2e` |
| Accent | `#6061f5` (indigo) |
| Text primary | `#e0e0e0` |
| Text muted | `#6b7280` |
| Border | `#ffffff08` |
| Glow | `box-shadow: 0 0 12px #6061f544` |

### Typography

- **Font**: macOS system font (SF Pro via `font-family: -apple-system, BlinkMacSystemFont`)
- **Monospace**: SF Mono for code blocks
- **Scale**: 13px body, 12px muted, 14px headers

### Layout: Floating Panels (Layout B)

```
┌─────────────────────────────────────────────────────────────┐
│  [nav header - existing]                                    │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  History   │         Conversation                           │
│  Sidebar   │         (messages + reason blocks)            │
│  200px     │                                                │
│            │                                                │
│  ───────── │                                                │
│  + New     │                                                │
│  Chat 1    │                                                │
│  Chat 2    │                                                │
│            ├────────────────────────────────────────────────┤
│            │  [chat input]                      [send ▶]   │
└────────────┴────────────────────────────────────────────────┘
```

- Sidebar: 200px, rounded panels, 16px gaps
- Conversation: full remaining width, scrollable
- Input: 52px height, rounded inset, attached to bottom
- No resize handles (fixed layout per Layout B)

---

## Features

### Frontend

1. **Chat history sidebar**
   - New chat button at top
   - Session list below (scrollable)
   - Click to switch session
   - Active session highlighted with accent border
   - Delete session (icon button)

2. **Conversation panel**
   - Message bubbles: user (right-aligned, accent tint) / assistant (left-aligned, subtle)
   - Reasoning block: collapsed by default, " reasoning..." teaser (50px min-height)
   - Streaming: tokens appear one-by-one, cursor blink at end
   - Timestamps on hover

3. **Chat input**
   - Textarea (auto-grow, max 120px)
   - Send button (lucide `SendHorizontal`)
   - Submit on Enter, Shift+Enter for newline
   - Disabled state while streaming

4. **Reason block**
   - Shown after assistant message completes
   - Collapsed with teaser text initially
   - Click to expand full reasoning
   - Monospace font, muted styling

### Backend

1. **POST `/api/chat/stream`** — SSE streaming endpoint
   - Request: `{ sessionId: string, message: string }`
   - Stores user message to PostgreSQL
   - Forwards to LLM API with system prompt
   - Streams SSE response back to client
   - Stores assistant response to PostgreSQL on completion

2. **GET `/api/chat/sessions`** — list all sessions (ordered by updatedAt)
3. **GET `/api/chat/sessions/:id/messages`** — get messages for a session
4. **DELETE `/api/chat/sessions/:id`** — delete a session

### Data Model (Prisma)

```prisma
model ChatSession {
  id        String   @id @default(uuid())
  messages  ChatMessage[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ChatMessage {
  id            String   @id @default(uuid())
  sessionId     String
  session       ChatSession @relation(fields: [sessionId], references: [id])
  role          String   // "user" | "assistant"
  content       String
  reasoning     String? // reasoning block content
  createdAt     DateTime @default(now())
}
```

### API Details

**LLM Config (hardcoded):**
- `API_URL = "http://192.168.2.8:8000/v1/chat/completions"`
- `API_KEY = "zr425899"`
- `MODEL = "qwen-mlx"`

**System prompt:** "You are a helpful AI assistant."

**LLM API request (OpenAI-compatible):**
```json
POST /v1/chat/completions
{
  "model": "qwen-mlx",
  "messages": [
    { "role": "system", "content": "You are a helpful AI assistant." },
    { "role": "user", "content": "user message" }
  ],
  "stream": true
}
```

**Native LLM SSE response format:**
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

**Client-facing SSE format (transformed by backend):**
```
data: {"content": "Hello"}
data: {"content": " world"}
data: {"content": "!"}
data: {"reasoning": "Thinking process..."}
data: [DONE]
```

The backend transforms OpenAI's SSE format (`choices[0].delta.content`) into a simplified client format. The `reasoning` field is included when the model provides a reasoning block.

---

## Technical Stack

- **Frontend**: React 19, TanStack Query, TanStack Router, Zustand, axios, TailwindCSS v4, lucide-react
- **Backend**: Elysia.js (Bun), Prisma, PostgreSQL
- **Streaming**: SSE (Server-Sent Events) via Elysiac's streaming support

---

## File Structure

### Frontend (`client/src/`)

```
modules/ai-chat/
  index.tsx                 # Page component
  components/
    ChatSidebar.tsx          # History sidebar
    ChatPanel.tsx            # Conversation area
    ChatInput.tsx            # Input textarea + send
    MessageBubble.tsx        # Single message with reason block
    ReasonBlock.tsx          # Collapsible reasoning
  hooks/
    useChatStream.ts        # SSE streaming hook
    useChatSessions.ts      # Session CRUD via TanStack Query
  stores/
    chat-store.ts            # Zustand store (existing, enhanced)
  api/
    chat.ts                  # Axios API calls
  types/
    index.ts                 # ChatMessage, ChatSession types

```

### Backend (`server/src/`)

```
modules/chat/
  controller.ts             # Route handlers
  service.ts                 # LLM API + DB operations
  types.ts                   # Request/response types
  index.ts                  # Route registration

routes/
  index.ts                   # Include chat routes
```

---

## Out of Scope

- Custom system prompt UI
- Multiple model selection
- Message editing
- Session naming/renaming
- Search
- Test framework (MVP)