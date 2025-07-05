## v0.0.7

### Change

- **Core**:
    - Updated dependencies in [package.json](./package.json) (including
      `deepmerge-ts`, `typescript`, `@types/chai`, `chai`, `prettier`,
      `prettier-plugin-*`, and `tailwindcss`).
    - Refactored [Source/Class/Output.ts](./Source/Class/Output.ts) for improved
      code inlining:
        - Refactored imports from `typescript` to individual imports and type
          imports.
        - Added `Modified` property to `UsageType`.
        - Implemented recursion depth limits in `_FunctionInline`,
          `_VariableInline`, and `_CallExpressionInline`.
        - Removed `Usage` parameter from `_BinaryExpressionInline`,
          `_CallExpressionInline`, `_ExpressionInline`, and `Iterative` methods.
        - Added try/catch block in `Iterative` to catch errors.
        - Added debug logging in `Iterative`.
        - Improved cycle detection in `Collect`.
        - Added `Call` method to collect function calls.
        - Added `Modification` method to determine if a node is modified.
        - Added `isPostfixUnaryExpression` and `isPrefixUnaryExpression`
          methods.
        - Added `Operator` method to check operator kind.
- **Configuration**:
    - In [Source/Class/Eliminate.ts](./Source/Class/Eliminate.ts), changed
      `.argument` to `.option` for the `Eliminate` configuration.
    - Renamed `Eliminate` parameter to `Option` in
      [Source/Function/Eliminate.ts](./Source/Function/Eliminate.ts).
    - Updated configuration assignment to use `Option?.Eliminate` and updated
      file import to use `Option.Eliminate` in
      [Source/Function/Eliminate.ts](./Source/Function/Eliminate.ts).
    - Updated the `Eliminate` interface in
      [Source/Interface/Eliminate.ts](./Source/Interface/Eliminate.ts) to accept
      an optional object with an `Eliminate` property.
- **Dependencies**: Updated imports to use `node:` protocol for built-in modules
  in:
    - [Source/Function/File.ts](./Source/Function/File.ts)
    - [Source/Variable/ESBuild.js](./Source/Variable/ESBuild.js)
    - [Source/Variable/ESBuild.ts](./Source/Variable/ESBuild.ts)
- **UI**: Updated descriptions in
  [Source/Interface/Output/Option.ts](./Source/Interface/Output/Option.ts) to
  "Preserve" instead of "Allow inlining".
- **Other**: _ Converted [tailwind.config.js](./tailwind.config.js) to ES Module
  syntax (`export default`). _ Updated name in [package.json](./package.json)
  from `"Source 🖋️ Open 👐🏻"` to `"Source ✍🏻 Open 👐🏻"`.

### Removed

- **Core**: Removed [Source/Class/Missing.ts](./Source/Class/Missing.ts).

## v0.0.6

### Add

