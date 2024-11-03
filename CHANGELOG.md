# Changelog

## 0.0.4

### Changed

-   Improved code formatting and structure in Configuration.js
-   Changed const enums to regular enums for better compatibility
-   Renamed visitedNodes to Output for consistency
-   Simplified conditional logic in identifier checks
-   Updated dependency versions:
    -   Added commander v12.1.0
    -   Updated esbuild to v0.24.0
    -   Removed @types/chai and chai dependencies

### Code Quality

-   Enhanced code readability with better formatting and indentation
-   Improved error handling structure in try-catch blocks
-   Streamlined import statements and function calls
-   Simplified conditional checks in node traversal logic

### Dependencies

-   Added command-line interface support with commander
-   Upgraded build system with latest esbuild version
-   Streamlined test dependencies

## 0.0.3

### Changed

-   Enhanced transformer with comprehensive validation, error handling, and
    performance optimizations
-   Improved printer configuration with explicit newline handling and comment
    preservation
-   Updated ESBuild configuration to use explicit node path for Eliminate
    execution
-   Added sophisticated caching mechanism with size limits
-   Implemented circular reference detection system
-   Enhanced variable declaration handling with better export checks
-   Added comprehensive error and warning tracking system

### Added

-   Introduced TransformerState interface for better state management
-   Added ValidationResult interface for node validation
-   Implemented ErrorCode and WarningCode enums for better error handling
-   Added CircularReferenceDetector class
-   Implemented TransformerCache class with LRU capabilities
-   Added sophisticated dependency tracking system
-   Introduced batch processing with configurable sizes
-   Added comprehensive logging for errors and warnings

### Technical

-   Improved type safety with strict TypeScript interfaces
-   Added protection against infinite loops and recursion
-   Enhanced memory management with cache size limits
-   Added sophisticated node transformation pipeline
-   Implemented better handling of property assignments and array literals

## 0.0.2

### Changed

-   Updated path mapping from "./Source/Example/Input" to "./Example/Input" in
    Configuration files
-   Simplified project structure by removing Example directory exclusions
-   Enhanced code organization with streamlined import statements
-   Renamed internal variables for better code clarity (e.g., child to
    NodeChild, parentNode to NodeParent)
-   Updated documentation and configuration file references in README.md

### Added

-   Implemented depth tracking and limits with MAX_RECURSIVE_DEPTH (100 levels)
-   Added node visit tracking with MAX_NODE_VISITS (100 visits)
-   Introduced iteration limits with MAX_ITERATIONS (100 iterations)
-   Added safety checks for map sizes with MAX_USAGE_COUNT and
    MAX_INITIALIZER_SIZE (1000 entries)
-   Implemented circular reference detection using unique node IDs
-   Added self-referential initializer detection and handling
-   Enhanced logging with detailed warning and info messages

### Security

-   Added protection against infinite loops and recursive calls
-   Implemented safeguards against memory exhaustion with map size limits
-   Added detection and handling of circular dependencies

## 0.0.1

### Added

-   Initial release
