# Build Analysis & Monorepo Migration Status

**Date:** 2025-10-03
**Build Command:** `bun run build`
**Exit Code:** 1 (Failed)
**Total Packages:** 15
**Successful:** 4 packages (`@tuix/ansi`, `@tuix/styling`, `@tuix/types`, `@tuix/parser`)
**Failed:** 11 packages

---

## Critical Issues by Package

### 1. **@tuix/jsx** - Missing Entry Point
- **Error:** `ModuleNotFound resolving "src/index.ts"`
- **Root Cause:** Package.json points to `src/index.ts` but file doesn't exist
- **Current State:** Has `jsx-runtime.ts` (55KB), `dev.ts`, `events.ts`
- **Fix Required:** Create index.ts or update package.json entry point

### 2. **@tuix/terminal** - Missing Core Files
- **Error:** Cannot resolve `./constants`, `./errors`, `./types`
- **Root Cause:** index.ts exports these but files don't exist in package
- **Current State:** Only has `ansi/` subdirectory and README
- **Issue:** ANSI code is duplicated across 3 locations:
  - `packages/terminal/src/ansi/` (17 TS files)
  - `packages/core/src/terminal/ansi/` (21 TS files)
  - `packages/ansi/` (43 TS files - canonical location)

### 3. **@tuix/ui** - React/JSX Dependencies
- **Error:** Cannot resolve `react/jsx-dev-runtime` (multiple files)
- **Root Cause:** Package expects React but has no React dependency
- **Files Affected:** ~15+ component files (Button, Box, Flex, Table, Text, etc.)
- **Additional Issues:**
  - Missing `@tuix/core/update/reactivity/runes` imports
  - Missing `@tuix/core/terminal/output/string/width` imports
  - Circular relative imports (`../../../../core/...`)

### 4. **@tuix/debug** - Missing Dependencies
- **Error:** Cannot resolve `@tuix/core/view`
- **Root Cause:** Tries to import from core modules that may not be properly exported

### 5. **@tuix/core** - Massive Internal Issues
- **Errors:** 50+ resolution failures
- **Categories:**
  - Missing service implementations
  - Broken internal module structure
  - Import path mismatches
  - Terminal/ANSI dependencies not resolved
- **Key Problems:**
  - Imports from `@tuix/core/terminal/output/string/width` fail
  - Service layer broken (`./services/input`, `./services/renderer`)
  - Runtime bootstrap issues

### 6. **@tuix/testing** - Dependency Hell
- **Error:** Missing `node-pty` + 10+ relative import failures
- **Root Cause:** References old monolith structure (`../core/`, `../services/`)
- **Broken Imports:**
  - `../services/input`
  - `../core/keys`
  - `../core/runtime`
  - `../core/services/impl/terminal`
  - `../core/services/impl/renderer`

### 7. **@tuix/runtime**, **@tuix/process-manager**, **@tuix/logger**, **@tuix/config** - Cross-Package Issues
- All suffer from broken `@tuix/core` imports
- Relative path imports from old structure
- Missing transitive dependencies

---

## Structural Problems

### A. **ANSI Code Triplication**
```
packages/
├── ansi/                          ← CANONICAL (43 files) ✅
├── terminal/src/ansi/             ← DUPLICATE (17 files) ❌
└── core/src/terminal/ansi/        ← DUPLICATE (21 files) ❌
```

**Differences:**
- `core/terminal/ansi/` has: border, color, effects, types.ts
- `terminal/src/ansi/` has: codes/, different render/text structure
- `@tuix/ansi` has: most complete implementation

**Impact:** 7 files import from old locations:
- 7 files: `@tuix/core/terminal/...`
- 32 files: Relative imports to `../core/...`

