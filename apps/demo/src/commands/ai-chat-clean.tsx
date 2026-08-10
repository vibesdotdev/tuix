/** @jsxImportSource @tuix/jsx */

/**
 * AI Chat Demo - Clean Vibes-style Interface
 *
 * Matches the visual quality of the vibes team's blessed implementation:
 * - Thin, clean borders (not rounded)
 * - Minimal padding
 * - Consistent styling
 * - Purple accent for main panel
 * - Solid black backgrounds
 */

import { style, colors } from '@tuix/ansi'
import { $state } from '@tuix/reactive'
import { Effect } from 'effect'

// Simulate AI response streaming
async function* simulateStreaming(response: string, delayMs: number = 30) {
  for (const char of response) {
    yield char
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
}

export default function AIChatClean() {
  // Reactive state
  const messages = $state<
    Array<{
      id: string
      role: 'user' | 'assistant' | 'system'
      content: string
      timestamp: string
    }>
  >([
    {
      id: '1',
      role: 'system',
      content: 'Welcome to TUIX AI Chat! Type your message to get started. Press ? for help.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const streamingContent = $state('')
  const isStreaming = $state(false)
  const totalTokens = $state(0)

  // Sample responses
  const sampleResponses = [
    `Here's a simple example using Express and TypeScript:

\`\`\`typescript
import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany();
  res.json(users);
});

app.listen(3000);
\`\`\`

This creates a GET endpoint that returns all users from the database.`,

    `For authentication, add middleware:

\`\`\`typescript
import jwt from 'jsonwebtoken';

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/users', authenticate, async (req, res) => {
  const users = await db.users.findMany();
  res.json(users);
});
\`\`\`

This adds JWT-based authentication!`,
  ]

  let responseIndex = 0

  const sendMessage = async (content: string) => {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    messages.$set([...messages(), userMsg])

    isStreaming.$set(true)
    streamingContent.$set('')

    const response = sampleResponses[responseIndex % sampleResponses.length]
    responseIndex++

    let fullResponse = ''
    for await (const char of simulateStreaming(response, 20)) {
      fullResponse += char
      streamingContent.$set(fullResponse)
    }

    const assistantMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: fullResponse,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    messages.$set([...messages(), assistantMsg])
    totalTokens.$set(totalTokens() + Math.floor(fullResponse.length / 4))

    isStreaming.$set(false)
    streamingContent.$set('')
  }

  // Auto-send demo messages
  Effect.runPromise(
    Effect.gen(function* () {
      yield* Effect.sleep(1500)
      yield* Effect.promise(() => sendMessage('How do I create a REST API endpoint?'))
      yield* Effect.sleep(3000)
      yield* Effect.promise(() => sendMessage('Thanks! How about with authentication?'))
    })
  )

  return (
    <vstack>
      {/* Header - simple, no border */}
      <box padding={1} style={style().bg(colors.black)}>
        <text style={style().bold()}>TUIX AI Chat</text>
      </box>

      {/* Main layout - thin borders only */}
      <hstack>
        {/* Sidebar - clean, minimal */}
        <box border="thin" minWidth={25} style={style().fg(colors.white).bg(colors.black)}>
          <vstack>
            <text style={style().bold()}>Navigation</text>
            <box padding={1} style={style().bg(colors.gray).fg(colors.white)}>
              <text>+ New Chat</text>
            </box>
            <text>○ Settings</text>
          </vstack>
        </box>

        {/* Main panel - purple accent like theirs */}
        <box border="thin" style={style().fg(colors.magenta).bg(colors.black)}>
          <vstack>
            <text style={style().bold()}>Messages</text>
            <text></text>

            {/* Messages */}
            {messages().map(msg => {
              if (msg.role === 'system') {
                return (
                  <vstack key={msg.id}>
                    <text style={style().faint()}>ⓘ System • {msg.timestamp}</text>
                    <text></text>
                    <text>{msg.content}</text>
                    <text></text>
                  </vstack>
                )
              }

              if (msg.role === 'user') {
                return (
                  <vstack key={msg.id}>
                    <text style={style().fg(colors.blue)}>You • {msg.timestamp}</text>
                    <text></text>
                    <text>{msg.content}</text>
                    <text></text>
                  </vstack>
                )
              }

              if (msg.role === 'assistant') {
                return (
                  <vstack key={msg.id}>
                    <text style={style().fg(colors.green)}>Assistant • {msg.timestamp}</text>
                    <text></text>
                    <text>{msg.content}</text>
                    <text></text>
                  </vstack>
                )
              }

              return null
            })}

            {/* Streaming */}
            {isStreaming() && (
              <vstack>
                <text style={style().fg(colors.green)}>Assistant • streaming...</text>
                <text></text>
                <text>{streamingContent()}</text>
                <text></text>
              </vstack>
            )}
          </vstack>
        </box>
      </hstack>

      {/* Input - clean thin border like theirs */}
      <box border="thin" style={style().fg(colors.magenta).bg(colors.black)}>
        <text>Type your message (Enter to send)</text>
      </box>

      {/* Status bar - no border, just text */}
      <box style={style().bg(colors.black).fg(colors.white)}>
        <text>
          {isStreaming() ? '⏳ Generating...' : '✓ Ready'} • Messages: {messages().length} • Tokens:{' '}
          {totalTokens()} • Tab to switch focus • ? for help
        </text>
      </box>
    </vstack>
  )
}
