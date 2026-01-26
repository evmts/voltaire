import * as Effect from "effect/Effect";
import type { IpcSocket } from "../IpcTransport.js";

type Listener<T> = (event: T) => void;

type MockIpcSocketOptions = {
	onWrite?: (socket: MockIpcSocket, data: string | Uint8Array) => void;
	onEnd?: (socket: MockIpcSocket) => void;
};

export class MockIpcSocket implements IpcSocket {
	readonly index: number;
	private listeners = new Map<string, Set<Listener<any>>>();
	private options: MockIpcSocketOptions;

	constructor(index: number, options: MockIpcSocketOptions) {
		this.index = index;
		this.options = options;
	}

	on(event: "data", listener: Listener<Uint8Array | string>): this;
	on(event: "error", listener: Listener<Error>): this;
	on(event: "close", listener: Listener<void>): this;
	on(event: string, listener: Listener<any>): this {
		const set = this.listeners.get(event) ?? new Set();
		set.add(listener);
		this.listeners.set(event, set);
		return this;
	}

	off(event: "data", listener: Listener<Uint8Array | string>): this;
	off(event: "error", listener: Listener<Error>): this;
	off(event: "close", listener: Listener<void>): this;
	off(event: string, listener: Listener<any>): this {
		const set = this.listeners.get(event);
		if (!set) return this;
		set.delete(listener);
		if (set.size === 0) {
			this.listeners.delete(event);
		}
		return this;
	}

	write(
		chunk: string | Uint8Array,
		callback?: (err?: Error | null) => void,
	): boolean {
		this.options.onWrite?.(this, chunk);
		callback?.(null);
		return true;
	}

	end(callback?: () => void): void {
		this.emitClose();
		this.options.onEnd?.(this);
		callback?.();
	}

	emitData(data: string | Uint8Array) {
		this.emit("data", data);
	}

	emitMessage(message: unknown) {
		this.emitData(`${JSON.stringify(message)}\n`);
	}

	emitError(error: Error) {
		this.emit("error", error);
	}

	emitClose() {
		this.emit("close", undefined);
	}

	private emit(event: string, value: unknown) {
		const listeners = this.listeners.get(event);
		if (!listeners) return;
		for (const listener of [...listeners]) {
			listener(value);
		}
	}
}

export const makeMockIpcSocket = (options: MockIpcSocketOptions = {}) => {
	const sockets: MockIpcSocket[] = [];

	const socketFactory = (_path: string) =>
		Effect.sync(() => {
			const socket = new MockIpcSocket(sockets.length, options);
			sockets.push(socket);
			return socket;
		});

	return { socketFactory, sockets };
};
