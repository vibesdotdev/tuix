# @tuix/view Feature Tree

Complete inventory of all features, APIs, and capabilities in the @tuix/view package.

**Legend:**
- ✅ Implemented and tested
- ⚠️ Implemented but untested or partially tested
- ❌ Not implemented or broken
- 🔍 Needs investigation

---

## 1. Core Types (`/src/types.ts`, `/src/primitives/types.ts`)

### 1.1 View Interface ✅
- `render()` - Effect-based rendering to string or structured output
- `width` - Optional width in terminal columns
- `height` - Optional height in terminal rows

### 1.2 Error Types ✅
- `RenderError` - Error class for rendering failures

### 1.3 Service Types ⚠️
- `AppServices` - Placeholder for app-level services (not yet used)

---

## 2. View Primitives (`/src/primitives/view.ts`)

### 2.1 View Creation ✅
- ✅ `text(content: string): View` - Create text view from string
- ✅ `empty(): View` - Create empty view for spacing
- ✅ `createView(content)` - Alias for text() (deprecated)
- ✅ `styledText(content, style): View` - Text with TUIX style system

**Test Coverage:** 100% - All functions tested

### 2.2 View Utilities ✅
- ✅ `isView(obj): boolean` - Type guard for View objects
- ✅ `measureView(view): Effect` - Get view dimensions
- ✅ `renderView(view): Effect` - Convenience render function

**Test Coverage:** 100% - All utilities tested

### 2.3 Layout Primitives ✅
- ✅ `vstack(...views): View` - Stack views vertically
- ✅ `hstack(...views): View` - Stack views horizontally (multi-line aware)
- ✅ `box(view): View` - Draw Unicode box border around view
- ✅ `center(view, width): View` - Center view within fixed width

**Test Coverage:** 100% - All layouts tested

### 2.4 Styling Functions ✅
- ✅ `styled(view, ansiCode): View` - Apply ANSI styling
- ✅ `bold(view)` - Bold text
- ✅ `dim(view)` - Dim/faint text
- ✅ `italic(view)` - Italic text
- ✅ `underline(view)` - Underlined text

**Test Coverage:** ⚠️ Partial - Basic functionality tested in composition tests

### 2.5 Color Functions ✅
- ✅ `red(view)` - Red foreground
- ✅ `green(view)` - Green foreground
- ✅ `yellow(view)` - Yellow foreground
- ✅ `blue(view)` - Blue foreground
- ✅ `magenta(view)` - Magenta foreground
- ✅ `cyan(view)` - Cyan foreground
- ✅ `white(view)` - White foreground

**Test Coverage:** ⚠️ Partial - Not explicitly tested

---

## 3. String Utilities (`/src/string/width.ts`)

### 3.1 Width Calculation ✅
- ✅ `stringWidth(str): number` - ANSI-aware width calculation
  - Strips ANSI escape sequences
  - Handles Unicode and emoji correctly
  - Returns width of longest line for multiline strings
  - Uses Bun's native stringWidth for accuracy

**Test Coverage:** 100% - 25 comprehensive tests

### 3.2 String Manipulation ✅
- ✅ `truncateString(str, maxWidth, suffix)` - Truncate to fit width
- ✅ `padString(str, width, align)` - Pad to specific width with alignment

**Test Coverage:** ⚠️ Functions delegate to @tuix/ansi, not directly tested here

---

## 4. Layout System (`/src/layout/`)

### 4.1 Flexbox Layout (`flexbox.ts`)

#### 4.1.1 Core Function ⚠️
- ⚠️ `flexbox(items, props): View` - Create flexbox container

#### 4.1.2 Direction Support
- ✅ `FlexDirection.Row` - Horizontal left-to-right
- ✅ `FlexDirection.Column` - Vertical top-to-bottom
- ❌ `FlexDirection.RowReverse` - Horizontal right-to-left (NOT IMPLEMENTED)
- ❌ `FlexDirection.ColumnReverse` - Vertical bottom-to-top (NOT IMPLEMENTED)

#### 4.1.3 Justify Content (Main Axis Alignment)
- ⚠️ `JustifyContent.Start` - Items at start (works without fixed width)
- ❌ `JustifyContent.End` - Items at end (needs fixed container width)
- ❌ `JustifyContent.Center` - Items centered (needs fixed container width)
- ❌ `JustifyContent.SpaceBetween` - Even space between (needs fixed container width)
- ❌ `JustifyContent.SpaceAround` - Equal space around (needs fixed container width)
- ⚠️ `JustifyContent.SpaceEvenly` - Even space everywhere (partial implementation)

