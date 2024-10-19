import * as fs from "fs";
import * as path from "path";

const root = path.dirname(path.dirname(__dirname));

const platform = process.platform;

console.log(
	path.join(
		root,
		".build",
		"node",
		`v${
			/^target="(.*)"$/m.exec(
				fs.readFileSync(path.join(root, "remote", ".npmrc"), "utf8"),
			)![1]
		}`,
		`${platform}-${process.arch}`,
		platform === "win32" ? "node.exe" : "node",
	),
);
