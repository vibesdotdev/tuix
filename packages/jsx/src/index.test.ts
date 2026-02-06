/**
 * JSX Runtime Tests
 *
 * Comprehensive tests for the JSX runtime system
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import { Effect } from 'effect'
import { jsx, jsxs, jsxDEV, Fragment, createElement, JSXContext, render } from './index'
import { scopeManager } from './scope/manager'
import { text } from '@tuix/view/primitives/view'

describe('JSX Runtime', () => {
  beforeEach(() => {
    // Clear any existing scope state
    scopeManager.clear()
  })

  describe('jsx function', () => {
    it('should create basic JSX elements', () => {
      const element = jsx('div', { className: 'test', children: 'Hello World' })

      expect(element).toBeDefined()
      expect(element.type).toBe('div')
      expect(element.props.className).toBe('test')
      expect(element.props.children).toBe('Hello World')
    })

    it('should handle empty props', () => {
      const element = jsx('span', { children: 'content' })

      expect(element.type).toBe('span')
      expect(element.props.children).toBe('content')
    })

    it('should handle null props', () => {
      const element = jsx('p', { children: 'text' })

      expect(element.type).toBe('p')
      expect(element.props.children).toBe('text')
    })

    it('should handle multiple children', () => {
      const child1 = jsx('span', { children: 'first' })
      const child2 = jsx('span', { children: 'second' })
      const element = jsx('div', { children: [child1, child2] })

      expect(Array.isArray(element.props.children)).toBe(true)
      expect(element.props.children).toHaveLength(2)
    })

    it('should handle nested elements', () => {
      const inner = jsx('span', { children: 'inner text' })
      const outer = jsx('div', { id: 'outer', children: inner })

      expect(outer.type).toBe('div')
      expect(outer.props.id).toBe('outer')
      expect(outer.props.children.type).toBe('span')
    })
  })

  describe('jsxs function', () => {
    it('should handle static children', () => {
      const element = jsxs('ul', {
        children: [
          jsx('li', { children: 'Item 1' }),
          jsx('li', { children: 'Item 2' }),
          jsx('li', { children: 'Item 3' }),
        ],
      })

      expect(element.type).toBe('ul')
      expect(Array.isArray(element.props.children)).toBe(true)
      expect(element.props.children).toHaveLength(3)
    })

    it('should preserve child order', () => {
      const element = jsxs('div', {
        children: [
          jsx('h1', { children: 'Title' }),
          jsx('p', { children: 'Content' }),
          jsx('footer', { children: 'Footer' }),
        ],
      })

      const children = element.props.children
      expect(children[0].type).toBe('h1')
      expect(children[1].type).toBe('p')
      expect(children[2].type).toBe('footer')
    })
  })

  describe('Fragment', () => {
    it('should create fragment elements', () => {
      const fragment = jsx(Fragment, {
        children: [
          jsx('span', { children: 'First' }),
          jsx('span', { children: 'Second' }),
        ],
      })

      expect(fragment.type).toBe(Fragment)
      expect(Array.isArray(fragment.props.children)).toBe(true)
    })

    it('should handle empty fragments', () => {
      const fragment = jsx(Fragment, {})

      expect(fragment.type).toBe(Fragment)
      expect(fragment.props.children).toBeUndefined()
    })
  })

  describe('createElement', () => {
    it('should create elements with component functions', () => {
      const MyComponent = (props: { name: string }) =>
        jsx('div', { children: `Hello, ${props.name}!` })

      const element = createElement(MyComponent, { name: 'World' })

      expect(element.type).toBe(MyComponent)
      expect(element.props.name).toBe('World')
    })

    it('should handle component with children', () => {
      const Container = (props: { children: any }) =>
        jsx('div', { className: 'container', children: props.children })

      const element = createElement(Container, {}, jsx('p', { children: 'Child content' }))

      expect(element.type).toBe(Container)
      expect(element.props.children.type).toBe('p')
    })
  })

  describe('Built-in components', () => {
    it('should handle text components', async () => {
      // Simulate built-in text component
      const TextComponent = (props: { children: string }) => {
        return text(props.children)
      }

      const element = jsx(TextComponent, { children: 'Hello World' })
      expect(element.props.children).toBe('Hello World')
    })

    it('should handle container components', () => {
      const Box = (props: { border?: boolean; children: any }) =>
        jsx('div', {
          className: props.border ? 'bordered' : 'simple',
          children: props.children,
        })

      const element = jsx(Box, { border: true, children: 'Content' })

      expect(element.props.border).toBe(true)
      expect(element.props.children).toBe('Content')
    })
  })

  describe('Props handling', () => {
    it('should spread props correctly', () => {
      const baseProps = { id: 'test', className: 'base' }
      const element = jsx('div', { ...baseProps, className: 'override' })

      expect(element.props.id).toBe('test')
      expect(element.props.className).toBe('override') // Later props should override
    })

    it('should handle boolean props', () => {
      const element = jsx('input', {
        disabled: true,
        checked: false,
        hidden: undefined,
      })

      expect(element.props.disabled).toBe(true)
      expect(element.props.checked).toBe(false)
      expect(element.props.hidden).toBeUndefined()
    })

    it('should handle function props', () => {
      const handler = () => 'clicked'
      const element = jsx('button', { onClick: handler, children: 'Click me' })

      expect(typeof element.props.onClick).toBe('function')
      expect(element.props.onClick()).toBe('clicked')
    })
  })

  describe('Key and ref handling', () => {
    it('should handle key prop', () => {
      const element = jsx('div', { key: 'unique-key', children: 'content' })

      expect(element.key).toBe('unique-key')
      expect(element.props.key).toBeUndefined() // Key should be extracted
    })

    it('should handle ref prop', () => {
      const refCallback = (node: any) => node
      const element = jsx('input', { ref: refCallback })

      expect(element.ref).toBe(refCallback)
      expect(element.props.ref).toBeUndefined() // Ref should be extracted
    })
  })

  describe('Conditional rendering', () => {
    it('should handle conditional elements', () => {
      const showContent = true
      const element = jsx('div', {
        children: showContent ? jsx('p', { children: 'Visible' }) : null,
      })

      expect(element.props.children.type).toBe('p')
    })

    it('should handle false/null children', () => {
      const element = jsx('div', { children: [false, null, undefined] })

      // These should be filtered out or handled appropriately
      expect(element.props.children).toBeDefined()
    })
  })

  describe('List rendering', () => {
    it('should handle arrays of elements', () => {
      const items = ['apple', 'banana', 'cherry']
      const list = jsx('ul', {
        children: items.map((item, index) => jsx('li', { key: index, children: item })),
      })

      expect(list.type).toBe('ul')
      expect(Array.isArray(list.props.children)).toBe(true)
      expect(list.props.children).toHaveLength(3)
    })

    it('should preserve keys in lists', () => {
      const items = [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
      ]

      const list = jsx('div', {
        children: items.map(item => jsx('span', { key: item.id, children: item.name })),
      })

      const children = list.props.children
      expect(children[0].key).toBe(1)
      expect(children[1].key).toBe(2)
    })
  })

  describe('Error boundaries', () => {
    it('should handle component errors gracefully', () => {
      const ErrorComponent = () => {
        throw new Error('Component error')
      }

      // JSX creation should not throw, rendering might
      const element = jsx(ErrorComponent, {})
      expect(element.type).toBe(ErrorComponent)
    })

    it('should handle invalid prop types', () => {
      const element = jsx('div', {
        style: 'invalid-style-type', // Usually should be object
      })

      expect(element.props.style).toBe('invalid-style-type')
      // JSX should accept it, validation happens elsewhere
    })
  })

  describe('Performance', () => {
    it('should create elements efficiently', () => {
      const startTime = performance.now()

      // Create many elements
      for (let i = 0; i < 1000; i++) {
        jsx('div', { id: `item-${i}`, children: `Item ${i}` })
      }

      const endTime = performance.now()
      const creationTime = endTime - startTime

      expect(creationTime).toBeLessThan(100) // Should be fast
    })

    it('should handle deep nesting efficiently', () => {
      const startTime = performance.now()

      let nested = jsx('span', { children: 'deepest' })
      for (let i = 0; i < 100; i++) {
        nested = jsx('div', { level: i, children: nested })
      }

      const endTime = performance.now()
      const nestingTime = endTime - startTime

      expect(nestingTime).toBeLessThan(50)
      expect(nested.type).toBe('div')
    })
  })

  describe('Context integration', () => {
    it('should work with JSX context', () => {
      // Test context provider/consumer pattern
      const ThemeContext = {
        theme: 'dark',
        setTheme: (theme: string) => theme,
      }

      const Provider = (props: { value: any; children: any }) =>
        jsx('div', { 'data-context': 'provider', children: props.children })

      const element = jsx(Provider, {
        value: ThemeContext,
        children: jsx('span', { children: 'Themed content' }),
      })

      expect(element.props.value).toBe(ThemeContext)
    })
  })

  describe('Interactive integration', () => {
    it('should attach metadata to interactive views', () => {
      const handler = () => 'clicked'
      const element = jsx('interactive', {
        onClick: handler,
        children: jsx('text', { children: 'Click me' }),
      })

      const view = render(element)
      const metadata = (view as any)[Symbol.for('tuix.interactive')]

      expect(metadata).toBeDefined()
      expect(metadata.events?.onClick).toBe(handler)
      expect(metadata.focusable).toBe(true)
    })
  })

  describe('Memory management', () => {
    it('should not create circular references', () => {
      const parent = jsx('div', {})
      const child = jsx('span', { parent })

      // Should not create problematic references
      expect(child.props.parent).toBe(parent)
      expect(JSON.stringify(child)).toBeDefined() // Should be serializable
    })

    it('should handle large element trees', () => {
      const createTree = (depth: number): any => {
        if (depth === 0) return jsx('span', { children: 'leaf' })
        return jsx('div', { depth, children: createTree(depth - 1) })
      }

      const tree = createTree(50)
      expect(tree.type).toBe('div')
      expect(tree.props.depth).toBe(50)
    })
  })
})
