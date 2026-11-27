import type * as Monaco from "monaco-editor";
import { init } from "modern-monaco";
import type { DisplaySettings } from "../features/DisplaySettings.js";
import { registerImportCompletion } from "../features/ImportCompletion.js";
import { InlineSuggestions } from "../features/InlineSuggestions.js";
import { registerNavigationProviders } from "../features/Navigation.js";
import { registerQuickFixes } from "../features/QuickFixes.js";
import { registerVoltaireSnippets } from "../features/Snippets.js";
import { getAllSpecifiers } from "../runtime/ModuleRegistry.js";

// Get available Voltaire modules dynamically from registry
const VOLTAIRE_MODULES = getAllSpecifiers();

/** Disposable resource with cleanup method */
interface Disposable {
	dispose(): void;
}

type MonacoWithTsDefaults = typeof Monaco & {
	languages?: typeof Monaco.languages & {
		typescript?: {
			typescriptDefaults?: {
				addExtraLib(content: string, filePath: string): void;
			};
		};
	};
};

export class Editor {
	private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
	private monaco: typeof Monaco | null = null;
	private container: HTMLElement;
	private completionDisposables: Disposable[] = [];
	private quickFixDisposable: Disposable | null = null;
	private navigationDisposables: Disposable[] = [];
	private inlineSuggestions: InlineSuggestions | null = null;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	async init(): Promise<void> {
		// Fetch type definitions from server (actual source files)
		const baseUrl = window.location.origin;
		const typeDefinitions: Record<string, string> = {};

		// Fetch actual type definitions from server
		await Promise.all(
			VOLTAIRE_MODULES.map(async (modulePath) => {
				try {
					const res = await fetch(`${baseUrl}/${modulePath}.d.ts`);
					if (res.ok) {
						typeDefinitions[modulePath] = await res.text();
					}
				} catch {
					// Module not available
				}
			}),
		);

		// Build importMap for TypeScript LSP
		const imports: Record<string, string> = {};
		for (const modulePath of VOLTAIRE_MODULES) {
			imports[modulePath] = `${baseUrl}/${modulePath}.d.ts`;
		}

		// Load monaco with TypeScript LSP support
		const importMapConfig = {
			// $baseURL must match the origin of files being edited
			// Without this, importMap resolution fails due to origin mismatch
			$baseURL: `${baseUrl}/`,
			imports,
			scopes: {},
		} as NonNullable<
			NonNullable<Parameters<typeof init>[0]>["lsp"]
		>["typescript"] extends { importMap?: infer T }
			? T
			: never;

		const monacoApi = (await init({
			theme: "vitesse-dark",
			lsp: {
				typescript: {
					compilerOptions: {
						target: 99, // ESNext
						module: 99, // ESNext
						lib: ["ESNext", "DOM"],
						moduleResolution: 2, // Node
						allowSyntheticDefaultImports: true,
						esModuleInterop: true,
						strict: true,
						skipLibCheck: true,
						resolveJsonModule: true,
					},
					importMap: importMapConfig,
				},
			},
		})) as unknown as MonacoWithTsDefaults;
		this.monaco = monacoApi;

		// Add fetched type definitions to Monaco
		// Note: modern-monaco doesn't expose typescriptDefaults.addExtraLib
		// Types are provided via importMap in the init config above
		if (monacoApi.languages?.typescript?.typescriptDefaults) {
			for (const [modulePath, typeDef] of Object.entries(typeDefinitions)) {
				monacoApi.languages.typescript.typescriptDefaults.addExtraLib(
					typeDef,
					`file:///node_modules/${modulePath}/index.d.ts`,
				);
			}
		}

		// Register import completion providers
		this.completionDisposables = registerImportCompletion(
			typeDefinitions,
			monacoApi,
		);

		// Register Voltaire code snippets
		registerVoltaireSnippets(monacoApi);

		// Register quick fix code actions
		this.quickFixDisposable = registerQuickFixes(monacoApi);

		// Register inline suggestions
		this.inlineSuggestions = new InlineSuggestions();
		const inlineDisposable = this.inlineSuggestions.register(monacoApi);
		this.completionDisposables.push(inlineDisposable);

		// Create editor instance without initial model
		const editorInstance = monacoApi.editor.create(this.container, {
			automaticLayout: true,
			minimap: { enabled: false },
			fontSize: 14,
			lineNumbers: "on",
			scrollBeyondLastLine: false,
			wordWrap: "on",
			wrappingIndent: "indent",
			padding: { top: 8, bottom: 8 },
		});
		this.editor = editorInstance;

		// Create and attach model separately (required by modern-monaco LSP)
		const model = monacoApi.editor.createModel(
			"// Select a file from the tree to begin",
			"typescript",
		);
		editorInstance.setModel(model);

		// Register navigation providers (F12, Alt+F12, Shift+F12)
		this.navigationDisposables = registerNavigationProviders(
			editorInstance,
			monacoApi,
		);
	}

	setValue(value: string): void {
		if (this.editor) {
			this.editor.setValue(value);
		}
	}

	getValue(): string {
		return this.editor?.getValue() || "";
	}

	setReadOnly(readOnly: boolean): void {
		if (this.editor) {
			this.editor.updateOptions({ readOnly });
		}
	}

	applySettings(settings: DisplaySettings): void {
		if (this.editor) {
			const lineNumbers: Monaco.editor.LineNumbersType =
				settings.lineNumbers === "off" ||
				settings.lineNumbers === "relative" ||
				settings.lineNumbers === "interval"
					? settings.lineNumbers
					: "on";
			const wordWrap: "on" | "off" | "wordWrapColumn" | "bounded" =
				settings.wordWrap === "off" ||
				settings.wordWrap === "wordWrapColumn" ||
				settings.wordWrap === "bounded"
					? settings.wordWrap
					: "on";
			this.editor.updateOptions({
				fontSize: settings.fontSize,
				fontFamily: settings.fontFamily,
				minimap: { enabled: settings.minimap },
				lineNumbers,
				wordWrap,
			});
		}
	}

	getEditor(): Monaco.editor.IStandaloneCodeEditor | null {
		return this.editor;
	}

	getMonaco(): typeof Monaco | null {
		return this.monaco;
	}

	getInlineSuggestions(): InlineSuggestions | null {
		return this.inlineSuggestions;
	}

	dispose(): void {
		if (this.quickFixDisposable) {
			this.quickFixDisposable.dispose();
		}
		if (this.inlineSuggestions) {
			this.inlineSuggestions.destroy();
		}
		for (const disposable of this.completionDisposables) {
			disposable.dispose();
		}
		for (const disposable of this.navigationDisposables) {
			disposable.dispose();
		}
	}
}