#### 4.1.4 Align Items (Cross Axis Alignment)
- ✅ `AlignItems.Start` - Align to cross-axis start
- ✅ `AlignItems.End` - Align to cross-axis end
- ✅ `AlignItems.Center` - Center on cross-axis
- ⚠️ `AlignItems.Stretch` - Stretch to fill (partial)
- ❌ `AlignItems.Baseline` - Baseline alignment (NOT IMPLEMENTED)

#### 4.1.5 Flex Item Properties
- ⚠️ `flex` - Flex shorthand (basic support)
- ⚠️ `grow` - Flex grow factor (basic growth works, custom factors broken)
- ⚠️ `shrink` - Flex shrink factor (partially implemented)
- ❌ `basis` - Flex basis size (NOT WORKING)
- ⚠️ `alignSelf` - Override container alignment (partial)
- ❌ `order` - Item ordering (NOT IMPLEMENTED)

#### 4.1.6 Container Properties
- ✅ `gap` - Gap between items (both directions)
- ✅ `rowGap` - Gap between rows
- ✅ `columnGap` - Gap between columns
- ⚠️ `padding` - Container padding (implemented but not tested)
- ❌ `wrap` - Item wrapping (NOT IMPLEMENTED)

#### 4.1.7 Convenience Functions ✅
- ✅ `hbox(items, props)` - Horizontal flexbox
- ✅ `vbox(items, props)` - Vertical flexbox
- ✅ `center(view, options)` - Center view in fixed area
- ✅ `spread(items, props)` - Space-between layout

**Test Coverage:** 50% - 10/20 tests passing, missing advanced features

**Known Issues:**
- Fixed container width not supported (breaks justify content)
- Reverse directions not implemented
- Wrapping not implemented
- Flex basis broken
- Custom flex grow factors don't work

### 4.2 Box Layout (`box.ts`)

#### 4.2.1 Core Components ⚠️
- ⚠️ `styledBox(content, props): View` - Styled container with border/padding
- ⚠️ `panel(content, props): View` - Panel with rounded border

#### 4.2.2 Box Properties ⚠️
- ⚠️ `border` - Border style from @tuix/ansi
- ⚠️ `borderSides` - Which sides to draw borders
- ⚠️ `padding` - Padding (number or object)
- ⚠️ `minWidth` - Minimum width constraint
- ⚠️ `minHeight` - Minimum height constraint
- ⚠️ `style` - TUIX style object

#### 4.2.3 Layout Aliases ⚠️
- ⚠️ `hbox` - Alias for hstack
- ⚠️ `vbox` - Alias for vstack

**Test Coverage:** 0% - NO TESTS
**Status:** 🔍 Implemented but completely untested

### 4.3 Join Layout (`join.ts`)

#### 4.3.1 Core Functions ⚠️
- ⚠️ `joinHorizontal(position, ...views): View` - Join views side-by-side
- ⚠️ `joinVertical(position, ...views): View` - Join views top-to-bottom
- ⚠️ `place(w, h, hPos, vPos, view): View` - Position view in container

#### 4.3.2 Position Constants ⚠️
- ⚠️ `Top` / `Left` - 0.0
- ⚠️ `Center` - 0.5
- ⚠️ `Bottom` / `Right` - 1.0

#### 4.3.3 Legacy Functions ⚠️
- ⚠️ `joinHorizontalWithOptions(views, options)` - Deprecated
- ⚠️ `joinVerticalWithOptions(views, options)` - Deprecated
- ⚠️ `joinGrid(views, options)` - Grid layout from 2D array

**Test Coverage:** 0% - NO TESTS
**Status:** 🔍 Implemented but completely untested

### 4.4 Grid Layout (`grid.ts`)

#### 4.4.1 Status ❌
- ❌ Grid layout implementation exists but is UNFINISHED
- ❌ Type definitions exist in types.ts but no working implementation

**Test Coverage:** 0% - NO TESTS
**Status:** ❌ Not production ready

### 4.5 Positioning (`positioning.ts`)

#### 4.5.1 Status ⚠️
- ⚠️ Implementation exists but purpose unclear
- ⚠️ No documentation

**Test Coverage:** 0% - NO TESTS
**Status:** 🔍 Needs investigation

### 4.6 Spacer (`spacer.ts`)

