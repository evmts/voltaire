/**
 * BN254 Arkworks implementation
 * Uses Arkworks Rust library via WebAssembly for production performance
 */
export declare namespace Bn254Ark {
    namespace G1 {
        function mul(): never;
        function add(): never;
    }
    namespace G2 {
        function mul(): never;
        function add(): never;
    }
    namespace Fr {
        function add(): never;
        function mul(): never;
        function inv(): never;
    }
    namespace Pairing {
        function pair(): never;
        function pairingCheck(): never;
    }
}
export default Bn254Ark;
//# sourceMappingURL=bn254.ark.d.ts.map