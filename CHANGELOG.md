## 0.0.2

### Changed

-   Updated path mapping from "./Source/Example/Input" to "./Example/Input" in
    Configuration files
-   Simplified project structure by removing Example directory exclusions
-   Enhanced code organization with streamlined import statements
-   Renamed internal variables for better code clarity (e.g., `child` to
    `NodeChild`, `parentNode` to `NodeParent`)
-   Updated documentation and configuration file references in README.md

### Added

-   Implemented depth tracking and limits with `MAX_RECURSIVE_DEPTH` (100
    levels)
-   Added node visit tracking with `MAX_NODE_VISITS` (100 visits)
-   Introduced iteration limits with `MAX_ITERATIONS` (100 iterations)
-   Added safety checks for map sizes with `MAX_USAGE_COUNT` and
    `MAX_INITIALIZER_SIZE` (1000 entries)
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
