/**
 * Tabs Component Tests
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import { Tabs, Tab, SimpleTabs, PillTabs, VerticalTabs } from './Tabs.js'
import { $state } from '../../../../core/update/reactivity/runes.js'

describe('Tabs Component', () => {
  describe('Basic rendering', () => {
    it('should render tabs with content', () => {
      const component = Tabs({
        children: [
          Tab({
            label: 'Tab 1',
            children: <text>Content 1</text>,
          }),
          Tab({
            label: 'Tab 2',
            children: <text>Content 2</text>,
          }),
        ],
      })

      expect(component).toBeDefined()
      expect(component.type).toBe('interactive')
    })

    it('should render tabs with icons', () => {
      const component = Tabs({
        children: [
          Tab({
            label: 'Settings',
            icon: '⚙️',
            children: <text>Settings content</text>,
          }),
          Tab({
            label: 'Profile',
            icon: '👤',
            children: <text>Profile content</text>,
          }),
        ],
      })

      expect(component).toBeDefined()
    })

    it('should render tabs with badges', () => {
      const component = Tabs({
        children: [
          Tab({
            label: 'Messages',
            badge: 5,
            children: <text>Messages content</text>,
          }),
          Tab({
            label: 'Notifications',
            badge: 'New',
            children: <text>Notifications content</text>,
          }),
        ],
      })

      expect(component).toBeDefined()
    })
  })

  describe('Tab selection', () => {
    it('should handle controlled active index', () => {
      const activeIndex = $state(1)
      let changeCalled = false

      const component = Tabs({
        activeIndex,
        onTabChange: index => {
          changeCalled = true
          expect(index).toBe(0)
        },
        children: [
          Tab({
            label: 'Tab 1',
            children: <text>Content 1</text>,
          }),
          Tab({
            label: 'Tab 2',
            children: <text>Content 2</text>,
          }),
        ],
      })

      expect(activeIndex.value).toBe(1)
    })

    it('should handle uncontrolled active index', () => {
      const component = Tabs({
        children: [
          Tab({
            label: 'Tab 1',
            children: <text>Content 1</text>,
          }),
          Tab({
            label: 'Tab 2',
            children: <text>Content 2</text>,
          }),
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
          Tab({
            label: 'Closeable Tab',
            closeable: true,
            children: <text>Can be closed</text>,
          }),
          Tab({
            label: 'Fixed Tab',
            closeable: false,
            children: <text>Cannot be closed</text>,
          }),
        ],
      })

      expect(component).toBeDefined()
    })

    it('should handle disabled tabs', () => {
      const component = Tabs({
        children: [
          Tab({
            label: 'Active Tab',
            disabled: false,
            children: <text>Active content</text>,
          }),
          Tab({
            label: 'Disabled Tab',
            disabled: true,
            children: <text>Disabled content</text>,
          }),
        ],
      })

      expect(component).toBeDefined()
    })
  })

  describe('Tab orientations', () => {
    it('should render horizontal tabs', () => {
      const component = Tabs({
        orientation: 'horizontal',
        children: [
          Tab({
            label: 'Tab 1',
            children: <text>Content 1</text>,
          }),
          Tab({
            label: 'Tab 2',
            children: <text>Content 2</text>,
          }),
        ],
      })

      expect(component).toBeDefined()
    })

    it('should render vertical tabs', () => {
      const component = Tabs({
        orientation: 'vertical',
        children: [
          Tab({
            label: 'Tab 1',
            children: <text>Content 1</text>,
          }),
          Tab({
            label: 'Tab 2',
            children: <text>Content 2</text>,
          }),
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
            Tab({
              label: 'Tab',
              children: <text>Content</text>,
            }),
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
          Tab({
            label: 'Simple 1',
            children: <text>Content 1</text>,
          }),
          Tab({
            label: 'Simple 2',
            children: <text>Content 2</text>,
          }),
        ],
      })

      expect(component).toBeDefined()
      expect(component.type).toBe('interactive')
    })

    it('should render PillTabs', () => {
      const component = PillTabs({
        children: [
          Tab({
            label: 'Pill 1',
            children: <text>Content 1</text>,
          }),
          Tab({
            label: 'Pill 2',
            children: <text>Content 2</text>,
          }),
        ],
      })

      expect(component).toBeDefined()
      expect(component.type).toBe('interactive')
    })

    it('should render VerticalTabs', () => {
      const component = VerticalTabs({
        children: [
          Tab({
            label: 'Vertical 1',
            children: <text>Content 1</text>,
          }),
          Tab({
            label: 'Vertical 2',
            children: <text>Content 2</text>,
          }),
        ],
      })

      expect(component).toBeDefined()
      expect(component.type).toBe('interactive')
    })
  })
})
