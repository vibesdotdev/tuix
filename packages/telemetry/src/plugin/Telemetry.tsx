/**
 * Telemetry Plugin Component
 */

import type { Component } from '@tuix/core'
import { Box } from '@tuix/ui'
import { EventCollector } from '../collectors/events'
import { ErrorCollector } from '../collectors/errors'
import { PerformanceCollector } from '../collectors/performance'
import type {
  TelemetryConfig,
  TelemetryTransport,
  TelemetryEvent,
  TelemetryError as TelemetryErrorType,
  TelemetryPerformance,
} from '../types'
import { Effect } from 'effect'

export interface TelemetryProps extends TelemetryConfig {
  /** Transport to use */
  transport: TelemetryTransport
  /** Children to render */
  children?: any
  /** Opt-in callback (for user consent) */
  onOptIn?: () => void
  /** Opt-out callback */
  onOptOut?: () => void
}

export interface TelemetryModel {
  config: TelemetryConfig
  transport: TelemetryTransport
  eventCollector: EventCollector | null
  errorCollector: ErrorCollector | null
  performanceCollector: PerformanceCollector | null
  enabled: boolean
  consentGiven: boolean
}

export type TelemetryMsg =
  | { _tag: 'Enable' }
  | { _tag: 'Disable' }
  | { _tag: 'TrackEvent'; event: TelemetryEvent }
  | { _tag: 'TrackError'; error: TelemetryErrorType }
  | { _tag: 'TrackPerformance'; metric: TelemetryPerformance }
  | { _tag: 'StartTiming'; name: string }
  | { _tag: 'EndTiming'; name: string; metadata?: Record<string, any> }

export const Telemetry: Component<TelemetryProps, TelemetryModel, TelemetryMsg> = {
  init: (props) => {
    const enabled = props.enabled ?? false
    const consentGiven = enabled // If explicitly enabled, consent is given

    let eventCollector: EventCollector | null = null
    let errorCollector: ErrorCollector | null = null
    let performanceCollector: PerformanceCollector | null = null

    if (enabled && consentGiven) {
      eventCollector = new EventCollector(props, props.transport)
      errorCollector = new ErrorCollector(props, props.transport)
      performanceCollector = new PerformanceCollector(props, props.transport)
    }

    return {
      config: props,
      transport: props.transport,
      eventCollector,
      errorCollector,
      performanceCollector,
      enabled,
      consentGiven,
    }
  },

  update: (msg, model) => {
    switch (msg._tag) {
      case 'Enable': {
        if (model.enabled) return model

        const eventCollector = new EventCollector(model.config, model.transport)
        const errorCollector = new ErrorCollector(model.config, model.transport)
        const performanceCollector = new PerformanceCollector(model.config, model.transport)

        return {
          ...model,
          enabled: true,
          consentGiven: true,
          eventCollector,
          errorCollector,
          performanceCollector,
        }
      }

      case 'Disable': {
        if (!model.enabled) return model

        // Stop collectors
        model.eventCollector?.stop()
        model.errorCollector?.stop()
        model.performanceCollector?.stop()

        return {
          ...model,
          enabled: false,
          eventCollector: null,
          errorCollector: null,
          performanceCollector: null,
        }
      }

      case 'TrackEvent': {
        if (!model.enabled || !model.eventCollector) return model

        return [
          model,
          Effect.runPromise(model.eventCollector.collectEvent(msg.event))
            .then(() => ({ _tag: 'Noop' as const }))
            .catch(() => ({ _tag: 'Noop' as const })),
        ]
      }

      case 'TrackError': {
        if (!model.enabled || !model.errorCollector) return model

        return [
          model,
          Effect.runPromise(model.errorCollector.collectError(msg.error))
            .then(() => ({ _tag: 'Noop' as const }))
            .catch(() => ({ _tag: 'Noop' as const })),
        ]
      }

      case 'TrackPerformance': {
        if (!model.enabled || !model.performanceCollector) return model

        return [
          model,
          Effect.runPromise(model.performanceCollector.collectPerformance(msg.metric))
            .then(() => ({ _tag: 'Noop' as const }))
            .catch(() => ({ _tag: 'Noop' as const })),
        ]
      }

      case 'StartTiming': {
        if (!model.enabled || !model.performanceCollector) return model
        model.performanceCollector.startTiming(msg.name)
        return model
      }

      case 'EndTiming': {
        if (!model.enabled || !model.performanceCollector) return model

        return [
          model,
          Effect.runPromise(model.performanceCollector.endTiming(msg.name, msg.metadata))
            .then(() => ({ _tag: 'Noop' as const }))
            .catch(() => ({ _tag: 'Noop' as const })),
        ]
      }
    }
  },

  view: (model, dispatch, props) => {
    // Telemetry is invisible - just render children
    return <Box>{props.children}</Box>
  },
}

export default Telemetry