- **Build**: Added [`.npmignore`](file:///.npmignore) to exclude
  `tailwind.config.js` from published package.
- **Core**: Added [Source/Class/Missing.ts](./Source/Class/Missing.ts).

### Change

- **Dependencies**: Updated dependencies in [package.json](./package.json)
  (including `esbuild`, `prettier`, and `tailwindcss`).
- **Core**:
    - Substantial refactoring of
      [Source/Class/Output.ts](./Source/Class/Output.ts), including converting
      to a default export class, refactoring `Usage` to a `Map`, adding a Change
      property, and implementing `Transform`, `Collect`, `Size`, `Comment`, and
      `Visit` methods for AST manipulation and analysis.
    - Significant changes to
      [Source/Function/Output.ts](./Source/Function/Output.ts), including
      transforming the source using TypeScript's transformation API.
- **UI**: Modified descriptions for `async` and `function` inlining options in
  [Source/Interface/Output/Option.ts](./Source/Interface/Output/Option.ts).
- **Dependencies**: Updated imports to use `node:` prefix for built-in modules
  in [Source/Variable/ESBuild.js](./Source/Variable/ESBuild.js) and
  [Source/Variable/ESBuild.ts](./Source/Variable/ESBuild.ts).

## v0.0.5

### Add

- **Dependencies**: Added numerous development and core dependencies (including
  `@ianvs/prettier-plugin-sort-imports`, `@playform/build`, `@tailwindcss/*`,
  `@types/*`, `chai`, `fast-glob`, `mocha`, `prettier`, `prettier-plugin-*`, and
  `tailwindcss`).
- **Configuration**: Added Prettier and Tailwind CSS configuration files.

### Change

- **Build**:
    - Migrated ESBuild configuration to
      [Source/Variable/ESBuild.ts](./Source/Variable/ESBuild.ts).
    - Updated build scripts.
- **Core**:
    - Refactored code and file structure (moved code elimination logic to
      [Source/Class/Output.ts](./Source/Class/Output.ts) and updated
      [Source/Function/Output.ts](./Source/Function/Output.ts) to use the new
      `Output` class).
    - Removed unused files and types related to code elimination.
- **Metadata**:
    - Updated description to "Eliminate ↘️".
    - Updated author information in [package.json](./package.json).
- **Other**:
    - Added [`.npmignore`](file:///.npmignore) to exclude unnecessary files from
      the published package.
    - Added tests for code elimination functionality.
- **Typescript**: Updated [tsconfig.json](./tsconfig.json) with additional
  options (added `rootDir`, `types`, `lib`, and `exclude` options).

### Fix

- **Core**:
    - Add try/catch block around the `Output` class instantiation in
      [Source/Function/Output.ts](./Source/Function/Output.ts).
    - Fixed an issue where the output was not correctly formatted.
    - Fixed an issue where comments were not preserved in the output.
    - Fixed an issue where async expressions were not inlined correctly.

## v0.0.4

### Change

- **Configuration**: Changed const enums to regular enums for better
  compatibility.
- **Code Style**: Improved code formatting and structure in Configuration.js and
  enhanced code readability.
- **Core**:
    - Renamed visitedNodes to Output for consistency.
    - Simplified conditional logic in identifier checks.
- **Dependencies**:
    - Added commander v12.1.0.
    - Updated esbuild to v0.24.0.
    - Removed `@types/chai` and `chai` dependencies.

### Code Quality

- Improved error handling structure in try-catch blocks.
- Streamlined import statements and function calls.
- Simplified conditional checks in node traversal logic.

### Dependency

- Added command-line interface support with commander.
- Upgraded build system with latest esbuild version.
- Streamlined test dependencies.

## v0.0.3

### Change

- **Core**:
    - Enhanced transformer with comprehensive validation, error handling, and
      performance optimizations.
    - Improved printer configuration with explicit newline handling and comment
      preservation.
    - Updated ESBuild configuration to use explicit node path for Eliminate
      execution.
    - Added sophisticated caching mechanism with size limits.
    - Implemented circular reference detection system.
    - Enhanced variable declaration handling with better export checks.
    - Added comprehensive error and warning tracking system.

### Add

- **Core**:
    - Introduced TransformerState interface for better state management.
    - Added ValidationResult interface for node validation.
    - Implemented ErrorCode and WarningCode enums for better error handling.
    - Added CircularReferenceDetector class.
    - Implemented TransformerCache class with LRU capabilities.
    - Added sophisticated dependency tracking system.
    - Introduced batch processing with configurable sizes.
    - Added comprehensive logging for errors and warnings.

### Technical

- Improved type safety with strict TypeScript interfaces.
- Added protection against infinite loops and recursion.
- Enhanced memory management with cache size limits.
- Added sophisticated node transformation pipeline.
- Implemented better handling of property assignments and array literals.

## v0.0.2

### Change

- **Configuration**: Updated path mapping from "./Source/Example/Input" to
  "./Example/Input" in Configuration files.
- **Project Structure**: Simplified project structure by removing Example
  directory exclusions.
- **Code Style**: Enhanced code organization with streamlined import statements
  and Renamed internal variables for better code clarity.
- **Documentation**: Updated documentation and configuration file references in
  README.md.

### Add

- **Limits**: Implemented depth tracking and limits with MAX_RECURSIVE_DEPTH
  (100 levels) and iteration limits with MAX_ITERATIONS (100 iterations).
- **Safety Checks**: Added node visit tracking with MAX_NODE_VISITS (100 visits)
  and safety checks for map sizes with MAX_USAGE_COUNT and MAX_INITIALIZER_SIZE
  (1000 entries).
- **Circular Dependency**: Implemented circular reference detection using unique
  node IDs and Added self-referential initializer detection and handling.
- **Logging**: Enhanced logging with detailed warning and info messages.

### Security

- Added protection against infinite loops and recursive calls.
- Implemented safeguards against memory exhaustion with map size limits.
- Added detection and handling of circular dependencies.

## v0.0.1

### Add

- Initial release.
