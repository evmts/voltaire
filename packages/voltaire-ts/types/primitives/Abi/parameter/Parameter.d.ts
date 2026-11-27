/**
 * @typedef {import('./ParameterType.js').ParameterType} ParameterType
 * @typedef {ParameterType | { type: string; name?: string; internalType?: string; indexed?: boolean; components?: readonly unknown[] }} ParameterInput
 */
/**
 * Factory function for creating Parameter instances
 * @param {ParameterInput} param
 * @returns {ParameterType}
 */
export function Parameter(param: ParameterInput): ParameterType;
export class Parameter {
    /**
     * @typedef {import('./ParameterType.js').ParameterType} ParameterType
     * @typedef {ParameterType | { type: string; name?: string; internalType?: string; indexed?: boolean; components?: readonly unknown[] }} ParameterInput
     */
    /**
     * Factory function for creating Parameter instances
     * @param {ParameterInput} param
     * @returns {ParameterType}
     */
    constructor(param: ParameterInput);
    encode(value: unknown): Uint8Array<ArrayBufferLike>;
    decode(data: Uint8Array): unknown;
    toString(this: import("./ParameterType.js").ParameterType<import("../Type.js").AbiType, string, string>): string;
}
export namespace Parameter {
    /**
     * @param {ParameterInput} param
     * @returns {ParameterType}
     */
    export function from(param: ParameterInput): ParameterType;
    export { encode };
    export { decode };
}
export type ParameterType = import("./ParameterType.js").ParameterType;
export type ParameterInput = ParameterType | {
    type: string;
    name?: string;
    internalType?: string;
    indexed?: boolean;
    components?: readonly unknown[];
};
import { encode } from "./encode.js";
import { decode } from "./decode.js";
//# sourceMappingURL=Parameter.d.ts.map