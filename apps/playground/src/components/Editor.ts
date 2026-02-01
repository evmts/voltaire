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

/** Monaco editor instance (subset of IStandaloneCodeEditor) */
interface MonacoEditor {
	setValue(value: string): void;
	getValue(): string;
	updateOptions(options: Record<string, unknown>): void;
	setModel(model: unknown): void;
}

/** Monaco namespace returned by modern-monaco init */
interface MonacoNamespace {
	editor: {
		create(
			container: HTMLElement,
			options: Record<string, unknown>,
		): MonacoEditor;
		createModel(value: string, language: string): unknown;
	};
	languages?: {
		typescript?: {
			typescriptDefaults?: {
				addExtraLib(content: string, filePath: string): void;
			};
		};
	};
}

export class Editor {
	private editor: MonacoEditor | null = null;
	private monaco: MonacoNamespace | null = null;
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
		this.monaco = await init({
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
					importMap: {
						// $baseURL must match the origin of files being edited
						// Without this, importMap resolution fails due to origin mismatch
						$baseURL: `${baseUrl}/`,
						imports,
						scopes: {},
					},
				},
			},
		});

		// Add fetched type definitions to Monaco
		// Note: modern-monaco doesn't expose typescriptDefaults.addExtraLib
		// Types are provided via importMap in the init config above
		if (this.monaco.languages?.typescript?.typescriptDefaults) {
			for (const [modulePath, typeDef] of Object.entries(typeDefinitions)) {
				this.monaco.languages.typescript.typescriptDefaults.addExtraLib(
					typeDef,
					`file:///node_modules/${modulePath}/index.d.ts`,
				);
			}
		}

		// Register import completion providers
		this.completionDisposables = registerImportCompletion(
			typeDefinitions,
			this.monaco,
		);

		// Register Voltaire code snippets
		registerVoltaireSnippets(this.monaco);

		// Register quick fix code actions
		this.quickFixDisposable = registerQuickFixes(this.monaco);

		// Register inline suggestions
		this.inlineSuggestions = new InlineSuggestions();
		const inlineDisposable = this.inlineSuggestions.register(this.monaco);
		this.completionDisposables.push(inlineDisposable);

		// Create editor instance without initial model
		this.editor = this.monaco.editor.create(this.container, {
			automaticLayout: true,
			minimap: { enabled: false },
			fontSize: 14,
			lineNumbers: "on",
			scrollBeyondLastLine: false,
			wordWrap: "on",
			wrappingIndent: "indent",
			padding: { top: 8, bottom: 8 },
		});

		// Create and attach model separately (required by modern-monaco LSP)
		const model = this.monaco.editor.createModel(
			"// Select a file from the tree to begin",
			"typescript",
		);
		this.editor.setModel(model);

		// Register navigation providers (F12, Alt+F12, Shift+F12)
		this.navigationDisposables = registerNavigationProviders(
			this.editor,
			this.monaco,
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
			this.editor.updateOptions({
				fontSize: settings.fontSize,
				fontFamily: settings.fontFamily,
				minimap: { enabled: settings.minimap },
				lineNumbers: settings.lineNumbers,
				wordWrap: settings.wordWrap,
			});
		}
	}

	getEditor(): MonacoEditor | null {
		return this.editor;
	}

	getMonaco(): MonacoNamespace | null {
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
