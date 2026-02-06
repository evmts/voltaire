import type { AbiType, Item } from "./AbiType.js";
import type * as AbiConstructorNs from "./constructor/index.js";
import type * as AbiError from "./error/index.js";
import type * as AbiEvent from "./event/index.js";
import type * as AbiFunction from "./function/index.js";
/**
 * Abi class interface
 *
 * Array-like class for working with contract ABIs, extending Array with ABI-specific methods
 */
export interface Abi<TItems extends readonly Item[] = readonly Item[]> extends Array<TItems[number]> {
    getItem(name: string, type: "function" | "event" | "error"): Item | undefined;
    format(): string[];
    formatWithArgs(args: Record<string, any>): string[];
    encode(functionName: string, args: any[]): Uint8Array;
    decode(functionName: string, data: Uint8Array): any[];
    decodeData(data: Uint8Array): {
        item: Item;
        decoded: any[];
    };
    parseLogs(logs: any[]): any[];
    getFunction(name: string): AbiFunction.FunctionType | undefined;
    getEvent(name: string): import("./event/EventType.js").EventType | undefined;
    getError(name: string): AbiError.ErrorType | undefined;
    getConstructor(): AbiConstructorNs.ConstructorType | undefined;
    getFallback(): any;
    getReceive(): any;
}
/**
 * Abi constructor interface
 */
export interface AbiConstructor {
    /**
     * Create Abi from items array
     */
    (items: readonly Item[]): Abi;
    /**
     * Create Abi from items array
     */
    from(items: readonly Item[]): Abi;
    getItem(abi: AbiType, name: string, type: "function" | "event" | "error"): Item | undefined;
    format(abi: AbiType): string[];
    formatWithArgs(abi: AbiType, args: Record<string, any>): string[];
    encode(abi: AbiType, functionName: string, args: any[]): Uint8Array;
    decode(abi: AbiType, functionName: string, data: Uint8Array): any[];
    decodeData(abi: AbiType, data: Uint8Array): {
        item: Item;
        decoded: any[];
    };
    parseLogs(abi: AbiType, logs: any[]): any[];
    Function: typeof AbiFunction;
    Event: typeof AbiEvent;
    Error: typeof AbiError;
    Constructor: typeof AbiConstructorNs;
    prototype: Abi;
}
//# sourceMappingURL=AbiConstructor.d.ts.map