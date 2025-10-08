import { Command } from '@tuix/jsx';
import { FooPlugin } from './plugins/foo';
import HelloCommand from './commands/hello';

export default function App() {
  return (
    <hstack>
      <box>
        <text>Sidebar</text>
      </box>
      <box>
        <FooPlugin />
        <Command name="hello" component={HelloCommand} />
      </box>
    </hstack>
  );
}
