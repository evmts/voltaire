/**
 * API Mode Toggle - Switch between Regular, WASM, Native, Swift, and Zig execution modes
 */

export type ApiMode = "regular" | "wasm" | "native" | "swift" | "zig";

export interface ApiModeToggleOptions {
	onChange?: (mode: ApiMode) => void;
}

const STORAGE_KEY = "voltaire-playground-api-mode";

export class ApiModeToggle {
	private container: HTMLElement;
	private mode: ApiMode = "regular";
	private onChange?: (mode: ApiMode) => void;
	private buttons: Map<ApiMode, HTMLButtonElement> = new Map();

	constructor(container: HTMLElement, options: ApiModeToggleOptions = {}) {
		this.container = container;
		this.onChange = options.onChange;
		this.mode = this.loadMode();
		this.render();
	}

	private loadMode(): ApiMode {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (
			saved === "regular" ||
			saved === "wasm" ||
			saved === "native" ||
			saved === "swift" ||
			saved === "zig"
		) {
			return saved;
		}
		return "regular";
	}

	private saveMode(mode: ApiMode): void {
		localStorage.setItem(STORAGE_KEY, mode);
	}

	private render(): void {
		this.container.className = "api-mode-toggle";
		this.container.innerHTML = "";

		const label = document.createElement("span");
		label.className = "api-mode-label";
		label.textContent = "API:";
		this.container.appendChild(label);

		const modes: { mode: ApiMode; label: string; tooltip: string }[] = [
			{
				mode: "regular",
				label: "TS",
				tooltip: "TypeScript API - Full API with automatic backend selection",
			},
			{
				mode: "wasm",
				label: "WASM",
				tooltip: "WebAssembly API - Browser-native, synchronous operations",
			},
			{
				mode: "native",
				label: "Native",
				tooltip: "Native FFI - Bun only, not available in browser",
			},
			{
				mode: "swift",
				label: "Swift",
				tooltip: "Swift API - Not available in browser",
			},
			{
				mode: "zig",
				label: "Zig",
				tooltip: "Zig API - Not available in browser",
			},
		];

		const buttonGroup = document.createElement("div");
		buttonGroup.className = "api-mode-buttons";

		for (const { mode, label, tooltip } of modes) {
			const button = document.createElement("button");
			button.className = `api-mode-btn${this.mode === mode ? " active" : ""}`;
			button.textContent = label;
			button.title = tooltip;
			button.dataset.mode = mode;

			if (mode === "native") {
				button.classList.add("native-mode");
			} else if (mode === "swift") {
				button.classList.add("swift-mode");
			} else if (mode === "zig") {
				button.classList.add("zig-mode");
			}

			button.addEventListener("click", () => this.setMode(mode));
			buttonGroup.appendChild(button);
			this.buttons.set(mode, button);
		}

		this.container.appendChild(buttonGroup);
	}

	setMode(mode: ApiMode): void {
		if (this.mode === mode) return;

		this.mode = mode;
		this.saveMode(mode);

		// Update button states
		for (const [m, button] of this.buttons) {
			button.classList.toggle("active", m === mode);
		}

		this.onChange?.(mode);
	}

	getMode(): ApiMode {
		return this.mode;
	}

	isNativeMode(): boolean {
		return this.mode === "native";
	}

	isWasmMode(): boolean {
		return this.mode === "wasm";
	}

	isSwiftMode(): boolean {
		return this.mode === "swift";
	}

	isZigMode(): boolean {
		return this.mode === "zig";
	}

	isUnsupportedInBrowser(): boolean {
		return (
			this.mode === "native" || this.mode === "swift" || this.mode === "zig"
		);
	}
}
