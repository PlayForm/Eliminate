import type Interface from "@Interface/Output.js";
import type { ScriptTarget, SourceFile } from "typescript";

/**
 * @module Output
 *
 */
export default (async (...[Source, Option = {}]) => {
	const Host = createCompilerHost({});

	const File = "Input.ts";

	Host.getSourceFile = (
		Name: string,

		Version: ScriptTarget,
	) => (Name === File ? createSourceFile(Name, Source, Version) : undefined);

	Host.writeFile = () => {};

	const Program = createProgram(
		[File],

		{
			target: ESNextScriptTarget,

			module: ESNextModuleKind,
		},

		Host,
	);

	// Program.getSyntacticDiagnostics().forEach((Diagnostic) => {
	// 	throw new Error(
	// 		formatDiagnosticsWithColorAndContext([Diagnostic], {
	// 			getCanonicalFileName: (Name) => Name,
	// 			getCurrentDirectory: process.cwd,
	// 			getNewLine: () => "\n",
	// 		}),
	// 	);
	// });

	return createPrinter({
		newLine: LineFeed,

		removeComments: !Option.Comment,
	}).printFile(
		transform(Program.getSourceFile(File)!, [
			new (await import("@Class/Output.js")).default(Option).Transform(
				Program,
			),
		]).transformed[0] as SourceFile,
	);
}) satisfies Interface as Interface;

export const {
	createCompilerHost,
	createPrinter,
	createProgram,
	createSourceFile,
	ModuleKind: { ESNext: ESNextModuleKind },
	NewLineKind: { LineFeed },
	ScriptTarget: { ESNext: ESNextScriptTarget },
	transform,
	formatDiagnosticsWithColorAndContext,
} = await import("typescript");
