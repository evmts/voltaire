// Debug: capture unhandled errors
window.addEventListener("error", (_e) => {});
window.addEventListener("unhandledrejection", (_e) => {});

import "./style.css";
import { type ApiMode, ApiModeToggle } from "./components/ApiModeToggle.js";
import { Breadcrumbs } from "./components/Breadcrumbs.js";
import { Console } from "./components/Console.js";
import { Editor } from "./components/Editor.js";
import { EditorTabs } from "./components/EditorTabs.js";
import { type FileNode, FileTree } from "./components/FileTree.js";
import { contractExamples } from "./examples/contract.js";
import { cryptoExamples } from "./examples/crypto.js";
import { evmExamples } from "./examples/evm.js";
import { effectExamples } from "./examples/effect.js";
import { primitiveExamples } from "./examples/primitives.js";
import { recipesExamples } from "./examples/recipes.js";
import { standardsExamples } from "./examples/standards.js";
import { AutoSave } from "./features/AutoSave.js";
import { CodeLensProvider } from "./features/CodeLens.js";
import { DiffView } from "./features/DiffView.js";
import { DisplaySettingsManager } from "./features/DisplaySettings.js";
import { ExecutionHistory } from "./features/ExecutionHistory.js";
import { createInlineSuggestionsButton } from "./features/InlineSuggestions.js";
import {
	addShortcutStyles,
	KeyboardShortcuts,
} from "./features/KeyboardShortcuts.js";
import { SearchReplace } from "./features/SearchReplace.js";
import { VimMode } from "./features/VimMode.js";
import { Executor } from "./runtime/Executor.js";

// Build file tree structure
const fileTree: FileNode[] = [
	{
		name: "Primitives",
		path: "primitives",
		children: Object.entries(primitiveExamples).map(([name, content]) => ({
			name,
			path: `primitives/${name}`,
			content,
		})),
	},
	{
		name: "Cryptography",
		path: "crypto",
		children: Object.entries(cryptoExamples).map(([name, content]) => ({
			name,
			path: `crypto/${name}`,
			content,
		})),
	},
	{
		name: "EVM",
		path: "evm",
		children: Object.entries(evmExamples).map(([name, content]) => ({
			name,
			path: `evm/${name}`,
			content,
		})),
	},
	{
		name: "Standards",
		path: "standards",
		children: Object.entries(standardsExamples).map(([name, content]) => ({
			name,
			path: `standards/${name}`,
			content,
		})),
	},
	{
		name: "Effect",
		path: "effect",
		children: Object.entries(effectExamples).map(([name, content]) => ({
			name,
			path: `effect/${name}`,
			content,
		})),
	},
	{
		name: "Recipes",
		path: "recipes",
		children: Object.entries(recipesExamples).map(([name, content]) => ({
			name,
			path: `recipes/${name}`,
			content,
		})),
	},
	{
		name: "Contract",
		path: "contract",
		children: Object.entries(contractExamples).map(([name, content]) => ({
			name,
			path: `contract/${name}`,
			content,
		})),
	},
];

// State
let currentFile: FileNode | null = null;
let restoreConsole: (() => void) | null = null;
let settingsPanelOpen = false;
let currentApiMode: ApiMode = "regular";
let apiModeToggle: ApiModeToggle | null = null;

// Initialize components - DOM elements guaranteed to exist in index.html
const editorEl = document.getElementById("editor") ?? document.body;
const consoleEl = document.getElementById("console-content") ?? document.body;
const breadcrumbsEl = document.getElementById("breadcrumbs") ?? document.body;
const historyEl = document.getElementById("history-panel") ?? document.body;
const vimStatusEl = document.getElementById("vim-status") ?? document.body;

const editor = new Editor(editorEl);
const consoleComponent = new Console(consoleEl);
const breadcrumbs = new Breadcrumbs(breadcrumbsEl);
const executor = new Executor();
const history = new ExecutionHistory(historyEl);
const vimMode = new VimMode(vimStatusEl);
const displaySettings = new DisplaySettingsManager();

// EditorTabs, DiffView, and SearchReplace will be initialized after editor.init()
let editorTabs: EditorTabs | null = null;
let diffView: DiffView | null = null;
let searchReplace: SearchReplace | null = null;

// Initialize AutoSave
const autoSave = new AutoSave(editor, {
	debounceMs: 1000,
	storagePrefix: "voltaire-playground-",
});

