/**
 * Tabs Component Tests
 */

import { describe, it, expect } from 'bun:test'
import { Effect } from 'effect'
import { toView } from '@tuix/jsx'
import { Tabs, Tab, SimpleTabs, PillTabs, VerticalTabs } from './Tabs.js'
import { $state } from '@tuix/reactive'

async function paint(node: unknown): Promise<string> {
  const view = toView(node)
  const out = await Effect.runPromise(view.render())
  return typeof out === 'string' ? out : out.content
}

describe('Tabs Component', () => {
  describe('Basic rendering', () => {
    it('should render tabs with content', () => {
      const component = Tabs({
        children: [
          <Tab label="Tab 1">
            <text>Content 1</text>
          </Tab>,
          <Tab label="Tab 2">
            <text>Content 2</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
      expect(component.type).toBe('interactive')
    })

    it('should render tabs with icons', () => {
      const component = Tabs({
        children: [
          <Tab label="Settings" icon="⚙️">
            <text>Settings content</text>
          </Tab>,
          <Tab label="Profile" icon="👤">
            <text>Profile content</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
    })

    it('should render tabs with badges', () => {
      const component = Tabs({
        children: [
          <Tab label="Messages" badge={5}>
            <text>Messages content</text>
          </Tab>,
          <Tab label="Notifications" badge="New">
            <text>Notifications content</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
    })

    it('should paint labels and content from real JSX children', async () => {
      const content = await paint(
        <Tabs>
          <Tab label="Alpha">
            <text>Alpha content</text>
          </Tab>
          <Tab label="Beta">
            <text>Beta content</text>
          </Tab>
        </Tabs>
      )

      expect(content).toContain('Alpha')
      expect(content).toContain('Beta')
      expect(content).toContain('Alpha content')
      expect(content).not.toContain('[tab]')
      expect(content).not.toContain('[object Object]')
    })
  })

  describe('Tab selection', () => {
    it('should handle controlled active index', () => {
      const activeIndex = $state(1)

      const component = Tabs({
        activeIndex,
        onTabChange: index => {
          expect(index).toBe(0)
        },
        children: [
          <Tab label="Tab 1">
            <text>Content 1</text>
          </Tab>,
          <Tab label="Tab 2">
            <text>Content 2</text>
          </Tab>,
        ],
      })

      expect(activeIndex()).toBe(1)
    })

    it('should handle uncontrolled active index', () => {
      const component = Tabs({
        children: [
          <Tab label="Tab 1">
            <text>Content 1</text>
          </Tab>,
          <Tab label="Tab 2">
            <text>Content 2</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
    })
  })

  describe('Tab features', () => {
    it('should handle closeable tabs', () => {
      let closeCalled = false

      const component = Tabs({
        onTabClose: index => {
          closeCalled = true
          expect(index).toBeGreaterThanOrEqual(0)
        },
        children: [
          <Tab label="Closeable Tab" closeable>
            <text>Can be closed</text>
          </Tab>,
          <Tab label="Fixed Tab" closeable={false}>
            <text>Cannot be closed</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
    })

    it('should handle disabled tabs', () => {
      const component = Tabs({
        children: [
          <Tab label="Active Tab" disabled={false}>
            <text>Active content</text>
          </Tab>,
          <Tab label="Disabled Tab" disabled>
            <text>Disabled content</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
    })

    it('should not recurse forever when moving focus with all tabs disabled', () => {
      const component = Tabs({
        autoFocus: true,
        children: [
          <Tab label="A" disabled>
            <text>A</text>
          </Tab>,
          <Tab label="B" disabled>
            <text>B</text>
          </Tab>,
        ],
      })

      const onKeyPress = (component.props as { onKeyPress: (key: string) => void }).onKeyPress
      expect(typeof onKeyPress).toBe('function')
      expect(() => onKeyPress('ArrowRight')).not.toThrow()
    })
  })

  describe('Tab orientations', () => {
    it('should render horizontal tabs', () => {
      const component = Tabs({
        orientation: 'horizontal',
        children: [
          <Tab label="Tab 1">
            <text>Content 1</text>
          </Tab>,
          <Tab label="Tab 2">
            <text>Content 2</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
    })

    it('should render vertical tabs', () => {
      const component = Tabs({
        orientation: 'vertical',
        children: [
          <Tab label="Tab 1">
            <text>Content 1</text>
          </Tab>,
          <Tab label="Tab 2">
            <text>Content 2</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
    })
  })

  describe('Tab positions', () => {
    it('should render tabs at different positions', () => {
      const positions = ['top', 'bottom', 'left', 'right'] as const

      positions.forEach(position => {
        const component = Tabs({
          tabPosition: position,
          children: [
            <Tab label="Tab">
              <text>Content</text>
            </Tab>,
          ],
        })

        expect(component).toBeDefined()
      })
    })
  })

  describe('Preset Components', () => {
    it('should render SimpleTabs', () => {
      const component = SimpleTabs({
        children: [
          <Tab label="Simple 1">
            <text>Content 1</text>
          </Tab>,
          <Tab label="Simple 2">
            <text>Content 2</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
      expect(component.type).toBe('interactive')
    })

    it('should render PillTabs', () => {
      const component = PillTabs({
        children: [
          <Tab label="Pill 1">
            <text>Content 1</text>
          </Tab>,
          <Tab label="Pill 2">
            <text>Content 2</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
      expect(component.type).toBe('interactive')
    })

    it('should render VerticalTabs', () => {
      const component = VerticalTabs({
        children: [
          <Tab label="Vertical 1">
            <text>Content 1</text>
          </Tab>,
          <Tab label="Vertical 2">
            <text>Content 2</text>
          </Tab>,
        ],
      })

      expect(component).toBeDefined()
      expect(component.type).toBe('interactive')
    })
  })
})
