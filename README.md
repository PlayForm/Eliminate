# [Eliminate] ↘️

`Eliminate` is a powerful `TypeScript` utility designed to streamline your
codebase by identifying and removing variable and function declarations that are
used only once and not exported. It replaces their usage with their initializers
or inlines function bodies, improving code readability and potentially enhancing
performance. This tool is ideal for developers looking to eliminate redundancy
while preserving the integrity of exported APIs and respecting custom
configurations.

### Example

Here’s a simple illustration of how Eliminate transforms your code:

<table>
	<tr>
		<th>Before</th>
    	<th>After</th>
    </tr>
    <tr>
    	<td>
    		<pre lang="typescript">
let a = 5;

let b = 10;

let c = a + b;

console.log(c);

</pre>
		</td>
		<td>
			<pre lang="typescript">
console.log(5 + 10);

</pre>
		</td>
	</tr>
</table>

## Feature 📦

- **`TypeScript` Integration with Type-Checking:**
    - Utilizes `TypeScript`’s compiler API and type checker for safe, reliable
      transformations.
- **Usage Analysis:**
    - Counts references to variables and functions to determine eligibility for
      removal.
- **Export Preservation:**
    - Detects and retains exported symbols to maintain your module’s public
      interface.
- **Code Optimization:**
    - Eliminates variable and function declarations used only once and not
      exported.
    - Substitutes their references with initializers or inlined function bodies
      where applicable.

- **Advanced Scenario Support:**
    - Handles complex cases like destructuring, default parameters, nested
      scopes, type annotations, and mutual recursion.
    - Prevents infinite inlining loops in recursive scenarios.

- **Customizable Configuration:**
    - `Comment`: Preserve symbols with comments (**default:** `true`).
    - `Max`: Maximum expression size (in AST nodes) for inlining (**default:**
      `100`).
    - `Async`: Preserve async/await constructs (**default:** `false`).
    - `Const`: Preserve const variables (**default:** `false`).
    - `Function`: Preserve all function declarations (**default:** `false`).
    - `Debug`: Enable verbose logging for debugging (**default:** `false`).

- **Recursion Handling:**
    - Safely manages direct and mutual recursion with configurable depth limits
      to avoid stack overflows.

## Installation 🚀

Add `Eliminate` to your project as a development dependency:

```sh
npm install -D -E @playform/eliminate
```

## Usage 🛠️

### Command Line

Execute `Eliminate` via the command line with a configuration file:

```sh
npx @playform/eliminate Configuration.ts
```

Check out an example configuration file:
[`Configuration.ts`](./Configuration.ts)

### CLI Options

```
Usage: Eliminate Eliminate

Arguments:
  Eliminate                 Eliminate configuration file 📜

Options:
  -V, --version             Output the version number
  -h, --help                Display help information
```

### NPM Scripts

Add `Eliminate` to your `package.json` scripts:

```json
{
	"scripts": {
		"Eliminate": "Eliminate Configuration.ts"
	}
}
```

### How It Works

`Eliminate` leverages the `TypeScript` compiler `API` to analyze and transform
your code through these steps:

1.  **Analysis Phase:**
    - Builds an Abstract Syntax Tree (`AST`) of your code.
    - Identifies variable and function declarations.
    - Tracks reference counts and export status.
    - Detects recursion via call graph analysis.

2.  **Transformation Phase:**
    - Iteratively removes eligible declarations (used once, not exported) and
      inlines their values or bodies.
    - Manages edge cases like destructuring, nested scopes, and recursive
      functions.
    - Respects size limits and configuration settings to ensure safe
      transformations.

3.  **Output Phase:**
    - Produces optimized code with redundant declarations eliminated and their
      usage simplified.

### Configuration

Customize `Eliminate’s` behavior with these options:

- `Comment`: If `true`, keeps declarations with comments intact (**default:**
  `true`).
- `Max`: Limits the size of inlined expressions (**default:** `100` `AST`
  nodes).

- `Async`: If `true`, retains async functions and await expressions
  (**default:** `false`).
- `Const`: If `true`, preserves const variables (**default:** `false`).

- `Function`: If `true`, retains all function declarations (**default:**
  `false`).

- `Debug`: If `true`, outputs detailed logs for debugging (**default:**
  `false`).

These settings allow you to fine-tune the tool to suit your project’s needs,
balancing optimization with code preservation.

## Contributing 🤝

Contributions are welcome! Please see [`CONTRIBUTING.md`](CONTRIBUTING.md) for
guidelines and feel free to submit a Pull Request.

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for a history of changes to this component.

[Eliminate]: https://NPMJS.Org/@playform/eliminate