// URL parameter handling for deep linking
function getExampleFromUrl(): string | null {
	const params = new URLSearchParams(window.location.search);
	return params.get("example");
}

function updateUrlWithExample(path: string): void {
	const url = new URL(window.location.href);
	url.searchParams.set("example", path);
	window.history.replaceState({}, "", url.toString());
}

// File selection handler
function handleFileSelect(file: FileNode): void {
	if (!file.content) return;

	currentFile = file;

	// Update URL for deep linking
	updateUrlWithExample(file.path);

	// Transform content based on current API mode
	const transformedContent = transformImportsForMode(
		file.content,
		currentApiMode,
	);

	// Use EditorTabs if available, fallback to old behavior
	if (editorTabs) {
		// Create a modified file object with transformed content
		const transformedFile = { ...file, content: transformedContent };
		editorTabs.openFile(transformedFile);

		// Store original content for diff view
		if (diffView) {
			diffView.storeOriginalContent(file.path, file.content);
		}
	} else {
		// Fallback: Load file with AutoSave (will restore from LocalStorage if available)
		autoSave.loadFile(file.path, transformedContent);
	}

	// Update breadcrumbs
	breadcrumbs.update(file.path);

	// Also update the old file label for backward compatibility
	const fileLabel = document.getElementById("current-file");
	if (fileLabel) {
		fileLabel.textContent = file.path;
	}

	const runButton = document.getElementById("run-button") as HTMLButtonElement;
	// Only enable run button if mode is supported
	runButton.disabled = isUnsupportedMode(currentApiMode);

	consoleComponent.clear();
}

