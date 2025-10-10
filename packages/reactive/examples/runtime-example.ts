/**
 * Example: Reactive Integration with MVU Runtime
 *
 * Demonstrates how to use reactive hooks to sync state between
 * MVU model and Svelte 5 runes
 */

import { Effect } from 'effect'
import { runApp, Cmd } from '@tuix/runtime'
import { $state, $effect } from '../runes/runes'
import { createReactiveHooks, ReactiveContext } from './hooks'

// =============================================================================
// Counter Example with Reactive State
// =============================================================================

type CounterModel = {
  count: number
  history: number[]
}

type CounterMsg =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }

const counterComponent = {
  init: Effect.succeed([
    { count: 0, history: [] } as CounterModel,
    []
  ] as const),

  update: (msg: CounterMsg, model: CounterModel) => {
    switch (msg.type) {
      case 'increment':
        return Effect.succeed([
          {
            count: model.count + 1,
            history: [...model.history, model.count + 1]
          },
          []
        ] as const)

      case 'decrement':
        return Effect.succeed([
          {
            count: model.count - 1,
            history: [...model.history, model.count - 1]
          },
          []
        ] as const)

      case 'reset':
        return Effect.succeed([
          {
            count: 0,
            history: []
          },
          []
        ] as const)
    }
  },

  view: (model: CounterModel) => ({
    render: () => Effect.succeed(
      `Count: ${model.count}\nHistory: [${model.history.join(', ')}]`
    )
  })
}

/**
 * Run counter with reactive integration
 */
export async function runCounterExample() {
  // Create reactive context
  const context = new ReactiveContext<CounterModel, CounterMsg>()

  // Create reactive state for tracking
  const reactiveCount = $state(0)

  // Register effect to sync reactive state
  context.registerEffect(() => {
    const state = context.getState()
    if (state) {
      reactiveCount.$set(state.count)
      console.log('Reactive count updated:', state.count)
    }
  })

  // Create hooks
  const hooks = createReactiveHooks(context)

  // Run the app
  await Effect.runPromise(
    runApp(counterComponent, {
      hooks,
      exitAfterRender: true
    })
  )

  console.log('Final reactive count:', reactiveCount())
}

// =============================================================================
// Todo List Example with Effects
// =============================================================================

type Todo = {
  id: number
  text: string
  completed: boolean
}

type TodoModel = {
  todos: Todo[]
  nextId: number
}

type TodoMsg =
  | { type: 'addTodo'; text: string }
  | { type: 'toggleTodo'; id: number }
  | { type: 'deleteTodo'; id: number }

const todoComponent = {
  init: Effect.succeed([
    { todos: [], nextId: 1 } as TodoModel,
    []
  ] as const),

  update: (msg: TodoMsg, model: TodoModel) => {
    switch (msg.type) {
      case 'addTodo':
        return Effect.succeed([
          {
            todos: [
              ...model.todos,
              { id: model.nextId, text: msg.text, completed: false }
            ],
            nextId: model.nextId + 1
          },
          []
        ] as const)

      case 'toggleTodo':
        return Effect.succeed([
          {
            ...model,
            todos: model.todos.map(todo =>
              todo.id === msg.id
                ? { ...todo, completed: !todo.completed }
                : todo
            )
          },
          []
        ] as const)

      case 'deleteTodo':
        return Effect.succeed([
          {
            ...model,
            todos: model.todos.filter(todo => todo.id !== msg.id)
          },
          []
        ] as const)
    }
  },

  view: (model: TodoModel) => ({
    render: () => Effect.succeed(
      model.todos
        .map(t => `[${t.completed ? 'x' : ' '}] ${t.text}`)
        .join('\n')
    )
  })
}

/**
 * Run todo example with reactive effects
 */
export async function runTodoExample() {
  const context = new ReactiveContext<TodoModel, TodoMsg>()

  // Track completed count reactively
  const completedCount = $state(0)

  // Register effect to update completed count
  context.registerEffect(() => {
    const state = context.getState()
    if (state) {
      const count = state.todos.filter(t => t.completed).length
      completedCount.$set(count)
      console.log('Completed todos:', count)
    }
  })

  const hooks = createReactiveHooks(context)

  await Effect.runPromise(
    runApp(todoComponent, {
      hooks,
      exitAfterRender: true
    })
  )
}

// =============================================================================
// Advanced Example: Derived State
// =============================================================================

type UserModel = {
  firstName: string
  lastName: string
  age: number
}

type UserMsg =
  | { type: 'setFirstName'; name: string }
  | { type: 'setLastName'; name: string }
  | { type: 'setAge'; age: number }

const userComponent = {
  init: Effect.succeed([
    { firstName: 'John', lastName: 'Doe', age: 30 } as UserModel,
    []
  ] as const),

  update: (msg: UserMsg, model: UserModel) => {
    switch (msg.type) {
      case 'setFirstName':
        return Effect.succeed([{ ...model, firstName: msg.name }, []] as const)
      case 'setLastName':
        return Effect.succeed([{ ...model, lastName: msg.name }, []] as const)
      case 'setAge':
        return Effect.succeed([{ ...model, age: msg.age }, []] as const)
    }
  },

  view: (model: UserModel) => ({
    render: () => Effect.succeed(
      `${model.firstName} ${model.lastName}, ${model.age} years old`
    )
  })
}

/**
 * Run user example with derived reactive state
 */
export async function runUserExample() {
  const context = new ReactiveContext<UserModel, UserMsg>()

  // Create reactive states
  const firstName = $state('')
  const lastName = $state('')
  const fullName = $state('')

  // Register effect to sync and derive full name
  context.registerEffect(() => {
    const state = context.getState()
    if (state) {
      firstName.$set(state.firstName)
      lastName.$set(state.lastName)
      fullName.$set(`${state.firstName} ${state.lastName}`)
      console.log('Full name:', fullName())
    }
  })

  const hooks = createReactiveHooks(context)

  await Effect.runPromise(
    runApp(userComponent, {
      hooks,
      exitAfterRender: true
    })
  )

  console.log('Final full name:', fullName())
}

// =============================================================================
// Run Examples (uncomment to test)
// =============================================================================

// runCounterExample().catch(console.error)
// runTodoExample().catch(console.error)
// runUserExample().catch(console.error)
