/**
 * Built-in Command Helpers
 *
 * Provides common commands and subscriptions for MVU applications
 */

import { Effect, Duration, Stream, Schedule } from 'effect'

/**
 * Command type - an Effect that produces a message or null
 */
export type Cmd<Msg> = Effect.Effect<Msg | null>

/**
 * Subscription type - a Stream that produces messages
 */
export type Sub<Msg> = Stream.Stream<Msg>

/**
 * Split a command string into argv, honoring single- and double-quoted segments.
 */
function splitCommandArgs(command: string): string[] {
  const args: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null
  for (const ch of command) {
    if (quote) {
      if (ch === quote) {
        quote = null
      } else {
        current += ch
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === ' ' || ch === '\t') {
      if (current) {
        args.push(current)
        current = ''
      }
    } else {
      current += ch
    }
  }
  if (current) args.push(current)
  return args
}

/**
 * Built-in command helpers
 */
export const Cmd = {
  /**
   * No-op command that produces no message
   *
   * @example
   * ```typescript
   * update: (msg, model) => {
   *   if (msg === 'noop') {
   *     return [model, Cmd.none()]
   *   }
   * }
   * ```
   */
  none: <Msg>(): Cmd<Msg> => Effect.succeed(null),

  /**
   * Execute multiple commands in parallel
   *
   * @example
   * ```typescript
   * return [model, Cmd.batch([
   *   Cmd.delay(1000, { type: 'tick' }),
   *   Cmd.fetch('/api/data', onSuccess, onError)
   * ])]
   * ```
   */
  batch: <Msg>(cmds: Array<Cmd<Msg>>): Cmd<Msg> =>
    Effect.all(cmds, { concurrency: 'unbounded' }).pipe(
      Effect.map(results => {
        // Return the first non-null message
        const msg = results.find(r => r !== null)
        return msg ?? null
      })
    ),

  /**
   * Delay a message by a duration
   *
   * @example
   * ```typescript
   * Cmd.delay(Duration.seconds(2), { type: 'timeout' })
   * ```
   */
  delay: <Msg>(duration: Duration.DurationInput, msg: Msg): Cmd<Msg> =>
    Effect.sleep(duration).pipe(Effect.map(() => msg)),

  /**
   * Execute an Effect and map the result to a message
   *
   * @example
   * ```typescript
   * Cmd.fromEffect(
   *   readFile('data.json'),
   *   data => ({ type: 'loaded', data }),
   *   error => ({ type: 'error', error })
   * )
   * ```
   */
  fromEffect: <A, E, Msg>(
    effect: Effect.Effect<A, E>,
    onSuccess: (result: A) => Msg,
    onError: (error: E) => Msg
  ): Cmd<Msg> =>
    effect.pipe(
      Effect.match({
        onFailure: error => onError(error),
        onSuccess: result => onSuccess(result),
      })
    ),

  /**
   * HTTP fetch command
   *
   * @example
   * ```typescript
   * Cmd.fetch(
   *   'https://api.example.com/data',
   *   data => ({ type: 'success', data }),
   *   error => ({ type: 'error', error })
   * )
   * ```
   */
  fetch: <Msg>(
    url: string,
    onSuccess: (data: any) => Msg,
    onError: (error: any) => Msg
  ): Cmd<Msg> =>
    Effect.tryPromise({
      try: () => fetch(url).then(r => r.json()),
      catch: error => error,
    }).pipe(
      Effect.match({
        onFailure: error => onError(error),
        onSuccess: data => onSuccess(data),
      })
    ),

  /**
   * Execute a shell command
   *
   * @example
   * ```typescript
   * Cmd.exec(
   *   'ls -la',
   *   output => ({ type: 'output', output }),
   *   error => ({ type: 'error', error })
   * )
   * ```
   */
  exec: <Msg>(
    command: string,
    onSuccess: (output: string) => Msg,
    onError: (error: any) => Msg
  ): Cmd<Msg> =>
    Effect.tryPromise({
      try: async () => {
        const proc = Bun.spawn(splitCommandArgs(command), {
          stdout: 'pipe',
          stderr: 'pipe',
        })
        const output = await new Response(proc.stdout).text()
        return output
      },
      catch: error => error,
    }).pipe(
      Effect.match({
        onFailure: error => onError(error),
        onSuccess: output => onSuccess(output),
      })
    ),

  /**
   * Map a command's message
   *
   * @example
   * ```typescript
   * const childCmd = Cmd.delay(1000, 'childMsg')
   * const parentCmd = Cmd.map(childCmd, msg => ({ type: 'parent', child: msg }))
   * ```
   */
  map: <A, B>(cmd: Cmd<A>, fn: (msg: A) => B): Cmd<B> =>
    cmd.pipe(Effect.map(msg => (msg === null ? null : fn(msg)))),
}

/**
 * Built-in subscription helpers
 */
export const Sub = {
  /**
   * No subscription
   */
  none: <Msg>(): Sub<Msg> => Stream.empty,

  /**
   * Interval subscription that fires at regular intervals
   *
   * @example
   * ```typescript
   * subscriptions: model =>
   *   Sub.interval(Duration.seconds(1), { type: 'tick' })
   * ```
   */
  interval: <Msg>(duration: Duration.DurationInput, msg: Msg): Sub<Msg> =>
    Stream.repeatEffect(Effect.sleep(duration).pipe(Effect.map(() => msg))),

  /**
   * Subscription from a Stream
   *
   * @example
   * ```typescript
   * const events = Stream.fromAsyncIterable(eventEmitter)
   * Sub.fromStream(events, event => ({ type: 'event', event }))
   * ```
   */
  fromStream: <A, Msg>(stream: Stream.Stream<A>, toMsg: (value: A) => Msg): Sub<Msg> =>
    stream.pipe(Stream.map(toMsg)),

  /**
   * Combine multiple subscriptions
   *
   * @example
   * ```typescript
   * Sub.batch([
   *   Sub.interval(Duration.seconds(1), { type: 'tick' }),
   *   Sub.fromStream(events, e => ({ type: 'event', e }))
   * ])
   * ```
   */
  batch: <Msg>(subs: Array<Sub<Msg>>): Sub<Msg> =>
    Stream.mergeAll(subs, { concurrency: 'unbounded' }),

  /**
   * Map a subscription's messages
   */
  map: <A, B>(sub: Sub<A>, fn: (msg: A) => B): Sub<B> => sub.pipe(Stream.map(fn)),
}
