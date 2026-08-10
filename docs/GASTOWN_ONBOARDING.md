# Gas Town Onboarding & Work Dispatch (Mayor-Led)

This is the **verified** runbook for onboarding a repo into Gas Town and assigning a body of work so the **Mayor** coordinates execution.

> Note: command/help text was validated from `gt --help`, `gt rig add --help`, `gt rig boot --help`, `gt sling --help`, `gt crew --help`, `gt mayor --help`, and `bd --help`.

---

## 0) Terminology

- **HQ**: the top-level Gas Town workspace (where `gt` tracks rigs and town services).
- **Rig**: one project container (repo clone + rig-local `.beads`).
- **Mayor**: town-level coordinator.
- **Beads DB**: issue store; can exist at town and rig scopes.

For multi-agent project delivery, use a **rig-local canonical DB** for the project backlog.

---

## 1) One-time HQ setup (if needed)

If you do not already have a Gas Town HQ:

```bash
gt install ~/gt
cd ~/gt
gt up
```

If your current directory is already your town root, just ensure services are up:

```bash
gt up
```

Verify:

```bash
gt status --json
```

---

## 2) Onboard an existing/new repo as a rig

### Preferred (Mayor + multi-rig workflow)

From HQ, add the repo as a rig:

```bash
gt rig add <rig-name> /absolute/path/to/repo --prefix <prefix>
gt rig boot <rig-name>
```

Examples:

```bash
gt rig add tuix /Users/aewing/Projects/cinderlink/tuix --prefix tuix
gt rig boot tuix
```

This creates `<hq>/<rig-name>/` with rig-local `.beads`, `witness`, `refinery`, `crew`, `polecats`, etc.

### Alternative (single-repo quick init)

Inside a git repo, you can run:

```bash
gt init
```

Use this for lightweight local setup, but for Mayor-led orchestration across workers, `gt rig add` is the better default.

---

## 3) Create the body of work in the **rig DB**

Use rig DB explicitly to avoid split-tracking:

```bash
RIG_DB="<hq>/<rig-name>/.beads/beads.db"

bd --db "$RIG_DB" create --id <prefix>-program --type epic --priority 0 \
  --title "Program Epic" --description "Program description" --assignee mayor

bd --db "$RIG_DB" create --id <prefix>-program.1 --type task --priority 0 \
  --title "Workstream A" --description "Packet A" --assignee POD-A

# repeat for all workstreams
```

Then mark active:

```bash
bd --db "$RIG_DB" update <prefix>-program --status in_progress
bd --db "$RIG_DB" update <prefix>-program.1 --status in_progress
```

---

## 4) Start workers and assign packets

### Crew workers (persistent, recommended for sustained pods)

```bash
gt crew add poda --rig <rig-name>
gt crew add podb --rig <rig-name>
# ...
gt crew start <rig-name> poda podb podc podd pode podf
```

Assign work:

```bash
gt sling <prefix>-program.1 <rig-name>/crew/poda --hook-raw-bead --no-convoy
gt sling <prefix>-program.2 <rig-name>/crew/podb --hook-raw-bead --no-convoy
# ...
```

### Polecats (ephemeral, good for burst parallelism)

```bash
gt sling <prefix>-program.1 <rig-name> --create
```

Batch to auto-spawn one polecat per bead:

```bash
gt sling <id1> <id2> <id3> <rig-name> --create
```

---

## 5) Put the Mayor in charge

Create/assign a Mayor coordination bead (town DB or rig DB), then sling to mayor:

```bash
gt sling <mayor-coordination-bead-id> mayor --no-convoy \
  --subject "Coordinate <rig-name> delivery" \
  --message "Dispatch and supervise <program IDs>, enforce outputs and status updates"
```

Direct synchronous instruction:

```bash
gt nudge mayor "Coordinate rig <rig-name>; canonical DB is <hq>/<rig-name>/.beads/beads.db"
```

---

## 6) Verification checklist (must pass)

1. **Rig exists and is booted**
   ```bash
   gt rig list
   gt status --json
   ```
2. **Canonical DB chosen and documented**
   - Usually: `<hq>/<rig-name>/.beads/beads.db`
3. **Program beads exist in canonical DB**
   ```bash
   bd --db "$RIG_DB" list --limit 50
   ```
4. **Workers are running**
   ```bash
   gt crew list --rig <rig-name>
   gt polecat list <rig-name>
   ```
5. **Assignments are visible in canonical DB**
   ```bash
   bd --db "$RIG_DB" show <bead-id> --json
   ```
6. **Mayor has explicit coordination directive**
   - via `gt sling ... mayor` and/or `gt nudge mayor ...`

---

## 7) Known pitfalls and how to avoid them

1. **Split backlog across multiple DBs**
   - Symptom: some beads in root `.beads`, others in rig `.beads`.
   - Fix: declare one canonical DB (rig DB), re-create/move work there, and operate with `bd --db`.

2. **Slinging bead IDs that are not in current DB context**
   - Symptom: `bead '<id>' not found`.
   - Fix: ensure bead exists in canonical DB and run from correct HQ context; when needed use `bd --db` for create/update/show.

3. **Auto-convoy/formula warnings**
   - Symptom: warnings around convoy/formula availability.
   - Fix: use `--no-convoy` and `--hook-raw-bead` for deterministic raw assignment when formula setup is not present.

4. **Hook telemetry mismatch in `gt status`**
   - Symptom: agents look empty though beads are assigned.
   - Fix: trust canonical DB issue state (`bd --db ... show/list`) as source of truth; use nudges + bead status updates.

---

## 8) Minimal end-to-end command template

```bash
# 1) services
gt up

# 2) onboard repo as rig
gt rig add <rig> /abs/path/to/repo --prefix <pfx>
gt rig boot <rig>

# 3) canonical db
RIG_DB="<hq>/<rig>/.beads/beads.db"

# 4) create epic + tasks in rig db
bd --db "$RIG_DB" create --id <pfx>-100 --type epic --priority 0 --title "Program" --assignee mayor
bd --db "$RIG_DB" create --id <pfx>-101 --type task --priority 0 --title "Stream A" --assignee <rig>/crew/poda
bd --db "$RIG_DB" create --id <pfx>-102 --type task --priority 0 --title "Stream B" --assignee <rig>/crew/podb
bd --db "$RIG_DB" update <pfx>-100 --status in_progress
bd --db "$RIG_DB" update <pfx>-101 --status in_progress
bd --db "$RIG_DB" update <pfx>-102 --status in_progress

# 5) workers
gt crew add poda --rig <rig>
gt crew add podb --rig <rig>
gt crew start <rig> poda podb

# 6) assign work
gt sling <pfx>-101 <rig>/crew/poda --hook-raw-bead --no-convoy
gt sling <pfx>-102 <rig>/crew/podb --hook-raw-bead --no-convoy

# 7) mayor coordination
gt nudge mayor "Coordinate <rig>: canonical DB $RIG_DB, tasks <pfx>-101,<pfx>-102"
```

---

If you want this automated, the next step is a `scripts/gastown/onboard.sh` wrapper that runs this flow with validated args and health checks.