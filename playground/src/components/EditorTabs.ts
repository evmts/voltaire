import type * as Monaco from "monaco-editor";
import type { FileNode } from "./FileTree.js";

export interface Tab {
	path: string;
	name: string;
	content: string;
	isDirty: boolean;
	model: Monaco.editor.ITextModel;
}

export class EditorTabs {
	private tabs: Tab[] = [];
	private activeTabIndex = -1;
	private container: HTMLElement;
	private monaco: typeof Monaco;
	private editor: Monaco.editor.IStandaloneCodeEditor;
	private onTabChange?: (tab: Tab | null) => void;

	constructor(
		container: HTMLElement,
		monaco: typeof Monaco,
		editor: Monaco.editor.IStandaloneCodeEditor,
		onTabChange?: (tab: Tab | null) => void,
	) {
		this.container = container;
		this.monaco = monaco;
		this.editor = editor;
		this.onTabChange = onTabChange;
		this.render();
		this.setupKeyboardShortcuts();
	}

	private setupKeyboardShortcuts(): void {
		document.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey) {
				const num = Number.parseInt(e.key);
				if (num >= 1 && num <= 9) {
					e.preventDefault();
					const index = num - 1;
					if (index < this.tabs.length) {
						this.switchToTab(index);
					}
				}
			}
		});
	}

	openFile(file: FileNode): void {
		if (!file.content) return;

		// Check if file already open
		const existingIndex = this.tabs.findIndex((tab) => tab.path === file.path);
		if (existingIndex !== -1) {
			this.switchToTab(existingIndex);
			return;
		}

		// Create Monaco model for this file
		const uri = this.monaco.Uri.parse(`file:///${file.path}`);
		const model = this.monaco.editor.createModel(
			file.content,
			"typescript",
			uri,
		);

		// Listen for content changes
		model.onDidChangeContent(() => {
			const tab = this.tabs.find((t) => t.model === model);
			if (tab) {
				tab.isDirty = model.getValue() !== tab.content;
				this.render();
			}
		});

		// Add new tab
		const newTab: Tab = {
			path: file.path,
			name: file.name,
			content: file.content,
			isDirty: false,
			model,
		};

		this.tabs.push(newTab);
		this.switchToTab(this.tabs.length - 1);
	}

	private switchToTab(index: number): void {
		if (index < 0 || index >= this.tabs.length) return;

		this.activeTabIndex = index;
		const tab = this.tabs[index];

		// Switch Monaco model
		this.editor.setModel(tab.model);

		this.render();

		// Notify listener
		if (this.onTabChange) {
			this.onTabChange(tab);
		}
	}

	private closeTab(index: number, event: Event): void {
		event.stopPropagation();

		if (index < 0 || index >= this.tabs.length) return;

		const tab = this.tabs[index];

		// Dispose Monaco model
		tab.model.dispose();

		// Remove tab
		this.tabs.splice(index, 1);

		// Update active tab index
		if (this.tabs.length === 0) {
			this.activeTabIndex = -1;
			this.editor.setModel(null);
			if (this.onTabChange) {
				this.onTabChange(null);
			}
		} else {
			if (this.activeTabIndex >= this.tabs.length) {
				this.activeTabIndex = this.tabs.length - 1;
			}
			this.switchToTab(this.activeTabIndex);
		}

		this.render();
	}

	private closeOtherTabs(keepIndex: number): void {
		const keepTab = this.tabs[keepIndex];

		// Dispose all other models
		for (let i = 0; i < this.tabs.length; i++) {
			if (i !== keepIndex) {
				this.tabs[i].model.dispose();
			}
		}

		// Keep only the specified tab
		this.tabs = [keepTab];
		this.activeTabIndex = 0;
		this.switchToTab(0);
	}

	private closeAllTabs(): void {
		// Dispose all models
		for (const tab of this.tabs) {
			tab.model.dispose();
		}

		this.tabs = [];
		this.activeTabIndex = -1;
		this.editor.setModel(null);

		if (this.onTabChange) {
			this.onTabChange(null);
		}

		this.render();
	}

	private showContextMenu(index: number, event: MouseEvent): void {
		event.preventDefault();

		// Remove any existing context menu
		const existing = document.getElementById("tab-context-menu");
		if (existing) {
			existing.remove();
		}

		// Create context menu
		const menu = document.createElement("div");
		menu.id = "tab-context-menu";
		menu.className = "tab-context-menu";
		menu.style.left = `${event.clientX}px`;
		menu.style.top = `${event.clientY}px`;

		const options = [
			{ label: "Close", action: () => this.closeTab(index, event) },
			{
				label: "Close Others",
				action: () => this.closeOtherTabs(index),
				disabled: this.tabs.length === 1,
			},
			{ label: "Close All", action: () => this.closeAllTabs() },
		];

		for (const opt of options) {
			const item = document.createElement("div");
			item.className = "tab-context-menu-item";
			if (opt.disabled) {
				item.classList.add("disabled");
			}
			item.textContent = opt.label;
			item.addEventListener("click", (e) => {
				e.stopPropagation();
				if (!opt.disabled) {
					opt.action();
				}
				menu.remove();
			});
			menu.appendChild(item);
		}

		document.body.appendChild(menu);

		// Close menu on outside click
		const closeMenu = () => {
			menu.remove();
			document.removeEventListener("click", closeMenu);
		};
		setTimeout(() => document.addEventListener("click", closeMenu), 0);
	}

	getActiveTab(): Tab | null {
		return this.activeTabIndex >= 0 ? this.tabs[this.activeTabIndex] : null;
	}

	getAllTabs(): Tab[] {
		return this.tabs;
	}

	switchToTabByIndex(index: number): void {
		this.switchToTab(index);
	}

	private render(): void {
		this.container.innerHTML = "";

		if (this.tabs.length === 0) {
			const empty = document.createElement("div");
			empty.className = "editor-tabs-empty";
			empty.textContent = "No files open";
			this.container.appendChild(empty);
			return;
		}

		const tabBar = document.createElement("div");
		tabBar.className = "editor-tabs-bar";

		for (let i = 0; i < this.tabs.length; i++) {
			const tab = this.tabs[i];
			const tabEl = document.createElement("div");
			tabEl.className = "editor-tab";

			if (i === this.activeTabIndex) {
				tabEl.classList.add("active");
			}

			// Tab label
			const label = document.createElement("span");
			label.className = "editor-tab-label";
			label.textContent = tab.name;

			// Dirty indicator
			if (tab.isDirty) {
				const dot = document.createElement("span");
				dot.className = "editor-tab-dirty";
				dot.textContent = "●";
				label.appendChild(dot);
			}

			// Close button
			const closeBtn = document.createElement("button");
			closeBtn.className = "editor-tab-close";
			closeBtn.textContent = "×";
			closeBtn.addEventListener("click", (e) => this.closeTab(i, e));

			tabEl.appendChild(label);
			tabEl.appendChild(closeBtn);

			// Tab click
			tabEl.addEventListener("click", () => this.switchToTab(i));

			// Context menu
			tabEl.addEventListener("contextmenu", (e) => this.showContextMenu(i, e));

			tabBar.appendChild(tabEl);
		}

		this.container.appendChild(tabBar);
	}
}
