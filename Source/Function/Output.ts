import type Interface from "@Interface/Output.js";
import type { ScriptTarget, SourceFile } from "typescript";

/**
 * @module Output
 *
 */
export default (async (...[Source, Option = {}]): Promise<string> => {
	const Host = createCompilerHost({});

	const File = "Input.ts";

	Host.getSourceFile = (
		Name: string,

		Version: ScriptTarget,
	): SourceFile | undefined =>
		Name === File ? createSourceFile(Name, Source, Version) : undefined;

	Host.writeFile = (): void => {};

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
		// biome-ignore lint/style/noNonNullAssertion:
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
