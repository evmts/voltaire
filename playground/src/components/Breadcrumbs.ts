/**
 * @typedef {Object} BreadcrumbSegment
 * @property {string} label - Display text
 * @property {string} path - Full path up to this segment
 * @property {boolean} isFile - Whether this is a file segment
 */

export class Breadcrumbs {
	private container: HTMLElement;
	private editor: any;
	private monaco: any;
	private onNavigate: ((path: string) => void) | null = null;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	/**
	 * Initialize with editor reference for symbol breadcrumbs
	 * @param {any} editor - Monaco editor instance
	 * @param {any} monaco - Monaco API
	 */
	setEditor(editor: any, monaco: any): void {
		this.editor = editor;
		this.monaco = monaco;

		// Update symbol breadcrumbs on cursor position change
		if (this.editor) {
			this.editor.onDidChangeCursorPosition(() => {
				this.updateSymbolBreadcrumbs();
			});
		}
	}

	/**
	 * Set navigation callback
	 * @param {(path: string) => void} callback
	 */
	setNavigationCallback(callback: (path: string) => void): void {
		this.onNavigate = callback;
	}

	/**
	 * Update breadcrumbs for current file
	 * @param {string} filePath - Current file path (e.g., "primitives/Address.ts")
	 */
	update(filePath: string): void {
		const segments = this.parseFilePath(filePath);
		this.render(segments);
		this.updateSymbolBreadcrumbs();
	}

	/**
	 * Parse file path into breadcrumb segments
	 * @param {string} filePath
	 * @returns {BreadcrumbSegment[]}
	 */
	private parseFilePath(filePath: string): Array<{
		label: string;
		path: string;
		isFile: boolean;
	}> {
		if (!filePath) return [];

		const parts = filePath.split("/");
		const segments: Array<{ label: string; path: string; isFile: boolean }> =
			[];

		for (let i = 0; i < parts.length; i++) {
			const label = parts[i];
			const path = parts.slice(0, i + 1).join("/");
			const isFile = i === parts.length - 1;

			segments.push({ label, path, isFile });
		}

		return segments;
	}

	/**
	 * Render breadcrumb trail
	 * @param {BreadcrumbSegment[]} segments
	 */
	private render(
		segments: Array<{ label: string; path: string; isFile: boolean }>,
	): void {
		this.container.innerHTML = "";

		if (segments.length === 0) {
			this.container.innerHTML =
				'<span class="breadcrumb-empty">Select a file to begin</span>';
			return;
		}

		const trail = document.createElement("div");
		trail.className = "breadcrumb-trail";

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];

			// Add separator
			if (i > 0) {
				const separator = document.createElement("span");
				separator.className = "breadcrumb-separator";
				separator.textContent = "/";
				trail.appendChild(separator);
			}

			// Add segment
			const el = document.createElement("span");
			el.className = segment.isFile
				? "breadcrumb-segment breadcrumb-file"
				: "breadcrumb-segment breadcrumb-folder";
			el.textContent = segment.label;
			el.dataset.path = segment.path;

			// Make folders clickable
			if (!segment.isFile && this.onNavigate) {
				el.classList.add("breadcrumb-clickable");
				el.addEventListener("click", () => {
					if (this.onNavigate) {
						this.onNavigate(segment.path);
					}
				});
			}

			trail.appendChild(el);
		}

		this.container.appendChild(trail);
	}

	/**
	 * Update symbol breadcrumbs based on cursor position
	 */
	private updateSymbolBreadcrumbs(): void {
		if (!this.editor || !this.monaco) return;

		// Clear existing symbol breadcrumbs
		const existing = this.container.querySelector(".breadcrumb-symbols");
		if (existing) {
			existing.remove();
		}

		const model = this.editor.getModel();
		if (!model) return;

		const position = this.editor.getPosition();
		if (!position) return;

		// Get language ID
		const languageId = model.getLanguageId();
		if (languageId !== "typescript" && languageId !== "javascript") {
			return; // Only support TS/JS for now
		}

		// Parse symbols at current position
		const symbols = this.findSymbolsAtPosition(model, position);
		if (symbols.length === 0) return;

		// Render symbol breadcrumbs
		const symbolsContainer = document.createElement("div");
		symbolsContainer.className = "breadcrumb-symbols";

		for (let i = 0; i < symbols.length; i++) {
			if (i > 0) {
				const separator = document.createElement("span");
				separator.className = "breadcrumb-separator";
				separator.textContent = "›";
				symbolsContainer.appendChild(separator);
			}

			const el = document.createElement("span");
			el.className = "breadcrumb-symbol";
			el.textContent = symbols[i];
			symbolsContainer.appendChild(el);
		}

		this.container.appendChild(symbolsContainer);
	}

	/**
	 * Find symbols at cursor position (function/class names)
	 * @param {any} model - Monaco text model
	 * @param {any} position - Cursor position
	 * @returns {string[]} Symbol names
	 */
	private findSymbolsAtPosition(model: any, position: any): string[] {
		const content = model.getValue();
		const offset = model.getOffsetAt(position);

		// Simple regex-based parsing for function/class names
		// This is a basic implementation - full AST parsing would be more accurate
		const lines = content.substring(0, offset).split("\n");
		const symbols: string[] = [];

		// Look for function/class declarations
		for (const line of lines) {
			// Match: function name(...) or const name = (...) =>
			const funcMatch = line.match(
				/(?:function|const|let|var)\s+(\w+)(?:\s*=|\s*\()/,
			);
			if (funcMatch) {
				symbols.push(funcMatch[1]);
			}

			// Match: class Name
			const classMatch = line.match(/class\s+(\w+)/);
			if (classMatch) {
				symbols.push(classMatch[1]);
			}
		}

		// Return only the most recent symbol (current scope)
		return symbols.length > 0 ? [symbols[symbols.length - 1]] : [];
	}

	/**
	 * Clear breadcrumbs
	 */
	clear(): void {
		this.container.innerHTML =
			'<span class="breadcrumb-empty">Select a file to begin</span>';
	}
}
