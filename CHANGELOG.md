## 0.0.6

## 0.0.5

### Change

- Updated dependencies:
    - `@playform/pipe` updated to version 0.1.2
    - `commander` updated to version 13.1.0
    - `deepmerge-ts` updated to version 7.1.4
    - `typescript` updated to version 5.7.3
- Added new dependencies:
    - `@ianvs/prettier-plugin-sort-imports`
    - `@playform/build` updated to version 0.2.1
    - `@tailwindcss/aspect-ratio`
    - `@tailwindcss/forms`
    - `@tailwindcss/typography`
    - `@types/chai`
    - `@types/jest`
    - `@types/mocha`
    - `chai`
    - `fast-glob`
    - `mocha`
    - `prettier`
    - `prettier-plugin-astro`
    - `prettier-plugin-organize-attributes`
    - `prettier-plugin-packagejson`
    - `prettier-plugin-sh`
    - `prettier-plugin-tailwindcss`
    - `prettier-plugin-toml`
    - `tailwindcss`
- Updated build scripts:
    - Using `Source/Variable/ESBuild.ts` for ESBuild configuration.
- Updated description to "Eliminate ↘️".
- Updated author information:
    - Name changed to "Source 🖋️ Open 👐🏻".
    - Email changed to "Source/Open@PlayForm.LTD".
    - URL changed to "HTTPS://PlayForm.LTD".
- Added `.npmignore` file to exclude unnecessary files from the published
  package.
- Added `prettier.config.d.mts` and `prettier.config.mjs` for Prettier
  configuration.
- Added `tailwind.config.js` for Tailwind CSS configuration.
- Updated `tsconfig.json` with additional options:
    - Added `rootDir` option.
    - Added `types` option.
    - Added `lib` option.
    - Added `exclude` option.
- Refactored code and file structure:
    - Moved ESBuild configuration to `Source/Variable/ESBuild.ts`.
    - Created `Source/Class/Output.ts` for code elimination logic.
    - Updated `Source/Function/Output.ts` to use the new `Output` class.
    - Removed unused files and types related to code elimination.
- Added tests for code elimination functionality.

### Bug Fixes

- Fixed an issue where the output was not correctly formatted.
- Fixed an issue where comments were not preserved in the output.
- Fixed an issue where async expressions were not inlined correctly.

## 0.0.4

### Change

- Improved code formatting and structure in Configuration.js
- Changed const enums to regular enums for better compatibility
- Renamed visitedNodes to Output for consistency
- Simplified conditional logic in identifier checks
- Updated dependency versions:
    - Added commander v12.1.0
    - Updated esbuild to v0.24.0
    - Removed @types/chai and chai dependencies

### Code Quality

- Enhanced code readability with better formatting and indentation
- Improved error handling structure in try-catch blocks
- Streamlined import statements and function calls
- Simplified conditional checks in node traversal logic

### Dependency

- Added command-line interface support with commander
- Upgraded build system with latest esbuild version
- Streamlined test dependencies

## 0.0.3

### Change

- Enhanced transformer with comprehensive validation, error handling, and
  performance optimizations
- Improved printer configuration with explicit newline handling and comment
  preservation
- Updated ESBuild configuration to use explicit node path for Eliminate
  execution
- Added sophisticated caching mechanism with size limits
- Implemented circular reference detection system
- Enhanced variable declaration handling with better export checks
- Added comprehensive error and warning tracking system

### Add

- Introduced TransformerState interface for better state management
- Added ValidationResult interface for node validation
- Implemented ErrorCode and WarningCode enums for better error handling
- Added CircularReferenceDetector class
- Implemented TransformerCache class with LRU capabilities
- Added sophisticated dependency tracking system
- Introduced batch processing with configurable sizes
- Added comprehensive logging for errors and warnings

### Technical

- Improved type safety with strict TypeScript interfaces
- Added protection against infinite loops and recursion
- Enhanced memory management with cache size limits
- Added sophisticated node transformation pipeline
- Implemented better handling of property assignments and array literals

## 0.0.2

### Change

- Updated path mapping from "./Source/Example/Input" to "./Example/Input" in
  Configuration files
- Simplified project structure by removing Example directory exclusions
- Enhanced code organization with streamlined import statements
- Renamed internal variables for better code clarity (e.g., child to NodeChild,
  parentNode to NodeParent)
- Updated documentation and configuration file references in README.md

### Add

- Implemented depth tracking and limits with MAX_RECURSIVE_DEPTH (100 levels)
- Added node visit tracking with MAX_NODE_VISITS (100 visits)
- Introduced iteration limits with MAX_ITERATIONS (100 iterations)
- Added safety checks for map sizes with MAX_USAGE_COUNT and
  MAX_INITIALIZER_SIZE (1000 entries)
- Implemented circular reference detection using unique node IDs
- Added self-referential initializer detection and handling
- Enhanced logging with detailed warning and info messages

### Security

- Added protection against infinite loops and recursive calls
- Implemented safeguards against memory exhaustion with map size limits
- Added detection and handling of circular dependencies

## 0.0.1

### Add

- Initial release
