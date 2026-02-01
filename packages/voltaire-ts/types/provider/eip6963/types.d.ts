/**
 * EIP-6963 Multi Injected Provider Discovery Types
 *
 * Branded types for wallet provider information and details.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 * @module provider/eip6963/types
 */
import type { brand } from "../../brand.js";
import type { EIP1193Provider } from "../TypedProvider.js";
/**
 * Wallet provider metadata
 *
 * Contains identifying information about an EIP-1193 provider.
 * All instances are frozen and immutable.
 *
 * @example
 * ```typescript
 * const info: ProviderInfoType = EIP6963.ProviderInfo({
 *   uuid: "350670db-19fa-4704-a166-e52e178b59d2",
 *   name: "Example Wallet",
 *   icon: "data:image/svg+xml;base64,PHN2Zy...",
 *   rdns: "com.example.wallet"
 * });
 * ```
 */
export type ProviderInfoType = Readonly<{
    /** UUIDv4 unique to the wallet provider session */
    uuid: string;
    /** Human-readable wallet name */
    name: string;
    /** Data URI of wallet icon (>=96x96px). Render via `<img>` to prevent XSS. */
    icon: string;
    /** Reverse DNS identifier (e.g., "io.metamask") */
    rdns: string;
}> & {
    readonly [brand]: "ProviderInfo";
};
/**
 * Input type for ProviderInfo constructor
 */
export type ProviderInfoInput = {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
};
/**
 * Complete provider announcement
 *
 * Combines provider metadata with the actual EIP-1193 provider instance.
 * All instances are frozen and immutable.
 *
 * @example
 * ```typescript
 * const detail: ProviderDetailType = EIP6963.ProviderDetail({
 *   info: {
 *     uuid: "350670db-19fa-4704-a166-e52e178b59d2",
 *     name: "Example Wallet",
 *     icon: "data:image/svg+xml;base64,PHN2Zy...",
 *     rdns: "com.example.wallet"
 *   },
 *   provider: window.ethereum
 * });
 * ```
 */
export type ProviderDetailType = Readonly<{
    /** Provider metadata */
    info: ProviderInfoType;
    /** EIP-1193 provider instance */
    provider: EIP1193Provider;
}> & {
    readonly [brand]: "ProviderDetail";
};
/**
 * Input type for ProviderDetail constructor
 */
export type ProviderDetailInput = {
    info: ProviderInfoInput;
    provider: EIP1193Provider;
};
/**
 * Listener function for provider announcements
 */
export type ProviderListener = (providers: ProviderDetailType[]) => void;
/**
 * Platform detection result
 */
export type Platform = "browser" | "node" | "bun" | "worker" | "unknown";
//# sourceMappingURL=types.d.ts.map