# @tuix/app-presets

Higher-layer module presets for Tuix applications.

Use this package to supply app/plugin modules into `@tuix/runtime` bootstrap without creating runtime-layer dependency inversion.

## Example

```ts
import { bootstrap } from '@tuix/runtime'
import { presets } from '@tuix/app-presets'

await Effect.runPromise(
  bootstrap({
    additionalModules: presets.standard({
      config: true,
      logger: true,
      processManager: true,
    }),
  })
)
```
