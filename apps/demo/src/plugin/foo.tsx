import { Plugin, Command } from '@tuix/jsx'

export default function Foo({ scope = 'foo' }) {
  return (
    <Plugin name={scope}>
      <vstack>
        <box>
          <Command name="bar">
            <text>This renders if the user runs "{scope} bar", i.e. "foo bar"</text>
          </Command>
        </box>
        <box>
          <text>TODO: readline component</text>
        </box>
      </vstack>
    </Plugin>
  )
}
