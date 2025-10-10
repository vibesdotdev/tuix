/** @jsxImportSource @tuix/jsx */

/**
 * AI Chat Demo - Demonstrates building a chat interface like exemplar's CLI
 *
 * This showcases how to build terminal UIs with TUIX that the vibes team
 * currently builds with blessed. Key features:
 * - Multi-panel layout (sidebar + main + status)
 * - Message streaming simulation
 * - Syntax highlighting for code blocks
 * - Status updates
 * - Clean JSX component structure
 */

import { style, colors, textGradient, sunsetGradient } from '@tuix/ansi'

export default function AIChatDemo() {
  // Simulate chat history
  const chatHistory = [
    {
      role: 'system',
      content: 'Welcome to TUIX AI Chat! This demonstrates how to build chat interfaces.',
      timestamp: '14:23'
    },
    {
      role: 'user',
      content: 'How do I create a REST API endpoint?',
      timestamp: '14:24'
    },
    {
      role: 'assistant',
      content: `Here's a simple example using Express:

\`\`\`typescript
import express from 'express';

const app = express();

app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany();
  res.json(users);
});

app.listen(3000);
\`\`\`

This creates a GET endpoint that returns all users.`,
      timestamp: '14:24'
    },
    {
      role: 'user',
      content: 'Thanks! How about with authentication?',
      timestamp: '14:25'
    }
  ]

  // Simulate sidebar items (chat history)
  const conversations = [
    { id: '1', title: 'API Development', active: true },
    { id: '2', title: 'Database Queries' },
    { id: '3', title: 'React Patterns' },
    { id: '4', title: 'Testing Strategies' }
  ]

  return (
    <vstack>
      {/* Header with gradient title */}
      <box border="double" padding={1} style={style().bg(colors.black)}>
        <text>{textGradient({ gradient: sunsetGradient(), text: '🤖 TUIX AI Chat Demo' })}</text>
      </box>

      <text></text>

      {/* Main chat layout */}
      <hstack>
        {/* Sidebar - Conversation list */}
        <box border="rounded" padding={1} minWidth={30} style={style().fg(colors.cyan)}>
          <vstack>
            <text style={style().bold().fg(colors.cyan)}>💬 Conversations</text>
            <text></text>
            {conversations.map(conv => (
              <text key={conv.id} style={conv.active ? style().bg(colors.blue).fg(colors.white) : style().fg(colors.gray)}>
                {conv.active ? '▶ ' : '  '}{conv.title}
              </text>
            ))}
            <text></text>
            <text style={style().faint().fg(colors.gray)}>────────────────────</text>
            <text style={style().fg(colors.green)}>+ New Chat</text>
          </vstack>
        </box>

        <text>  </text>

        {/* Main panel - Messages */}
        <box border="rounded" padding={1} style={style().fg(colors.white)}>
          <vstack>
            {/* Message history */}
            {chatHistory.map((msg, i) => {
              if (msg.role === 'system') {
                return (
                  <box key={i} border="thin" padding={1} style={style().bg(colors.gray).fg(colors.white)}>
                    <text style={style().italic()}>ℹ️  {msg.content}</text>
                  </box>
                )
              }

              if (msg.role === 'user') {
                return (
                  <vstack key={i}>
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
                  <vstack key={i}>
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

            {/* Streaming indicator */}
            <hstack>
              <text style={style().bold().fg(colors.green)}>🤖 Assistant</text>
              <text style={style().faint().fg(colors.gray)}> • typing...</text>
            </hstack>
            <box border="thin" padding={1} style={style().bg(colors.black).fg(colors.white)}>
              <text style={style().faint()}>●●●</text>
            </box>

            <text></text>

            {/* Input area */}
            <box border="rounded" padding={1} style={style().bg(colors.gray).fg(colors.white)}>
              <text>💬 Type your message here... (Enter to send)</text>
            </box>
          </vstack>
        </box>
      </hstack>

      <text></text>

      {/* Status bar */}
      <box padding={1} style={style().bg(colors.blue).fg(colors.white)}>
        <hstack>
          <text>Ready</text>
          <text> • </text>
          <text>Model: claude-3-5-sonnet</text>
          <text> • </text>
          <text>Tokens: 1,247</text>
          <text> • </text>
          <text>Messages: 4</text>
          <text> • </text>
          <text style={style().faint()}>Tab to switch focus • ? for help • Esc to exit</text>
        </hstack>
      </box>
    </vstack>
  )
}
