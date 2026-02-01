/**
 * Factory function for creating Abi instances
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {readonly import('./AbiType.js').Item[]} items - ABI items
 * @returns {import('./AbiConstructor.js').Abi} Abi instance
 * @throws {never}
 * @example
 * ```javascript
 * import { Abi } from './primitives/Abi/index.js';
 * const abi = Abi([
 *   { type: 'function', name: 'transfer', inputs: [...], outputs: [...] }
 * ]);
 * ```
 */
export function Abi(items: readonly import("./AbiType.js").Item[]): import("./AbiConstructor.js").Abi;
export class Abi {
    /**
     * Factory function for creating Abi instances
     *
     * @see https://voltaire.tevm.sh/primitives/abi
     * @since 0.0.0
     * @param {readonly import('./AbiType.js').Item[]} items - ABI items
     * @returns {import('./AbiConstructor.js').Abi} Abi instance
     * @throws {never}
     * @example
     * ```javascript
     * import { Abi } from './primitives/Abi/index.js';
     * const abi = Abi([
     *   { type: 'function', name: 'transfer', inputs: [...], outputs: [...] }
     * ]);
     * ```
     */
    constructor(items: readonly import("./AbiType.js").Item[]);
    /** @param {string} name @param {"function" | "event" | "constructor" | "error" | "fallback" | "receive"} [type] */
    getItem(name: string, type?: "function" | "event" | "constructor" | "error" | "fallback" | "receive"): any;
    format(): any;
    /** @param {Record<string, unknown[]>} args */
    formatWithArgs(args: Record<string, unknown[]>): any;
    /** @param {string} functionName @param {unknown[]} args */
    encode(functionName: string, args: unknown[]): Uint8Array<ArrayBufferLike>;
    /** @param {string} functionName @param {Uint8Array} data */
    decode(functionName: string, data: Uint8Array): readonly unknown[];
    /** @param {Uint8Array} data */
    decodeData(data: Uint8Array): {
        functionName: string;
        args: readonly unknown[];
    };
    /** @param {readonly { data: string | Uint8Array; topics: readonly (string | Uint8Array)[] }[]} logs */
    parseLogs(logs: readonly {
        data: string | Uint8Array;
        topics: readonly (string | Uint8Array)[];
    }[]): readonly {
        eventName: string;
        args: Record<string, unknown>;
    }[];
    /** @param {string} name */
    getFunction(name: string): any;
    /** @param {string} name */
    getEvent(name: string): any;
    /** @param {string} name */
    getError(name: string): any;
    getConstructor(): any;
    getFallback(): any;
    getReceive(): any;
    findSelectorCollisions(): import("./findSelectorCollisions.js").SelectorCollision[];
    hasSelectorCollisions(): boolean;
    toString(): string;
}
export namespace Abi {
    /** @param {readonly import('./Item/ItemType.js').ItemType[]} items */
    export function from(items: readonly import("./Item/ItemType.js").ItemType[]): any;
    export { getItem };
    export { format };
    export { formatWithArgs };
    export { encode };
    export { decode };
    export { decodeData };
    export { parseLogs };
    export { findSelectorCollisions };
    export { hasSelectorCollisions };
    export { encodeParameters };
    export { decodeParameters };
    export { Parameters };
    export { DecodeParameters };
    export let Function: typeof FunctionNs.Function;
    export let Event: {
        getSignature: typeof EventNs.getSignature;
        getSelector: (event: any) => import("../Hash/HashType.js").HashType;
        encodeTopics: (event: any, args: any) => (import("../Hash/HashType.js").HashType | null)[];
        decodeLog: typeof EventNs.decodeLog;
        Signature: typeof EventNs.getSignature;
        Topics: (event: any, args: any) => (import("../Hash/HashType.js").HashType | null)[];
        DecodeLog: typeof EventNs.decodeLog;
        GetSelector: typeof EventNs.GetSelector;
        EncodeTopics: typeof EventNs.EncodeTopics;
    };
    export let Error: {
        getSignature: typeof ErrorNs.getSignature;
        getSelector: (error: any) => Uint8Array;
        encodeParams: typeof ErrorNs.encodeParams;
        decodeParams: typeof ErrorNs.decodeParams;
        GetSelector: typeof ErrorNs.GetSelector;
    };
    export { ConstructorNs as Constructor };
    export { ItemNs as Item };
    export { Parameter };
}
import { getItem } from "./getItem.js";
import { format } from "./format.js";
import { formatWithArgs } from "./formatWithArgs.js";
import { encode } from "./encode.js";
import { decode } from "./decode.js";
import { decodeData } from "./decodeData.js";
import { parseLogs } from "./parseLogs.js";
import { findSelectorCollisions } from "./findSelectorCollisions.js";
import { hasSelectorCollisions } from "./findSelectorCollisions.js";
import { encodeParameters } from "./Encoding.js";
import { decodeParameters } from "./Encoding.js";
import { Parameters } from "./Encoding.js";
import { DecodeParameters } from "./Encoding.js";
import * as FunctionNs from "./function/index.js";
import * as EventNs from "./event/index.js";
import * as ErrorNs from "./error/index.js";
import * as ConstructorNs from "./constructor/index.js";
import * as ItemNs from "./Item/index.js";
import { Parameter } from "./parameter/index.js";
//# sourceMappingURL=Abi.d.ts.map