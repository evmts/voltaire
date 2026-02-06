/**
 * Factory function for creating Parameter instances
 */
export function Parameter(param: any): import("./ParameterType.js").ParameterType<import("../Type.js").AbiType, string, string>;
export class Parameter {
    /**
     * Factory function for creating Parameter instances
     */
    constructor(param: any);
    encode: (thisArg: unknown, ...args: any[]) => unknown;
    decode: (thisArg: unknown, ...args: any[]) => unknown;
    toString(): string;
}
export namespace Parameter {
    export function from(param: any): import("./ParameterType.js").ParameterType<import("../Type.js").AbiType, string, string>;
    export { encode };
    export { decode };
}
import { encode } from "./encode.js";
import { decode } from "./decode.js";
//# sourceMappingURL=Parameter.d.ts.map