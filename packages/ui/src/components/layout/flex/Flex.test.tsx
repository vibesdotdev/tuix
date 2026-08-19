/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import type { View } from '@tuix/view'

import { Box } from '../box'
import { Flex, FlexItem, Row, Column } from '../flex'

/** Render a JSX element tree to its string output (root context supplied). */
async function renderOutput(element: unknown, context?: { width: number; height: number }) {
  const { renderJsxTree } = await import('./render-helper')
  return renderJsxTree(element, context)
}

describe('Box', () => {
  test('bordered box renders real box-drawing characters around content', async () => {
    const out = await renderOutput(<Box border>hi</Box>)
    expect(out).toContain('┌')
    expect(out).toContain('hi')
    expect(out).toContain('└')
  })

  test('background paints through the box pipeline', async () => {
    const out = await renderOutput(<Box background="#123456">x</Box>)
    expect(out).toContain('48;2;18;52;86')
  })

  test('numeric width pads content', async () => {
    const out = await renderOutput(<Box width={10}>ab</Box>)
    const firstLine = out.split('\n')[0] ?? ''
    expect(firstLine.replace(/\x1b\[[0-9;]*m/g, '').length).toBeGreaterThanOrEqual(10)
  })

  test('fill sizing resolves against the render context', async () => {
    const out = await renderOutput(<Box width="fill">z</Box>, { width: 12, height: 1 })
    expect(out.replace(/\x1b\[[0-9;]*m/g, '').startsWith('z')).toBe(true)
    expect(out.replace(/\x1b\[[0-9;]*m/g, '').length).toBeGreaterThanOrEqual(12)
  })

  test('direction=horizontal lays children side by side', async () => {
    const out = await renderOutput(
      <Box direction="horizontal">
        <text>aa</text>
        <text>bb</text>
      </Box>
    )
    expect(out.replace(/\x1b\[[0-9;]*m/g, '')).toContain('aabb')
  })
})

describe('Flex', () => {
  test('row lays out horizontally with gap', async () => {
    const out = await renderOutput(
      <Flex direction="row" gap={2}>
        <text>a</text>
        <text>b</text>
      </Flex>
    )
    expect(out.replace(/\x1b\[[0-9;]*m/g, '')).toContain('a  b')
  })

  test('column lays out vertically', async () => {
    const out = await renderOutput(
      <Column>
        <text>top</text>
        <text>bot</text>
      </Column>
    )
    const lines = out.split('\n')
    expect(lines[0]?.startsWith('top')).toBe(true)
    expect(lines[1]?.startsWith('bot')).toBe(true)
  })

  test('justify=center centers content in a filled row', async () => {
    const out = await renderOutput(
      <Row justify="center" width="fill">
        <text>xy</text>
      </Row>,
      { width: 10, height: 1 }
    )
    const plain = out.replace(/\x1b\[[0-9;]*m/g, '')
    expect(plain.indexOf('xy')).toBe(4)
  })

  test('FlexItem grow distributes remaining width', async () => {
    const out = await renderOutput(
      <Row width="fill">
        <FlexItem grow={1}>
          <text>L</text>
        </FlexItem>
        <text>R</text>
      </Row>,
      { width: 10, height: 1 }
    )
    const plain = out.replace(/\x1b\[[0-9;]*m/g, '')
    expect(plain.startsWith('L')).toBe(true)
    expect(plain.trimEnd().endsWith('R')).toBe(true)
    expect(plain.length).toBeGreaterThanOrEqual(10)
  })

  test('background fills the flex container', async () => {
    const out = await renderOutput(
      <Row background="#0d1117" width="fill">
        <text>q</text>
      </Row>,
      { width: 8, height: 1 }
    )
    expect(out).toContain('48;2;13;17;23')
  })
})

describe('flex intrinsic (low-level checks)', () => {
  test('spacer with flex=1 pushes content apart in a filled row', async () => {
    const out = await renderOutput(
      <hstack width="fill">
        <text>L</text>
        <spacer flex={1} />
        <text>R</text>
      </hstack>,
      { width: 10, height: 1 }
    )
    const plain = out.replace(/\x1b\[[0-9;]*m/g, '')
    expect(plain.startsWith('L')).toBe(true)
    expect(plain.endsWith('R')).toBe(true)
  })
})