### B. **@tuix/core Exports ANSI from @tuix/ansi**
Lines 222-296 in `packages/core/src/index.ts` re-export from `@tuix/ansi/*`:
```typescript
export { color, colors, Colors, ... } from '@tuix/ansi/color'
export { Style, style, styles, ... } from '@tuix/ansi/style'
export { border, borderPresets, ... } from '@tuix/ansi/border'
export { stripAnsi, hasAnsi, ... } from '@tuix/ansi/core'
export { ansi } from '@tuix/ansi'
// ... etc
```

**Issue:** Core still has `src/terminal/ansi/` directory with 21 files that conflict with these exports.

### C. **JSX/React Confusion**
- `@tuix/jsx` appears to be custom JSX runtime (55KB jsx-runtime.ts)
- `@tuix/ui` imports `react/jsx-dev-runtime` (doesn't exist)
- No `react` dependency anywhere
- Suggests incomplete migration from React to custom JSX

### D. **Service Layer Broken**
Multiple packages expect:
- `../services/input`
- `../services/renderer`
- `../core/services/impl/terminal`
- `../core/services/impl/renderer`

None exist in new structure.

---

## Quantified Migration Work

### **Immediate Blockers (Must Fix to Build)**

| Issue | Affected Packages | Files | Effort |
|-------|------------------|-------|--------|
| Missing terminal constants/errors/types | @tuix/terminal | 3 files | 2h |
| Missing jsx index.ts | @tuix/jsx | 1 file | 30m |
| Remove duplicate ANSI from terminal | @tuix/terminal | 17 files | 3h |
| Remove duplicate ANSI from core | @tuix/core | 21 files | 4h |
| Fix React/JSX imports in UI | @tuix/ui | 15+ files | 6h |
| Refactor testing relative imports | @tuix/testing | 5 files | 4h |
| Fix core internal imports | @tuix/core | 30+ files | 8h |
| Add missing dependencies | Multiple | package.json | 2h |

**Total Immediate Work: ~29-30 hours**

### **Medium Priority (Prevents Full Migration)**

| Issue | Scope | Effort |
|-------|-------|--------|
| Update all `@tuix/core/terminal` imports to `@tuix/ansi` | 7 files | 2h |
| Update relative `../core/` imports | 32 files | 6h |
| Reorganize service layer | @tuix/core | 8h |
| Fix cross-package dependency chains | 5 packages | 6h |
| Add missing node-pty to testing | @tuix/testing | 1h |

**Total Medium Priority: ~23 hours**

### **Cleanup & Polish**

| Issue | Effort |
|-------|--------|
| Remove unused imports | 3h |
| Update package.json exports | 4h |
| Consolidate type definitions | 6h |
| Documentation updates | 4h |
| Integration testing | 8h |

**Total Cleanup: ~25 hours**

---

## **TOTAL ESTIMATED WORK: 77-80 hours**

---

## Recommended Action Plan

### **Phase 1: Critical Path (1-2 days)**
1. Fix `@tuix/terminal` - add missing files OR remove package if obsolete
2. Fix `@tuix/jsx` - create index.ts
3. Delete `packages/terminal/src/ansi/` entirely (move to @tuix/ansi if needed)
4. Delete `packages/core/src/terminal/ansi/` entirely (already re-exported)

### **Phase 2: Core Stabilization (2-3 days)**
1. Fix all `@tuix/core` internal imports
2. Resolve service layer architecture
3. Update `@tuix/testing` to use new package structure
4. Add missing dependencies

### **Phase 3: UI Layer (2-3 days)**
1. Remove React dependencies from `@tuix/ui`
2. Wire up custom JSX runtime from `@tuix/jsx`
3. Fix all component imports

### **Phase 4: Integration (1-2 days)**
1. Update cross-package imports
2. Fix remaining import paths
3. Run full build + tests
4. Document new structure

---

## Key Questions to Answer

1. **Is @tuix/terminal needed?** It's nearly empty and ANSI moved to @tuix/ansi
2. **What's the JSX strategy?** Custom runtime vs React?
3. **Service layer design?** Should services be in @tuix/core or separate package?
4. **Testing strategy?** node-pty dependency and old structure references