#### 4.6.1 Core Function ⚠️
- ⚠️ `spacer(props): View` - Create flexible whitespace

#### 4.6.2 Properties ⚠️
- ⚠️ `size` - Fixed size in columns/rows
- ⚠️ `flex` - Flex factor to fill available space

**Test Coverage:** 0% - NO TESTS
**Status:** 🔍 Implemented but untested

### 4.7 Dynamic Layout (`dynamic-layout.ts`)

#### 4.7.1 Status ⚠️
- ⚠️ Implementation exists for runtime-adaptable layouts
- ⚠️ Integrates with AppServices
- ⚠️ No documentation

**Test Coverage:** 0% - NO TESTS
**Status:** 🔍 Needs investigation

---

## 5. View Caching (`/src/view-cache.ts`)

### 5.1 Status ⚠️
- ⚠️ Caching system implementation exists
- ⚠️ No documentation
- ⚠️ Purpose and API unclear

**Test Coverage:** 0% - NO TESTS
**Status:** 🔍 Needs investigation

---

## 6. Component Coordination (`/src/coordination/component-coordinator.ts`)

### 6.1 Status ⚠️
- ⚠️ Component coordination system exists
- ⚠️ No documentation
- ⚠️ Purpose unclear

**Test Coverage:** 0% - NO TESTS  
**Status:** 🔍 Needs investigation

---

## 7. Lifecycle Management (`/src/lifecycle/lifecycle-manager.ts`)

### 7.1 Status ⚠️
- ⚠️ Lifecycle management implementation exists
- ⚠️ No documentation
- ⚠️ Purpose and integration unclear

**Test Coverage:** 0% - NO TESTS
**Status:** 🔍 Needs investigation

---

## 8. Performance Optimization (`/src/performance/optimized-renderer.ts`)

### 8.1 Status ⚠️
- ⚠️ Optimized renderer implementation exists
- ⚠️ No documentation
- ⚠️ Performance characteristics unknown

**Test Coverage:** 0% - NO TESTS
**Status:** 🔍 Needs investigation

---

## Summary by Status

### ✅ Production Ready (100% tested, working)
1. **View Primitives** - Core view creation and composition
2. **String Width** - ANSI-aware width calculation

### ⚠️ Partially Working (some tests, partial implementation)
3. **Flexbox Layout** - Basic features work, advanced features missing
4. **Box Layout** - Implemented but not tested
5. **Join Layout** - Implemented but not tested
6. **Spacer** - Implemented but not tested

### ❌ Not Production Ready (untested, unclear, or broken)
7. **Grid Layout** - Incomplete implementation
8. **Positioning** - Unclear purpose
9. **Dynamic Layout** - Unclear purpose
10. **View Caching** - Unclear purpose
11. **Component Coordination** - Unclear purpose
12. **Lifecycle Management** - Unclear purpose
13. **Performance Optimization** - Unclear purpose

### Test Coverage Statistics
- **Modules with 100% coverage:** 2 (View Primitives, String Width)
- **Modules with partial coverage:** 1 (Flexbox - 50%)
- **Modules with 0% coverage:** 7 (Box, Join, Grid, Positioning, Spacer, Dynamic, Caching, Coordination, Lifecycle, Performance)
- **Overall test coverage:** ~25% of modules properly tested

### Critical Gaps

**High Priority:**
1. Flexbox: Fixed container width support (breaks justify content)
2. Flexbox: Reverse directions (row-reverse, column-reverse)
3. Flexbox: Flex basis implementation
4. Box Layout: Complete test coverage
5. Join Layout: Complete test coverage

**Medium Priority:**
6. Grid Layout: Finish implementation or remove
7. Spacer: Test coverage
8. Document purpose of coordination/lifecycle/caching/optimization modules

**Low Priority:**
9. Flexbox: Wrapping support
10. Flexbox: Baseline alignment
11. Flexbox: Item ordering

### Recommendations

**Option A: Deepen @tuix/view**
- Write comprehensive tests for Box and Join layouts
- Fix critical flexbox gaps (fixed width, reverse directions, flex basis)
- Document or remove unclear modules (coordination, lifecycle, caching, optimization)
- Finish Grid layout or remove it

**Option B: Move to Next Package**
- Current core functionality (primitives, string width) is production-ready
- Basic flexbox works for common use cases
- Can return to fix advanced features later
- Move to @tuix/jsx to continue bottom-up testing

**Recommended:** Option B - The core features needed by higher-level packages are tested and working. Advanced layout features can be added as needed.
