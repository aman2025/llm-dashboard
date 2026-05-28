# Streaming Chat Debug Guide

## Changes Made

### 1. ChatPanel.tsx
- **Changed**: Now reads messages from Zustand store instead of React Query
- **Added**: Syncs API messages to store when session is selected
- **Added**: Debug logging to track message loading

### 2. useChatStream.ts
- **Added**: Comprehensive debug logging for streaming events
- **Fixed**: Reasoning accumulation (server sends full text, not incremental)
- **Added**: Event counting and detailed logging

### 3. MessageBubble.tsx & ReasonBlock.tsx
- **Added**: Streaming state indicators (pulsing cursor)
- **Changed**: ReasonBlock now expanded by default

## How to Debug

### Step 1: Open Browser Console
Open DevTools (F12) and go to Console tab

### Step 2: Click a Chat Session
You should see:
```
[ChatPanel] Loading session from API: <session-id> messages: <count>
[ChatPanel] Render - activeSessionId: <session-id> messages: <count> isStreaming: false
```

**If you don't see messages loading:**
- Check Network tab for `/api/chat/sessions/<id>/messages` request
- Verify the API response has messages
- Check if `apiMessages` is populated in React DevTools

### Step 3: Send a Message
You should see:
```
[useChatStream] Starting stream for session: <session-id>
[useChatStream] Fetching: http://localhost:3002/api/chat/stream
[useChatStream] Event 1: {content: "Hello"}
[useChatStream] Updating content, length: 5
[useChatStream] Event 2: {reasoning: "The user..."}
[useChatStream] Updating reasoning, length: 12
...
[useChatStream] Stream complete, invalidating queries
[useChatStream] Stream finished. Total events: <count>
```

## Common Issues

### Issue 1: No messages when clicking session
**Symptom**: Empty chat panel after clicking a session in sidebar

**Debug**:
1. Check console for `[ChatPanel] Loading session from API`
2. Check Network tab for API call to `/api/chat/sessions/<id>/messages`
3. Verify API returns messages in correct format

**Possible causes**:
- API not returning messages
- Session ID mismatch
- React Query not fetching (check `enabled` flag)

### Issue 2: No token-by-token display
**Symptom**: Messages appear all at once after streaming completes

**Debug**:
1. Check console for `[useChatStream] Event` logs
2. Verify events are being received incrementally
3. Check if Zustand store is updating (React DevTools)

**Possible causes**:
- Server not streaming (buffering response)
- Client not reading stream incrementally
- Zustand store not triggering re-renders

### Issue 3: Reasoning not appearing
**Symptom**: No reasoning block shown

**Debug**:
1. Check server logs for "Reasoning delta:" messages
2. Check client console for reasoning events
3. Verify `event.reasoning !== undefined` is working

**Possible causes**:
- LLM not sending `reasoning_content` field
- Server not detecting reasoning field
- Client filtering out reasoning updates

## Testing Checklist

- [ ] Click existing session → messages load
- [ ] Send new message → user message appears immediately
- [ ] Assistant message appears token-by-token
- [ ] Reasoning block appears and updates in real-time
- [ ] Reasoning block is expanded by default
- [ ] Cursor indicator shows during streaming
- [ ] Auto-scroll works during streaming
- [ ] Stream completes successfully

## Server-Side Verification

Check server console for:
```
=== LLM STREAM START ===
Model: MLX-Qwen3.5-9B-Claude-4.6-Opus-6bit
Session: <session-id>

--- Chunk 1 ---
Full parsed object: {...}
Content delta: "Hello"
Reasoning delta: "The user"

--- Chunk 2 ---
...

=== LLM STREAM END ===
Total chunks: <count>
Full content: <text>
Reasoning content: <text>
```

If you don't see chunks, the LLM API might not be streaming properly.