// Transform import paths based on API mode
function transformImportsForMode(code: string, mode: ApiMode): string {
	switch (mode) {
		case "wasm":
			return code
				.replace(/from ["']@tevm\/voltaire["']/g, 'from "@tevm/voltaire/wasm"')
				.replace(/from ["']voltaire["']/g, 'from "voltaire/wasm"');
		case "native":
			return code
				.replace(
					/from ["']@tevm\/voltaire["']/g,
					'from "@tevm/voltaire/native"',
				)
				.replace(/from ["']voltaire["']/g, 'from "voltaire/native"');
		case "swift": {
			// Extract imports and convert to Swift syntax
			const importMatch = code.match(
				/import\s*\{([^}]+)\}\s*from\s*["']@?tevm\/voltaire["']/,
			);
			const imports = importMatch
				? importMatch[1]
						.split(",")
						.map((s) => s.trim())
						.join(", ")
				: "";
			const codeWithoutImport = code.replace(
				/import\s*\{[^}]+\}\s*from\s*["']@?tevm\/voltaire["'][;\n]*/g,
				"",
			);
			return `import Voltaire  // ${imports}\n\n// Swift preview (not executable in browser)\n// TypeScript equivalent:\n${codeWithoutImport
				.split("\n")
				.map((line) => `// ${line}`)
				.join("\n")}`;
		}
		case "zig": {
			// Extract imports and convert to Zig syntax
			const importMatch = code.match(
				/import\s*\{([^}]+)\}\s*from\s*["']@?tevm\/voltaire["']/,
			);
			const imports = importMatch
				? importMatch[1]
						.split(",")
						.map((s) => s.trim())
						.join(", ")
				: "";
			const codeWithoutImport = code.replace(
				/import\s*\{[^}]+\}\s*from\s*["']@?tevm\/voltaire["'][;\n]*/g,
				"",
			);
			return `const voltaire = @import("voltaire");  // ${imports}\n\n// Zig preview (not executable in browser)\n// TypeScript equivalent:\n${codeWithoutImport
				.split("\n")
				.map((line) => `// ${line}`)
				.join("\n")}`;
		}
		default:
			return code;
	}
}

// Update editor content for current mode
function updateEditorForMode(): void {
	if (!currentFile?.content) return;

	const transformedCode = transformImportsForMode(
		currentFile.content,
		currentApiMode,
	);

	if (editorTabs) {
		const activeTab = editorTabs.getActiveTab();
		if (activeTab) {
			activeTab.model.setValue(transformedCode);
		}
	} else {
		editor.setValue(transformedCode);
	}
}

// Get banner message for unsupported modes
function getUnsupportedModeMessage(mode: ApiMode): string {
	switch (mode) {
		case "native":
			return "Native FFI requires Bun runtime - not available in browser";
		case "swift":
			return "Swift API - not available in browser";
		case "zig":
			return "Zig API - not available in browser";
		default:
			return "";
	}
}

// Check if mode is unsupported in browser
function isUnsupportedMode(mode: ApiMode): boolean {
	return mode === "native" || mode === "swift" || mode === "zig";
}

// API mode change handler
function handleApiModeChange(mode: ApiMode): void {
	currentApiMode = mode;
	const runButton = document.getElementById("run-button") as HTMLButtonElement;
	const existingBanner = document.getElementById("unsupported-mode-banner");

	if (isUnsupportedMode(mode)) {
		runButton.disabled = true;
		runButton.classList.add("native-disabled");
		runButton.dataset.tooltip = getUnsupportedModeMessage(mode);

		// Remove existing banner if any
		if (existingBanner) {
			existingBanner.remove();
		}

		// Show unsupported mode banner
		const banner = document.createElement("div");
		banner.id = "unsupported-mode-banner";
		banner.className = `unsupported-mode-banner ${mode}-mode-banner`;
		banner.textContent = getUnsupportedModeMessage(mode);
		const editorContainer = document.getElementById("editor-container");
		const breadcrumbs = document.getElementById("breadcrumbs");
		if (editorContainer && breadcrumbs) {
			editorContainer.insertBefore(banner, breadcrumbs);
		}
	} else {
		runButton.classList.remove("native-disabled");
		delete runButton.dataset.tooltip;
		if (currentFile) {
			runButton.disabled = false;
		}

		// Remove unsupported mode banner
		if (existingBanner) {
			existingBanner.remove();
		}
	}

	// Update editor content with transformed imports
	updateEditorForMode();
}

// Run button handler
async function handleRun(): Promise<void> {
	if (!currentFile) return;
	if (isUnsupportedMode(currentApiMode)) return;

	const runButton = document.getElementById("run-button") as HTMLButtonElement;
	runButton.disabled = true;
	runButton.textContent = "Running...";

	consoleComponent.clear();

	// Restore previous console capture if exists
	if (restoreConsole) {
		restoreConsole();
	}

	// Capture console output
	restoreConsole = consoleComponent.captureConsole();

	const startTime = performance.now();
	// Get code from active tab if available, fallback to editor
	const code =
		editorTabs?.getActiveTab()?.model.getValue() || editor.getValue();
	let output = "";

	// Capture output for history
	const consoleContainer =
		document.getElementById("console-content") ?? document.body;
	const observer = new MutationObserver(() => {
		output = consoleContainer.textContent || "";
	});
	observer.observe(consoleContainer, { childList: true, subtree: true });

	try {
		await executor.execute(code);
	} catch (_error) {
		// Error already logged to console by executor
	} finally {
		const duration = performance.now() - startTime;
		observer.disconnect();

		// Save to history
		history.addEntry({
			timestamp: Date.now(),
			code,
			output,
			duration,
			filePath: currentFile.path,
		});

		runButton.disabled = false;
		runButton.textContent = "Run";
	}
}

// Settings panel toggle
function toggleSettings(): void {
	const panel = document.getElementById("settings-panel");
	if (!panel) return;

	settingsPanelOpen = !settingsPanelOpen;
	panel.style.display = settingsPanelOpen ? "block" : "none";
}

// Diff view toggle
function toggleDiffView(): void {
	if (!diffView || !editorTabs) return;

	const activeTab = editorTabs.getActiveTab();
	if (!activeTab) return;

	diffView.toggleDiffMode(activeTab);

	// Update button state
	const diffButton = document.getElementById("diff-toggle");
	if (diffButton) {
		diffButton.classList.toggle("active", diffView.isInDiffMode());
	}

	// Update diff indicator
	updateDiffIndicator();
}

// Update diff indicator showing line changes
function updateDiffIndicator(): void {
	if (!diffView || !editorTabs) return;

	const activeTab = editorTabs.getActiveTab();
	const diffIndicator = document.getElementById("diff-indicator");

	if (!activeTab || !diffIndicator) return;

	if (diffView.hasChanges(activeTab.path, activeTab.model.getValue())) {
		const lineCount = diffView.getChangedLineCount(
			activeTab.path,
			activeTab.model.getValue(),
		);
		diffIndicator.textContent = `${lineCount} lines changed`;
		diffIndicator.style.display = "inline";
	} else {
		diffIndicator.style.display = "none";
	}
}

// Initialize app
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: app initialization logic
async function init(): Promise<void> {
	// Add keyboard shortcuts styles
	addShortcutStyles();

	// Initialize editor
	await editor.init();

	// Initialize EditorTabs
	const editorTabsContainer =
		document.getElementById("editor-tabs") ?? document.body;
	editorTabs = new EditorTabs(
		editorTabsContainer,
		editor.getMonaco(),
		editor.getEditor(),
		(tab) => {
			// Tab change callback
			if (diffView) {
				diffView.onTabChange(tab);
			}
			updateDiffIndicator();

			// Update breadcrumbs
			if (tab) {
				breadcrumbs.update(tab.path);
			}
		},
	);

	// Initialize DiffView
	const editorContainer = document.getElementById("editor") ?? document.body;
	diffView = new DiffView(
		editor.getMonaco(),
		editorContainer,
		editor.getEditor(),
	);

	// Initialize SearchReplace
	const searchPanel = document.getElementById("search-panel") ?? document.body;
	searchReplace = new SearchReplace(
		editor.getMonaco(),
		editor.getEditor(),
		editorTabs,
		searchPanel,
	);

	// Initialize CodeLens
	CodeLensProvider.register(editor.getMonaco(), editor.getEditor(), handleRun);

	// Initialize AutoSave with UI indicators
	const unsavedIndicator =
		document.getElementById("unsaved-indicator") ?? document.body;
	const lastSavedIndicator =
		document.getElementById("last-saved-indicator") ?? document.body;
	autoSave.init(unsavedIndicator, lastSavedIndicator);

	// Initialize breadcrumbs with editor reference
	breadcrumbs.setEditor(editor.getEditor(), editor.getMonaco());
	breadcrumbs.setNavigationCallback((path: string) => {
		// Navigate to folder - find first file in folder
		const folderNode = findFileByPath(fileTree, path);
		if (folderNode?.children && folderNode.children.length > 0) {
			// Find first file in folder
			const firstFile = folderNode.children.find((n) => n.content);
			if (firstFile) {
				handleFileSelect(firstFile);
			}
		}
	});

	// Apply initial display settings
	editor.applySettings(displaySettings.get());

	// Listen for settings changes
	displaySettings.onChange((settings) => {
		editor.applySettings(settings);
	});

	// Initialize file tree
	const fileTreeEl = document.getElementById("file-tree") ?? document.body;
	new FileTree(fileTreeEl, fileTree, (file) => {
		handleFileSelect(file);
		// Close mobile menu on file select
		closeMobileMenu();
	});

	// Setup mobile menu toggle
	const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
	const mobileOverlay = document.getElementById("mobile-overlay");

	// Add mobile header to file tree
	const mobileHeader = document.createElement("div");
	mobileHeader.className = "mobile-file-tree-header";
	mobileHeader.innerHTML = `
		<h3>Examples</h3>
		<button class="mobile-file-tree-close" title="Close">×</button>
	`;
	fileTreeEl.insertBefore(mobileHeader, fileTreeEl.firstChild);

	function openMobileMenu(): void {
		fileTreeEl.classList.add("mobile-open");
		mobileOverlay?.classList.add("visible");
	}

	function closeMobileMenu(): void {
		fileTreeEl.classList.remove("mobile-open");
		mobileOverlay?.classList.remove("visible");
	}

	// Close button in mobile header
	const mobileCloseBtn = mobileHeader.querySelector(".mobile-file-tree-close");
	if (mobileCloseBtn) {
		mobileCloseBtn.addEventListener("click", closeMobileMenu);
	}

	if (mobileMenuToggle) {
		mobileMenuToggle.addEventListener("click", () => {
			if (fileTreeEl.classList.contains("mobile-open")) {
				closeMobileMenu();
			} else {
				openMobileMenu();
			}
		});
	}

	if (mobileOverlay) {
		mobileOverlay.addEventListener("click", closeMobileMenu);
	}

	// Handle URL deep linking - select file from ?example= parameter
	const examplePath = getExampleFromUrl();
	if (examplePath) {
		const file = findFileByPath(fileTree, examplePath);
		if (file) {
			handleFileSelect(file);
		}
	}

	// Setup run button
	const runButton = document.getElementById("run-button");
	runButton?.addEventListener("click", handleRun);

	// Initialize API mode toggle
	const apiModeContainer =
		document.getElementById("api-mode-toggle") ?? document.body;
	apiModeToggle = new ApiModeToggle(apiModeContainer, {
		onChange: handleApiModeChange,
	});
	// Apply initial mode
	currentApiMode = apiModeToggle.getMode();
	handleApiModeChange(currentApiMode);

	// Setup history button
	const historyButton = document.getElementById("history-button");
	historyButton?.addEventListener("click", () => history.togglePanel());

	// Setup report bug button
	const reportBugButton = document.getElementById("report-bug-button");
	reportBugButton?.addEventListener("click", () => {
		const issueUrl = "https://github.com/evmts/voltaire/issues/new";
		const params = new URLSearchParams({
			title: "[Playground] ",
			body: `**Note:** Bugs in the playground are more likely to be issues with the playground implementation itself rather than the Voltaire library. If you believe this is a library bug, please remove "[Playground]" from the title.

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Example code (if applicable)**
\`\`\`typescript
// paste code here
\`\`\`

**Environment**
- Browser:
- OS:
`,
		});
		window.open(`${issueUrl}?${params.toString()}`, "_blank");
	});

	// Setup history replay
	const historyPanel = document.getElementById("history-panel");
	historyPanel?.addEventListener("history-replay", (e: Event) => {
		const event = e as CustomEvent;
		const entry = event.detail;

		// Find file in tree
		const file = findFileByPath(fileTree, entry.filePath);
		if (file) {
			handleFileSelect(file);
			editor.setValue(entry.code);
		}
	});

	// Setup vim toggle button
	const vimToggle = document.getElementById("vim-toggle");
	vimToggle?.addEventListener("click", () => {
		vimMode.toggle(editor.getEditor());
		vimToggle.classList.toggle("active", vimMode.isEnabled());
	});

	// Initialize vim mode if previously enabled
	if (vimMode.isEnabled()) {
		vimMode.initVim(editor.getEditor());
		vimToggle.classList.add("active");
	}

	// Setup keyboard shortcuts
	const shortcuts = new KeyboardShortcuts({
		editor: editor.getEditor(),
		monaco: editor.getMonaco(),
		onRun: handleRun,
		onClearConsole: () => consoleComponent.clear(),
		onIncreaseFontSize: () => displaySettings.increaseFontSize(),
		onDecreaseFontSize: () => displaySettings.decreaseFontSize(),
		onToggleSettings: () => toggleSettings(),
	});
	shortcuts.register();

	// Setup settings button
	const settingsButton = document.getElementById("settings-button");
	if (settingsButton) {
		settingsButton.addEventListener("click", toggleSettings);
	}

	// Setup settings panel
	const settingsPanel = document.getElementById("settings-panel");
	if (settingsPanel) {
		displaySettings.createUI(settingsPanel);
	}

	// Setup diff toggle button
	const diffToggle = document.getElementById("diff-toggle");
	if (diffToggle) {
		diffToggle.addEventListener("click", toggleDiffView);
	}

	// Setup revert button
	const revertButton = document.getElementById("revert-button");
	if (revertButton) {
		revertButton.addEventListener("click", () => {
			if (!diffView || !editorTabs) return;
			const activeTab = editorTabs.getActiveTab();
			if (activeTab) {
				diffView.revertToOriginal(activeTab);
			}
		});
	}

	// Setup inline suggestions button
	const inlineSuggestions = editor.getInlineSuggestions();
	if (inlineSuggestions) {
		const inlineButton = createInlineSuggestionsButton(inlineSuggestions);
		const toolbar = document.querySelector(".toolbar");
		if (toolbar) {
			toolbar.appendChild(inlineButton);
		}
	}
}

// Helper to find file by path
function findFileByPath(nodes: FileNode[], path: string): FileNode | null {
	for (const node of nodes) {
		if (node.path === path) return node;
		if (node.children) {
			const found = findFileByPath(node.children, path);
			if (found) return found;
		}
	}
	return null;
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
	autoSave.destroy();
	if (searchReplace) {
		searchReplace.destroy();
	}
	editor.dispose();
});

// Start app
init().catch(console.error);
