# Package Boundaries

| Package | Owns | Does not own |
|---------|------|--------------|
| core | Tags, types, pure capabilities/graphics/CPR/DA, **physical Live service impls** under `services/live` | App widgets, JSX |
| platform | **Public re-export facade** for LiveServices + caps + graphics (no duplicate Live I/O) | Owning physical terminal backends; business MVU apps |
| runtime | MVU loop, hooks, fibers, bootstrap | JSX primitives |
| reactive | $state/$derived/$effect/$bindable | UI primitives |
| jsx | jsx factory, compiler, limited intrinsics, scopes | High-level forms (prefer ui) |
| ui | Widgets (Button, Modal, …) | Terminal protocols |
| process-manager | Spawn + **PTY** path | Graphics encode |
| testing | Harness, fakes | Production I/O defaults |
