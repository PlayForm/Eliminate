/**
 * @module Exec
 *
 */
export default interface Interface {
	/**
	 * The 'Exec' function is an asynchronous function that executes a command and logs the
	 * stdout and stderr of the child process.
	 *
	 * @param Command - The 'Command' parameter is a string that represents the
	 * command you want to execute. It can be any valid command that can be executed in a
	 * terminal or command prompt.
	 *
	 * @param Echo - An optional parameter that controls whether the stdout and stderr
	 * of the child process should be logged. If set to 'false', no logging will occur. If set
	 * to a function, the function will be called with the stdout and stderr data as a parameter for custom
	 * logging. If not provided, stdout and stderr will be logged to the console by default.
	 *
	 */
	(
		Command: string,
		// biome-ignore lint/suspicious/noExplicitAny:
		Echo?: false | ((Return: any, _Error?: boolean) => Promise<void>),
	): Promise<void>;
}
