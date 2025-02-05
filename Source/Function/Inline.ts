import type { Option } from "@Class/Output.js";
import * as ts from "typescript";

export default async (
	Source: string,

	Option: Option = {},
): Promise<string> => {
	const Host = ts.createCompilerHost({});

	const File = "Input.ts";

	Host.getSourceFile = (
		Name: string,

		Version: ts.ScriptTarget,
	) =>
		Name === File ? ts.createSourceFile(Name, Source, Version) : undefined;

	Host.writeFile = () => {};

	const Program = ts.createProgram(
		[File],

		{
			target: ts.ScriptTarget.ES2020,

			module: ts.ModuleKind.CommonJS,
		},

		Host,
	);

	const Diagnostic = Program.getSyntacticDiagnostics().forEach(
		(Diagnostic) => {
			Diagnostic.
		},
	);

	if (Diagnostic.length > 0) {
		throw new Error(
			ts.formatDiagnosticsWithColorAndContext(Diagnostic, {
				getCanonicalFileName: (Name) => Name,
				getCurrentDirectory: process.cwd,
				getNewLine: () => "\n",
			}),
		);
	}

	return ts
		.createPrinter({
			newLine: ts.NewLineKind.LineFeed,

			removeComments: !Option.Comment,
		})
		.printFile(
			ts.transform(Program.getSourceFile(File)!, [
				new (await import("@Class/Output.js")).default(
					Option,
				).Transform(Program) as ts.TransformerFactory<ts.Node>,
			]).transformed[0] as ts.SourceFile,
		);
};
