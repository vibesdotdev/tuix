/** @jsxImportSource @tuix/jsx */

/**
 * Interactive AI Chat Demo - Production-quality chat interface
 *
 * Demonstrates building a fully interactive chat UI with TUIX that matches
 * the quality of the vibes team's blessed implementation. Features:
 * - Live message streaming simulation
 * - Interactive sidebar navigation
 * - Real-time status updates
 * - Clean, professional styling
 * - Stays alive with interactive mode
 */

import { style, colors, textGradient, sunsetGradient } from '@tuix/ansi'
import { $state } from '@tuix/reactive'
import { Effect } from 'effect'

// Simulate AI response streaming
async function* simulateStreaming(response: string, delayMs: number = 30) {
  for (const char of response) {
    yield char
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
}

export default function AIChatInteractive() {
  // Reactive state
  const messages = $state<Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
  }>>([
    {
      id: '1',
      role: 'system',
      content: 'Welcome to TUIX AI Chat! This is an interactive demo showing how to build chat interfaces with TUIX.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const streamingContent = $state('')
  const isStreaming = $state(false)
  const activeConversationId = $state('1')
  const totalTokens = $state(0)
  const inputFocused = $state(false)

  // Conversation list
  const conversations = $state([
    { id: '1', title: 'API Development', active: true, lastMessage: 'How do I create...' },
    { id: '2', title: 'Database Queries', active: false, lastMessage: 'Show me SQL...' },
    { id: '3', title: 'React Patterns', active: false, lastMessage: 'What are hooks...' },
    { id: '4', title: 'Testing Strategies', active: false, lastMessage: 'How to test...' }
  ])

  // Sample AI responses for demo
  const sampleResponses = [
    `Here's a simple example using Express and TypeScript:

\`\`\`typescript
import express from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());

// Define request schema
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

// GET endpoint
app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany();
  res.json(users);
});

// POST endpoint with validation
app.post('/api/users', async (req, res) => {
  const result = UserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: result.error
    });
  }

  const user = await db.users.create({
    data: result.data
  });

  res.json(user);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
\`\`\`

This creates a REST API with:
- Type-safe request handling
- Input validation with Zod
- Async/await for database operations
- Proper error responses`,

    `For authentication, you can add middleware:

\`\`\`typescript
import jwt from 'jsonwebtoken';

// Auth middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token'
    });
  }
};

// Protected endpoint
app.get('/api/users',
  authenticate,
  async (req, res) => {
    const users = await db.users.findMany();
    res.json(users);
  }
);
\`\`\`

This adds JWT-based authentication to your endpoints!`
  ]

  let responseIndex = 0

  // Simulate sending a message
  const sendMessage = async (content: string) => {
    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    messages.$set([...messages(), userMsg])

    // Start streaming assistant response
    isStreaming.$set(true)
    streamingContent.$set('')

    const response = sampleResponses[responseIndex % sampleResponses.length]
    responseIndex++

    let fullResponse = ''
    for await (const char of simulateStreaming(response, 20)) {
      fullResponse += char
      streamingContent.$set(fullResponse)
    }

    // Add complete assistant message
    const assistantMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: fullResponse,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    messages.$set([...messages(), assistantMsg])

    // Update token count
    totalTokens.$set(totalTokens() + Math.floor(fullResponse.length / 4))

    isStreaming.$set(false)
    streamingContent.$set('')
  }

  // Auto-send initial demo messages
  Effect.runPromise(Effect.gen(function* () {
    yield* Effect.sleep(1000)
    yield* Effect.promise(() => sendMessage('How do I create a REST API endpoint?'))
    yield* Effect.sleep(2000)
    yield* Effect.promise(() => sendMessage('Thanks! How about with authentication?'))
  }))

  const getStatusMessage = () => {
    if (isStreaming()) {
      return 'Generating response...'
    }
    return `Ready • Messages: ${messages().length} • Tokens: ${totalTokens()}`
  }

  return (
    <vstack>
      {/* Header */}
      <box border="thin" padding={1} style={style().fg(colors.magenta).bg(colors.black)}>
        <text style={style().bold().fg(colors.magenta)}>🤖 TUIX AI Chat</text>
        <text style={style().faint().fg(colors.gray)}> • Interactive Demo</text>
      </box>

      <text></text>

      {/* Main layout */}
      <hstack>
        {/* Sidebar */}
        <box border="thin" padding={1} minWidth={32} style={style().fg(colors.gray).bg(colors.black)}>
          <vstack>
            <text style={style().bold().fg(colors.white)}>💬 Conversations</text>
            <text style={style().faint().fg(colors.gray)}>───────────────────────────</text>
            {conversations().map(conv => (
              <vstack key={conv.id}>
                <text
                  style={conv.id === activeConversationId()
                    ? style().bg(colors.magenta).fg(colors.white).bold()
                    : style().fg(colors.white)
                  }
                >
                  {conv.id === activeConversationId() ? '▶ ' : '  '}
                  {conv.title}
                </text>
                <text style={style().faint().fg(colors.gray)} >
                  {'  '}{conv.lastMessage}
                </text>
              </vstack>
            ))}
            <text></text>
            <text style={style().faint().fg(colors.gray)}>───────────────────────────</text>
            <text style={style().fg(colors.green).bold()}>+ New Chat</text>
            <text style={style().fg(colors.yellow)}>⚙ Settings</text>
            <text></text>
            <text style={style().faint().fg(colors.gray)}>Model: claude-3-5-sonnet</text>
            <text style={style().faint().fg(colors.gray)}>Provider: Anthropic</text>
          </vstack>
        </box>

        <text>  </text>

        {/* Main panel */}
        <box border="rounded" padding={1} style={style().fg(colors.white)}>
          <vstack>
            {/* Message history */}
            {messages().map(msg => {
              if (msg.role === 'system') {
                return (
                  <box key={msg.id} border="thin" padding={1} style={style().bg(colors.gray).fg(colors.white)}>
                    <text style={style().italic()}>ℹ️  {msg.content}</text>
                  </box>
                )
              }

              if (msg.role === 'user') {
                return (
                  <vstack key={msg.id}>
                    <hstack>
                      <text style={style().bold().fg(colors.blue)}>👤 You</text>
                      <text style={style().faint().fg(colors.gray)}> • {msg.timestamp}</text>
                    </hstack>
                    <box border="thin" padding={1} style={style().bg(colors.blue).fg(colors.white)}>
                      <text>{msg.content}</text>
                    </box>
                    <text></text>
                  </vstack>
                )
              }

              if (msg.role === 'assistant') {
                return (
                  <vstack key={msg.id}>
                    <hstack>
                      <text style={style().bold().fg(colors.green)}>🤖 Assistant</text>
                      <text style={style().faint().fg(colors.gray)}> • {msg.timestamp}</text>
                    </hstack>
                    <box border="thin" padding={1} style={style().bg(colors.black).fg(colors.white)}>
                      <text>{msg.content}</text>
                    </box>
                    <text></text>
                  </vstack>
                )
              }

              return null
            })}

            {/* Streaming content */}
            {isStreaming() && (
              <vstack>
                <hstack>
                  <text style={style().bold().fg(colors.green)}>🤖 Assistant</text>
                  <text style={style().faint().fg(colors.gray)}> • streaming...</text>
                </hstack>
                <box border="thin" padding={1} style={style().bg(colors.black).fg(colors.white)}>
                  <text>{streamingContent()}</text>
                </box>
                <text></text>
              </vstack>
            )}

            {/* Input area */}
            <box
              border="rounded"
              padding={1}
              style={inputFocused()
                ? style().bg(colors.gray).fg(colors.white)
                : style().bg(colors.black).fg(colors.gray)
              }
            >
              <text>💬 Type your message here... (Enter to send)</text>
            </box>
          </vstack>
        </box>
      </hstack>

      <text></text>

      {/* Status bar */}
      <box padding={1} style={style().bg(colors.blue).fg(colors.white)}>
        <hstack>
          <text style={style().bold()}>{isStreaming() ? '⏳' : '✅'} {getStatusMessage()}</text>
          <text> • </text>
          <text style={style().faint()}>Tab to switch focus • Ctrl+N new chat • ? for help • Ctrl+C to exit</text>
        </hstack>
      </box>
    </vstack>
  )
}
