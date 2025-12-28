// Debug: capture unhandled errors
window.addEventListener("error", (e) =>
	console.error("Global error:", e.message, e.filename, e.lineno),
);
window.addEventListener("unhandledrejection", (e) =>
	console.error("Unhandled rejection:", e.reason),
);

import "./style.css";
import { Breadcrumbs } from "./components/Breadcrumbs.js";
import { Console } from "./components/Console.js";
import { Editor } from "./components/Editor.js";
import { EditorTabs } from "./components/EditorTabs.js";
import { type FileNode, FileTree } from "./components/FileTree.js";
import { cryptoExamples } from "./examples/crypto.js";
import { evmExamples } from "./examples/evm.js";
import { primitiveExamples } from "./examples/primitives.js";
import { wasmExamples } from "./examples/wasm.js";
import { AutoSave } from "./features/AutoSave.js";
import { BenchmarkMode } from "./features/BenchmarkMode.js";
import { CodeLensProvider } from "./features/CodeLens.js";
import { DiffView } from "./features/DiffView.js";
import { DisplaySettingsManager } from "./features/DisplaySettings.js";
import { ExecutionHistory } from "./features/ExecutionHistory.js";
import { createInlineSuggestionsButton } from "./features/InlineSuggestions.js";
import {
	KeyboardShortcuts,
	addShortcutStyles,
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
    name: "WASM API",
    path: "wasm",
    children: Object.entries(wasmExamples).map(([name, content]) => ({
      name,
      path: `wasm/${name}`,
      content,
    })),
  },
];

// State
let currentFile: FileNode | null = null;
let restoreConsole: (() => void) | null = null;
let settingsPanelOpen = false;

// Initialize components
const editor = new Editor(document.getElementById("editor")!);
const consoleComponent = new Console(
	document.getElementById("console-content")!,
);
const breadcrumbs = new Breadcrumbs(document.getElementById("breadcrumbs")!);
const executor = new Executor();
const history = new ExecutionHistory(document.getElementById("history-panel")!);
const benchmark = new BenchmarkMode(
	document.getElementById("benchmark-panel")!,
);
const vimMode = new VimMode(document.getElementById("vim-status")!);
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

// File selection handler
function handleFileSelect(file: FileNode): void {
	if (!file.content) return;

	currentFile = file;

	// Use EditorTabs if available, fallback to old behavior
	if (editorTabs) {
		editorTabs.openFile(file);

		// Store original content for diff view
		if (diffView) {
			diffView.storeOriginalContent(file.path, file.content);
		}
	} else {
		// Fallback: Load file with AutoSave (will restore from LocalStorage if available)
		autoSave.loadFile(file.path, file.content);
	}

	// Update breadcrumbs
	breadcrumbs.update(file.path);

	// Also update the old file label for backward compatibility
	const fileLabel = document.getElementById("current-file");
	if (fileLabel) {
		fileLabel.textContent = file.path;
	}

	const runButton = document.getElementById("run-button") as HTMLButtonElement;
	runButton.disabled = false;

	consoleComponent.clear();
}

