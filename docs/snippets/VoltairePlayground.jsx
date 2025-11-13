import { Sandpack } from "@codesandbox/sandpack-react";
import "@codesandbox/sandpack-react/dist/index.css";

const voltaireTheme = {
	colors: {
		surface1: "#1a1a1a",
		surface2: "#2a2a2a",
		surface3: "#3a3a3a",
		clickable: "#E6A23C",
		base: "#e0e0e0",
		disabled: "#666",
		hover: "#A0522D",
		accent: "#E6A23C",
		error: "#ef4444",
		errorSurface: "#3d1f1f",
	},
	syntax: {
		plain: "#e0e0e0",
		comment: {
			color: "#999",
			fontStyle: "italic",
		},
		keyword: "#E6A23C",
		tag: "#D4931E",
		punctuation: "#d4d4d4",
		definition: "#dcdcaa",
		property: "#9cdcfe",
		static: "#E2982D",
		string: "#ce9178",
	},
	font: {
		body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		mono: '"Fira Code", "Fira Mono", "Courier New", monospace',
		size: "14px",
		lineHeight: "1.5",
	},
};

export const VoltairePlayground = ({
	files,
	dependencies = {},
	activeFile = "/index.ts",
	showConsole = true,
	autorun = true,
	height = 500,
}) => {
	return (
		<Sandpack
			template="vanilla-ts"
			theme={voltaireTheme}
			files={files}
			customSetup={{
				dependencies: {
					...dependencies,
				},
			}}
			options={{
				showConsole,
				showConsoleButton: true,
				autorun,
				showLineNumbers: true,
				showTabs: Object.keys(files || {}).length > 1,
				activeFile,
				editorHeight: height,
				layout: showConsole ? "console" : "preview",
				showInlineErrors: true,
				showRefreshButton: true,
			}}
		/>
	);
};
