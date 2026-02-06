import type { DomainType } from "../Domain/DomainType.js";
/**
 * EIP-712 Typed Data field definition
 */
export type TypedDataField = {
    readonly name: string;
    readonly type: string;
};
/**
 * EIP-712 Typed Data structure
 *
 * Complete structure for EIP-712 typed structured data signing
 */
export type TypedDataType<T = Record<string, unknown>> = {
    readonly types: {
        readonly EIP712Domain: readonly TypedDataField[];
        readonly [key: string]: readonly TypedDataField[];
    };
    readonly primaryType: string;
    readonly domain: DomainType;
    readonly message: T;
};
//# sourceMappingURL=TypedDataType.d.ts.map