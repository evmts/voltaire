/**
 * WASM implementation of PrivateKeySigner
 * Provides wallet/signer functionality using WASM Zig primitives
 */
export interface PrivateKeySignerOptions {
    privateKey: string | Uint8Array;
}
export interface Signer {
    address: string;
    privateKey: Uint8Array;
    publicKey: Uint8Array;
    signMessage(message: string | Uint8Array): Promise<string>;
    signTransaction(transaction: any): Promise<any>;
    signTypedData(typedData: any): Promise<string>;
}
export declare class PrivateKeySignerImpl implements Signer {
    readonly address: string;
    readonly privateKey: Uint8Array;
    readonly publicKey: Uint8Array;
    private constructor();
    static fromPrivateKey(options: PrivateKeySignerOptions): PrivateKeySignerImpl;
    signMessage(message: string | Uint8Array): Promise<string>;
    signTransaction(_transaction: any): Promise<any>;
    signTypedData(_typedData: any): Promise<string>;
}
export default PrivateKeySignerImpl;
//# sourceMappingURL=private-key-signer.d.ts.map