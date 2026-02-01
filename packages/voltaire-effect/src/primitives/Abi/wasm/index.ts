import { encodePacked, encodeParameters, decodeParameters } from "@tevm/voltaire/Abi";
import { concat } from "@tevm/voltaire/Bytes";
import { keccak256String } from "@tevm/voltaire/Hash";

type Parameter = { type: string };

type ParametersToPrimitiveTypes<TParams extends readonly Parameter[]> = readonly unknown[];

export function encodeParametersWasm<const TParams extends readonly Parameter[]>(
	params: TParams,
	values: ParametersToPrimitiveTypes<TParams>,
): Uint8Array {
	return encodeParameters(params as any, values as any);
}

export function decodeParametersWasm<const TParams extends readonly Parameter[]>(
	params: TParams,
	data: Uint8Array,
): ParametersToPrimitiveTypes<TParams> {
	return decodeParameters(params as any, data) as ParametersToPrimitiveTypes<TParams>;
}

export function encodeFunctionDataWasm<const TParams extends readonly Parameter[]>(
	signature: string,
	params: TParams,
	values: ParametersToPrimitiveTypes<TParams>,
): Uint8Array {
	const selectorBytes = keccak256String(signature).slice(0, 4);
	const encoded = encodeParameters(params as any, values as any);
	return concat(selectorBytes, encoded);
}

export function decodeFunctionDataWasm<const TParams extends readonly Parameter[]>(
	_signature: string,
	params: TParams,
	data: Uint8Array,
): ParametersToPrimitiveTypes<TParams> {
	const paramsData = data.slice(4);
	return decodeParameters(params as any, paramsData) as ParametersToPrimitiveTypes<TParams>;
}

export function encodePackedWasm(
	types: readonly string[],
	values: readonly unknown[],
): Uint8Array {
	return encodePacked(types, values);
}

export { encodeParameters, decodeParameters };

export function isWasmAbiAvailable(): boolean {
	return false;
}

export function getImplementationStatus() {
	return {
		wasmAvailable: false,
		implemented: [
			"encodeParametersWasm",
			"decodeParametersWasm",
			"encodeFunctionDataWasm",
			"decodeFunctionDataWasm",
			"encodePackedWasm",
		],
		notImplemented: ["wasm-accelerated ABI"],
	};
}