// Run button handler
async function handleRun(): Promise<void> {
	if (!currentFile) return;

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
	const consoleContainer = document.getElementById("console-content")!;
	const observer = new MutationObserver(() => {
		output = consoleContainer.textContent || "";
	});
	observer.observe(consoleContainer, { childList: true, subtree: true });

	try {
		await executor.execute(code);
	} catch (error) {
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
async function init(): Promise<void> {
	// Add keyboard shortcuts styles
	addShortcutStyles();

	// Initialize editor
	await editor.init();

	// Initialize EditorTabs
	const editorTabsContainer = document.getElementById("editor-tabs")!;
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
	const editorContainer = document.getElementById("editor")!;
	diffView = new DiffView(
		editor.getMonaco(),
		editorContainer,
		editor.getEditor(),
	);

	// Initialize SearchReplace
	const searchPanel = document.getElementById("search-panel")!;
	searchReplace = new SearchReplace(
		editor.getMonaco(),
		editor.getEditor(),
		editorTabs,
		searchPanel,
	);

	// Initialize CodeLens
	CodeLensProvider.register(editor.getMonaco(), editor.getEditor(), handleRun);

	// Initialize AutoSave with UI indicators
	const unsavedIndicator = document.getElementById("unsaved-indicator")!;
	const lastSavedIndicator = document.getElementById("last-saved-indicator")!;
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
	const fileTreeEl = document.getElementById("file-tree");
	new FileTree(fileTreeEl!, fileTree, handleFileSelect);

	// Setup run button
	const runButton = document.getElementById("run-button")!;
	runButton.addEventListener("click", handleRun);

	// Setup history button
	const historyButton = document.getElementById("history-button")!;
	historyButton.addEventListener("click", () => history.togglePanel());

	// Setup benchmark button
	const benchmarkButton = document.getElementById("benchmark-button")!;
	benchmarkButton.addEventListener("click", () => {
		if (!currentFile) {
			alert("Please select a file to benchmark");
			return;
		}

		// Show configuration modal
		const modal = document.createElement("div");
		modal.className = "benchmark-modal";
		modal.innerHTML = `
      <div class="benchmark-modal-content">
        <div class="benchmark-modal-header">
          <h3>Configure Benchmark</h3>
          <button class="benchmark-modal-close">✕</button>
        </div>
        <div class="benchmark-modal-body">
          <p style="margin-bottom: 16px;">File: ${currentFile.path}</p>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--text-secondary);">Iterations:</label>
            <select id="benchmark-iterations" style="width: 100%; padding: 8px; background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
              <option value="10">10 runs (quick)</option>
              <option value="50">50 runs (recommended)</option>
              <option value="100">100 runs (detailed)</option>
              <option value="1000">1000 runs (thorough)</option>
            </select>
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--text-secondary);">Warmup Runs:</label>
            <select id="benchmark-warmup" style="width: 100%; padding: 8px; background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
              <option value="0">0 (no warmup)</option>
              <option value="2" selected>2 (recommended)</option>
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="benchmark-cancel" style="padding: 8px 16px; background-color: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">Cancel</button>
            <button id="benchmark-start" style="padding: 8px 16px; background-color: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer;">Start Benchmark</button>
          </div>
        </div>
      </div>
    `;

		document.body.appendChild(modal);

		const closeModal = () => {
			document.body.removeChild(modal);
		};

		const closeBtn = modal.querySelector(".benchmark-modal-close");
		if (closeBtn) {
			closeBtn.addEventListener("click", closeModal);
		}

		const cancelBtn = modal.querySelector("#benchmark-cancel");
		if (cancelBtn) {
			cancelBtn.addEventListener("click", closeModal);
		}

		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				closeModal();
			}
		});

		const startBtn = modal.querySelector("#benchmark-start");
		if (startBtn) {
			startBtn.addEventListener("click", async () => {
				const iterations = Number.parseInt(
					(modal.querySelector("#benchmark-iterations") as HTMLSelectElement)
						.value,
				);
				const warmupRuns = Number.parseInt(
					(modal.querySelector("#benchmark-warmup") as HTMLSelectElement).value,
				);

				closeModal();

				// Open benchmark panel and start
				benchmark.togglePanel();

				try {
					const code =
						editorTabs?.getActiveTab()?.model.getValue() || editor.getValue();

					await benchmark.runBenchmark(code, currentFile?.path, executor, {
						iterations,
						warmupRuns,
					});
				} catch (error) {
					console.error("Benchmark failed:", error);
					alert(`Benchmark failed: ${error}`);
				}
			});
		}
	});

	// Setup history replay
	const historyPanel = document.getElementById("history-panel")!;
	historyPanel.addEventListener("history-replay", (e: Event) => {
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
	const vimToggle = document.getElementById("vim-toggle")!;
	vimToggle.addEventListener("click", () => {
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
