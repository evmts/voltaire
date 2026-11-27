import type { HexType } from "../Hex/HexType.js";
type Hex = `0x${string}`;
export type Unwrapped = {
    authorization: {
        address: Hex;
        chainId: number;
        nonce: bigint;
        yParity: number;
        r: bigint;
        s: bigint;
    };
    to?: Hex;
    data?: Hex;
    signature: Hex;
};
/** Detects the ERC-8010 magic suffix. Use unwrap to parse the envelope. */
export declare function validate(signature: Hex): boolean;
/** Parses the signature and the EIP-7702 authorization from an ERC-8010 envelope. */
export declare function unwrap(wrapped: Hex): Unwrapped;
/** Wraps a signature with its EIP-7702 authorization and optional initializer. */
export declare function wrap({ authorization, data, signature, to, }: Unwrapped): HexType;
export {};
//# sourceMappingURL=index.d.ts.map