import { VirtualConsole } from "../features/VirtualConsole.js";

type LogLevel = "log" | "error" | "warn" | "info";
type FilterLevel = "all" | LogLevel;

interface LogEntry {
	timestamp: Date;
	message: string;
	level: LogLevel;
}

export class Console {
	private container: HTMLElement;
	private headerEl: HTMLElement | null;
	private virtualConsole: VirtualConsole;
	private activeFilter: FilterLevel = "all";
	private filterSelect: HTMLSelectElement | null = null;
	private originalConsole: {
		log: typeof console.log;
		error: typeof console.error;
		warn: typeof console.warn;
		info: typeof console.info;
	};

	constructor(container: HTMLElement) {
		this.container = container;
		this.virtualConsole = new VirtualConsole(container);
		this.originalConsole = {
			log: console.log,
			error: console.error,
			warn: console.warn,
			info: console.info,
		};
		this.headerEl = this.findHeaderElement();
		this.loadFilterPreference();
		this.initializeHeader();
	}

	private loadFilterPreference(): void {
		const saved = localStorage.getItem("voltaire-console-filter");
		if (saved && ["all", "log", "error", "warn", "info"].includes(saved)) {
			this.activeFilter = saved as FilterLevel;
		}
	}

	private saveFilterPreference(): void {
		localStorage.setItem("voltaire-console-filter", this.activeFilter);
	}

	private getLogCounts(): Record<LogLevel | "all", number> {
		const entries = this.virtualConsole.getEntries();
		const counts = {
			all: entries.length,
			log: 0,
			error: 0,
			warn: 0,
			info: 0,
		};

		for (const entry of entries) {
			counts[entry.level]++;
		}

		return counts;
	}

	private findHeaderElement(): HTMLElement | null {
		// Navigate up from console-content to console div, then find header
		let parent = this.container.parentElement;
		while (parent && parent.id !== "console") {
			parent = parent.parentElement;
		}
		return parent?.querySelector("#console-header") as HTMLElement | null;
	}

	private initializeHeader(): void {
		if (!this.headerEl) return;

		// Create filter dropdown
		this.filterSelect = document.createElement("select");
		this.filterSelect.className = "console-filter";
		this.filterSelect.title = "Filter by log level";
		this.updateFilterOptions();
		this.filterSelect.value = this.activeFilter;
		this.filterSelect.onchange = () => {
			this.activeFilter = this.filterSelect?.value as FilterLevel;
			this.saveFilterPreference();
			this.render();
		};

		// Create button container
		const buttonContainer = document.createElement("div");
		buttonContainer.className = "console-header-buttons";

		// Clear button
		const clearBtn = document.createElement("button");
		clearBtn.className = "console-button";
		clearBtn.title = "Clear console";
		clearBtn.innerHTML = "🗑️";
		clearBtn.onclick = () => this.clear();

		// Copy all button
		const copyAllBtn = document.createElement("button");
		copyAllBtn.className = "console-button";
		copyAllBtn.title = "Copy all output";
		copyAllBtn.innerHTML = "📋";
		copyAllBtn.onclick = () => this.copyAll();

		buttonContainer.appendChild(clearBtn);
		buttonContainer.appendChild(copyAllBtn);

		// Update header to be flex container
		this.headerEl.style.display = "flex";
		this.headerEl.style.justifyContent = "space-between";
		this.headerEl.style.alignItems = "center";

		// Add filter and buttons to header
		this.headerEl.appendChild(this.filterSelect);
		this.headerEl.appendChild(buttonContainer);
	}

	private updateFilterOptions(): void {
		if (!this.filterSelect) return;

		const counts = this.getLogCounts();
		const options: Array<{ value: FilterLevel; label: string }> = [
			{ value: "all", label: `All (${counts.all})` },
			{ value: "log", label: `Log (${counts.log})` },
			{ value: "warn", label: `Warn (${counts.warn})` },
			{ value: "error", label: `Error (${counts.error})` },
			{ value: "info", label: `Info (${counts.info})` },
		];

		this.filterSelect.innerHTML = "";
		for (const opt of options) {
			const optionEl = document.createElement("option");
			optionEl.value = opt.value;
			optionEl.textContent = opt.label;
			this.filterSelect.appendChild(optionEl);
		}
		this.filterSelect.value = this.activeFilter;
	}

	clear(): void {
		this.virtualConsole.clear();
		this.updateFilterOptions();
	}

	private render(): void {
		this.updateFilterOptions();
		this.virtualConsole.setFilter(this.activeFilter);
		this.virtualConsole.forceRender();
	}

	private formatTimestamp(date: Date): string {
		const h = date.getHours().toString().padStart(2, "0");
		const m = date.getMinutes().toString().padStart(2, "0");
		const s = date.getSeconds().toString().padStart(2, "0");
		const ms = date.getMilliseconds().toString().padStart(3, "0");
		return `${h}:${m}:${s}.${ms}`;
	}

	log(message: string, level: LogLevel = "log"): void {
		const entry: LogEntry = {
			timestamp: new Date(),
			message,
			level,
		};
		this.virtualConsole.addEntry(entry);
		this.updateFilterOptions();
	}

	private copyAll(): void {
		const entries = this.virtualConsole.getEntries();
		const allText = entries
			.map((e) => `[${this.formatTimestamp(e.timestamp)}] ${e.message}`)
			.join("\n");
		navigator.clipboard.writeText(allText).catch((_err) => {});
	}

	captureConsole(): () => void {
		console.log = (...args: unknown[]) => {
			const message = args.map((arg) => this.stringify(arg)).join(" ");
			this.log(message, "log");
			this.originalConsole.log(...args);
		};

		console.error = (...args: unknown[]) => {
			const message = args.map((arg) => this.stringify(arg)).join(" ");
			this.log(message, "error");
			this.originalConsole.error(...args);
		};

		console.warn = (...args: unknown[]) => {
			const message = args.map((arg) => this.stringify(arg)).join(" ");
			this.log(message, "warn");
			this.originalConsole.warn(...args);
		};

		console.info = (...args: unknown[]) => {
			const message = args.map((arg) => this.stringify(arg)).join(" ");
			this.log(message, "info");
			this.originalConsole.info(...args);
		};

		// Return cleanup function
		return () => {
			console.log = this.originalConsole.log;
			console.error = this.originalConsole.error;
			console.warn = this.originalConsole.warn;
			console.info = this.originalConsole.info;
		};
	}

	private stringify(value: unknown): string {
		if (value === null) return "null";
		if (value === undefined) return "undefined";
		if (typeof value === "string") return value;
		if (typeof value === "number" || typeof value === "boolean")
			return String(value);
		if (value instanceof Uint8Array) {
			return `Uint8Array(${value.length}) [${Array.from(value.slice(0, 32))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join(" ")}${value.length > 32 ? "..." : ""}]`;
		}
		if (value instanceof Error) {
			return `${value.name}: ${value.message}\n${value.stack || ""}`;
		}
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}
}
