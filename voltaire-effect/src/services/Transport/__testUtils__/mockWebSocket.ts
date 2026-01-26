type Listener = {
	handler: (event: unknown) => void;
	once: boolean;
};

export type MockWebSocketOptions = {
	readyState?: number;
	autoOpen?: boolean | ((index: number) => boolean);
	getReadyState?: (index: number) => number;
	onSend?: (socket: MockWebSocket, data: string | Uint8Array) => void;
	onClose?: (
		socket: MockWebSocket,
		event: { code: number; reason: string },
	) => void;
	onError?: (socket: MockWebSocket, event: unknown) => void;
};

export class MockWebSocket {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;

	readonly url: string;
	readonly protocols?: string | string[];
	readyState: number;

	/** @internal */
	_listeners = new Map<string, Set<Listener>>();
	readonly index: number;
	/** @internal */
	readonly _options: MockWebSocketOptions;

	constructor(
		url: string,
		protocols: string | string[] | undefined,
		index: number,
		options: MockWebSocketOptions,
	) {
		this.url = url;
		this.protocols = protocols;
		this.index = index;
		this._options = options;
		const readyState =
			options.getReadyState?.(index) ??
			options.readyState ??
			MockWebSocket.OPEN;
		this.readyState = readyState;

		const autoOpen =
			typeof options.autoOpen === "function"
				? options.autoOpen(index)
				: (options.autoOpen ?? true);
		if (autoOpen) {
			queueMicrotask(() => this.emitOpen());
		}
	}

	addEventListener(
		type: string,
		handler: (event: unknown) => void,
		options?: { once?: boolean },
	) {
		const entry: Listener = { handler, once: options?.once ?? false };
		const listeners = this._listeners.get(type) ?? new Set<Listener>();
		listeners.add(entry);
		this._listeners.set(type, listeners);
	}

	removeEventListener(type: string, handler: (event: unknown) => void) {
		const listeners = this._listeners.get(type);
		if (!listeners) return;
		for (const listener of listeners) {
			if (listener.handler === handler) {
				listeners.delete(listener);
			}
		}
		if (listeners.size === 0) {
			this._listeners.delete(type);
		}
	}

	send(data: string | Uint8Array) {
		this._options.onSend?.(this, data);
	}

	close(code: number = 1000, reason: string = "") {
		this.readyState = MockWebSocket.CLOSED;
		this._emit("close", { code, reason });
		this._options.onClose?.(this, { code, reason });
	}

	emitOpen() {
		this.readyState = MockWebSocket.OPEN;
		this._emit("open", {});
	}

	emitMessage(data: string | Uint8Array) {
		this._emit("message", { data });
	}

	emitError(event: unknown) {
		this._emit("error", event);
		this._options.onError?.(this, event);
	}

	/** @internal */
	_emit(type: string, event: unknown) {
		const listeners = this._listeners.get(type);
		if (!listeners) return;
		for (const listener of [...listeners]) {
			listener.handler(event);
			if (listener.once) {
				listeners.delete(listener);
			}
		}
		if (listeners.size === 0) {
			this._listeners.delete(type);
		}
	}
}

export const makeMockWebSocket = (options: MockWebSocketOptions = {}) => {
	const sockets: MockWebSocket[] = [];
	class MockWebSocketConstructor extends MockWebSocket {
		static readonly CONNECTING = MockWebSocket.CONNECTING;
		static readonly OPEN = MockWebSocket.OPEN;
		static readonly CLOSING = MockWebSocket.CLOSING;
		static readonly CLOSED = MockWebSocket.CLOSED;

		constructor(url: string, protocols?: string | string[]) {
			super(url, protocols, sockets.length, options);
			sockets.push(this);
		}
	}

	return { MockWebSocket: MockWebSocketConstructor, sockets };
};
