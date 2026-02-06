/**
 * Factory function for creating Constructor instances
 * @template {import('../function/statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @param {Object} options
 * @param {'constructor'} [options.type]
 * @param {TStateMutability} options.stateMutability
 * @param {TInputs} options.inputs
 * @returns {import('./ConstructorType.js').ConstructorInstance<TStateMutability, TInputs>}
 */
export function Constructor<TStateMutability extends import("../function/statemutability.js").StateMutability, TInputs extends readonly import("../Parameter.js").Parameter[]>({ type, stateMutability, inputs }: {
    type?: "constructor" | undefined;
    stateMutability: TStateMutability;
    inputs: TInputs;
}): import("./ConstructorType.js").ConstructorInstance<TStateMutability, TInputs>;
export class Constructor<TStateMutability extends import("../function/statemutability.js").StateMutability, TInputs extends readonly import("../Parameter.js").Parameter[]> {
    /**
     * Factory function for creating Constructor instances
     * @template {import('../function/statemutability.js').StateMutability} TStateMutability
     * @template {readonly import('../Parameter.js').Parameter[]} TInputs
     * @param {Object} options
     * @param {'constructor'} [options.type]
     * @param {TStateMutability} options.stateMutability
     * @param {TInputs} options.inputs
     * @returns {import('./ConstructorType.js').ConstructorInstance<TStateMutability, TInputs>}
     */
    constructor({ type, stateMutability, inputs }: {
        type?: "constructor" | undefined;
        stateMutability: TStateMutability;
        inputs: TInputs;
    });
    /** @param {unknown[]} args */
    encodeParams(args: unknown[]): Uint8Array<ArrayBufferLike>;
    /** @param {Uint8Array} data */
    decodeParams(data: Uint8Array): any[];
    toString(): string;
}
export namespace Constructor {
    export { encodeParams };
    export { decodeParams };
}
import { encodeParams } from "./encodeParams.js";
import { decodeParams } from "./decodeParams.js";
//# sourceMappingURL=Constructor.d.ts.map