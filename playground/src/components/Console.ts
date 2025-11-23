type LogLevel = "log" | "error" | "warn" | "info";

export class Console {
	private container: HTMLElement;
	private originalConsole: {
		log: typeof console.log;
		error: typeof console.error;
		warn: typeof console.warn;
		info: typeof console.info;
	};

	constructor(container: HTMLElement) {
		this.container = container;
		this.originalConsole = {
			log: console.log,
			error: console.error,
			warn: console.warn,
			info: console.info,
		};
	}

	clear(): void {
		this.container.innerHTML = "";
	}

	log(message: string, level: LogLevel = "log"): void {
		const entry = document.createElement("div");
		entry.className = `console-entry console-${level}`;
		entry.textContent = message;
		this.container.appendChild(entry);
		this.container.scrollTop = this.container.scrollHeight;
	}

	captureConsole(): () => void {
		const self = this;

		console.log = (...args: unknown[]) => {
			const message = args.map((arg) => self.stringify(arg)).join(" ");
			self.log(message, "log");
			self.originalConsole.log(...args);
		};

		console.error = (...args: unknown[]) => {
			const message = args.map((arg) => self.stringify(arg)).join(" ");
			self.log(message, "error");
			self.originalConsole.error(...args);
		};

		console.warn = (...args: unknown[]) => {
			const message = args.map((arg) => self.stringify(arg)).join(" ");
			self.log(message, "warn");
			self.originalConsole.warn(...args);
		};

		console.info = (...args: unknown[]) => {
			const message = args.map((arg) => self.stringify(arg)).join(" ");
			self.log(message, "info");
			self.originalConsole.info(...args);
		};

		// Return cleanup function
		return () => {
			console.log = self.originalConsole.log;
			console.error = self.originalConsole.error;
			console.warn = self.originalConsole.warn;
			console.info = self.originalConsole.info;
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
