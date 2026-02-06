/**
 * Test vectors for ABI encoding/decoding
 * Extracted from Zig implementation tests in abi_encoding.zig
 */
export interface EncodeTestVector {
    name: string;
    description: string;
    params: Array<{
        type: string;
        value: any;
    }>;
    expected: string;
    source: string;
}
export interface DecodeTestVector {
    name: string;
    description: string;
    encoded: string;
    types: string[];
    expected: any[];
    source: string;
}
export interface FunctionDataTestVector {
    name: string;
    description: string;
    signature: string;
    selector: string;
    params: Array<{
        type: string;
        value: any;
    }>;
    expectedCalldata: string;
    source: string;
}
export interface SelectorTestVector {
    name: string;
    signature: string;
    expected: string;
    source: string;
}
export interface ErrorTestVector {
    name: string;
    description: string;
    data: string;
    types: string[];
    expectedError: string;
    source: string;
}
export declare const selectorVectors: SelectorTestVector[];
export declare const encodeVectors: EncodeTestVector[];
export declare const roundTripVectors: Array<{
    name: string;
    description: string;
    params: Array<{
        type: string;
        value: any;
    }>;
    source: string;
}>;
export declare const crossValidationVectors: EncodeTestVector[];
export declare const boundaryVectors: EncodeTestVector[];
export declare const complexVectors: Array<{
    name: string;
    description: string;
    params: Array<{
        type: string;
        value: any;
    }>;
    source: string;
}>;
export declare const errorVectors: ErrorTestVector[];
export declare const functionDataVectors: FunctionDataTestVector[];
export declare const arrayVectors: Array<{
    name: string;
    description: string;
    params: Array<{
        type: string;
        value: any;
    }>;
    source: string;
}>;
export declare const securityVectors: ErrorTestVector[];
export declare function hexToBytes(hex: string): Uint8Array;
export declare function bytesToHex(bytes: Uint8Array): string;
//# sourceMappingURL=TestData.d.ts.map