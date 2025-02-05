declare namespace _default {
    let arrowParens: string;
    let bracketSameLine: boolean;
    let bracketSpacing: boolean;
    let cursorOffset: number;
    let embeddedLanguageFormatting: string;
    let endOfLine: string;
    let htmlWhitespaceSensitivity: string;
    let insertPragma: boolean;
    let jsxSingleQuote: boolean;
    let printWidth: number;
    let proseWrap: string;
    let quoteProps: string;
    let requirePragma: boolean;
    let semi: boolean;
    let singleQuote: boolean;
    let tabWidth: number;
    let trailingComma: string;
    let useTabs: boolean;
    let vueIndentScriptAndStyle: boolean;
    let plugins: string[];
    let tailwindConfig: string;
    let overrides: ({
        files: string;
        options: {
            parser: string;
            trailingComma?: never;
        };
    } | {
        files: string;
        options: {
            trailingComma: string;
            parser?: never;
        };
    })[];
    let attributeGroups: string[];
    let attributeSort: string;
    let attributeIgnoreCase: boolean;
    let importOrder: string[];
    let importOrderParserPlugins: string[];
    let importOrderTypeScriptVersion: string;
}
export default _default;
