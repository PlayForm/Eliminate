# ↘️ [Eliminate] —

`Eliminate` is a utility that analyzes your `TypeScript` code to identify
variables that are defined but only used once and are not exported. It then
eliminates these variable definitions and replaces their usage with their
initializers, optimizing your code for better readability and performance.

<table>
	<tr>
		<th>Before</th>
    	<th>After</th>
    </tr>
    <tr>
    	<td>
    		<pre>let a = 5;
let b = 10;
let c = a + b;
console.log(c);</pre>
		</td>
		<td>
			<pre>console.log(5 + 10);</pre>
		</td>
	</tr>
</table>

## 📦 Features

-   `TypeScript` support with type-checking
-   **Variable Usage Analysis**: Analyzes the code to count how many times each
    variable is used.
-   **Export Detection**: Ensures exported variables are not removed.
-   **Code Transformation**: Removes unnecessary variable declarations and
    replaces their usage with initializers.
-   **Complex Scenarios Handling**: Handles destructuring, default parameters,
    nested scopes, and type annotations.

## 🚀 Installation

Install the package as a development dependency:

```sh
npm install -D -E @playform/eliminate
```

## 🛠️ Usage

### Command Line

Run the build tool from the command line:

```sh
npx @playform/eliminate Configuration.ts
```

See an example of a configuration file in: [`Configuration.ts`](./Configuration.ts)

### CLI Options

```
Usage: Eliminate Eliminate

Arguments:
  Eliminate                 ↘️ Eliminate configuration file

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

## 🤝 Contributing

Contributions are welcome! Please see [`CONTRIBUTING.md`](CONTRIBUTING.md) for
guidelines and feel free to submit a Pull Request.

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for a history of changes to this component.

[Eliminate]: HTTPS://NPMJS.Org/@playform/eliminate
