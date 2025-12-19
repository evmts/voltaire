import type { BlockType } from "../primitives/Block/BlockType.js";
import type { ChainIdType } from "../primitives/ChainId/ChainIdType.js";
import type { ReceiptType } from "../primitives/Receipt/ReceiptType.js";
import type { BlockIdType } from "./types/BlockIdType.js";
import type { BlockReaderType } from "./types/BlockReaderType.js";
import type { CommittedChainType } from "./types/CommittedChainType.js";
import type { StateReaderType } from "./types/StateReaderType.js";

/**
 * Notification type discriminator
 */
export type NotificationType = "commit" | "revert" | "reorg";

/**
 * Base context shared across all handlers
 */
export interface TevmPluginBaseContext<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> {
	/** Current head when TevmPlugin started */
	readonly head: BlockIdType;

	/** Chain ID */
	readonly chainId: ChainIdType;

	/** Read-only state access */
	readonly state: StateReaderType;

	/** Historical block access */
	readonly blocks: BlockReaderType<Block, Receipt>;

	/**
	 * Signal that processing is complete up to a block.
	 * @param blockId - Block to checkpoint at. Defaults to current notification's tip.
	 */
	checkpoint(blockId?: BlockIdType): void;

	/**
	 * Get a variable from context (set by middleware)
	 */
	get<K extends keyof TVariables>(key: K): TVariables[K];

	/**
	 * Set a variable on context (for downstream handlers)
	 */
	set<K extends keyof TVariables>(key: K, value: TVariables[K]): void;
}

/**
 * Context for onCommit handlers
 */
export interface CommitContext<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> extends TevmPluginBaseContext<TVariables, Block, Receipt> {
	readonly type: "commit";
	/** The committed chain */
	readonly chain: CommittedChainType<Block, Receipt>;
}

/**
 * Context for onRevert handlers
 */
export interface RevertContext<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> extends TevmPluginBaseContext<TVariables, Block, Receipt> {
	readonly type: "revert";
	/** The reverted chain */
	readonly chain: CommittedChainType<Block, Receipt>;
}

/**
 * Context for onReorg handlers
 */
export interface ReorgContext<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> extends TevmPluginBaseContext<TVariables, Block, Receipt> {
	readonly type: "reorg";
	/** The reverted chain */
	readonly reverted: CommittedChainType<Block, Receipt>;
	/** The newly committed chain */
	readonly committed: CommittedChainType<Block, Receipt>;
}

/**
 * Union of all context types
 */
export type TevmPluginHandlerContext<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> =
	| CommitContext<TVariables, Block, Receipt>
	| RevertContext<TVariables, Block, Receipt>
	| ReorgContext<TVariables, Block, Receipt>;

/**
 * Handler function signature (Hono-style with next)
 */
export type TevmPluginHandler<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> = (
	ctx: TevmPluginHandlerContext<TVariables, Block, Receipt>,
	next: () => Promise<void>,
) => Promise<void>;

/**
 * Commit-specific handler (no next, runs at end of chain)
 */
export type CommitHandler<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> = (ctx: CommitContext<TVariables, Block, Receipt>) => Promise<void>;

/**
 * Revert-specific handler
 */
export type RevertHandler<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> = (ctx: RevertContext<TVariables, Block, Receipt>) => Promise<void>;

/**
 * Reorg-specific handler
 */
export type ReorgHandler<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> = (ctx: ReorgContext<TVariables, Block, Receipt>) => Promise<void>;

/**
 * Middleware function (runs for all notification types)
 */
export type TevmPluginMiddleware<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> = (
	ctx: TevmPluginHandlerContext<TVariables, Block, Receipt>,
	next: () => Promise<void>,
) => Promise<void>;

/**
 * Factory helper to create typed middleware
 */
export function createMiddleware<TVariables = {}>(
	fn: TevmPluginMiddleware<TVariables>,
): TevmPluginMiddleware<TVariables> {
	return fn;
}

/**
 * Internal context implementation
 */
export class TevmPluginHandlerContextImpl<TVariables = {}> {
	private variables: Map<string | symbol, unknown> = new Map();
	private _checkpoint: BlockIdType | null = null;

	constructor(
		public readonly type: NotificationType,
		public readonly head: BlockIdType,
		public readonly chainId: ChainIdType,
		public readonly state: StateReaderType,
		public readonly blocks: BlockReaderType<unknown, unknown>,
		public readonly chain?: CommittedChainType<unknown, unknown>,
		public readonly reverted?: CommittedChainType<unknown, unknown>,
		public readonly committed?: CommittedChainType<unknown, unknown>,
		private readonly defaultTip?: BlockIdType,
	) {}

	checkpoint(blockId?: BlockIdType): void {
		this._checkpoint = blockId ?? this.defaultTip ?? null;
	}

	getCheckpoint(): BlockIdType | null {
		return this._checkpoint;
	}

	get<K extends keyof TVariables>(key: K): TVariables[K] {
		return this.variables.get(key as string) as TVariables[K];
	}

	set<K extends keyof TVariables>(key: K, value: TVariables[K]): void {
		this.variables.set(key as string, value);
	}
}
