/**
 * BN254 WASM implementation
 * Uses native Zig BN254 implementation via WebAssembly
 */
export declare namespace Bn254Wasm {
    namespace G1 {
        function generator(): never;
        function infinity(): never;
        function add(): never;
        function double(): never;
        function negate(): never;
        function mul(): never;
        function isZero(): never;
        function isOnCurve(): never;
        function equal(): never;
        function toAffine(): never;
        function fromAffine(): never;
    }
    namespace G2 {
        function generator(): never;
        function infinity(): never;
        function add(): never;
        function double(): never;
        function negate(): never;
        function mul(): never;
        function isZero(): never;
        function isOnCurve(): never;
        function isInSubgroup(): never;
        function equal(): never;
        function toAffine(): never;
        function fromAffine(): never;
        function frobenius(): never;
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
export default Bn254Wasm;
//# sourceMappingURL=bn254.wasm.d.ts.map