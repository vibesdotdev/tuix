import { Plugin, Command } from "@tuix/jsx";

export default function Foo({ scope = 'foo' }) {
  return (
    <Plugin {scope}>
      <vstack>
        <box>
          <Command name="bar">
            <text>This renders if the user runs "{scope} bar", i.e. "foo bar"</text>
          </Command>
        </box>
        <box>
          <readline
            prompt="foo>"
            onInput={(input) => console.log(input)}
          />
        </box>
      </vstack>
    </Plugin>
_ )
}
