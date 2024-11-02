## 0.0.2

### Changed

-   Updated path mapping from "./Source/Example/Input" to "./Example/Input" in
    Configuration files
-   Improved recursive depth handling in transformer visits with max depth
    limits
-   Added safety checks for maximum node visits and iteration counts
-   Enhanced handling of circular references and self-referential initializers
-   Implemented size limits for Usage and Initializer maps
-   Simplified project structure with updated .npmignore and tsconfig.json

### Added

-   Added debug warnings for maximum depth, node visits, and iteration limits
-   Implemented node tracking to prevent infinite loops
-   Added safety checks for map sizes and usage counts

## 0.0.1

### Added

-   Initial release
