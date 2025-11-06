import type { AbiType } from "../Type.js";
import type { BrandedParameter } from "./BrandedParameter/BrandedParameter.js";
import type { decode } from "./BrandedParameter/decode.js";
import type { encode } from "./BrandedParameter/encode.js";
import type { from } from "./BrandedParameter/from.js";

type ParameterPrototype<
	TType extends AbiType = AbiType,
	TName extends string = string,
	TInternalType extends string = string,
> = BrandedParameter<TType, TName, TInternalType> & {
	encode(this: BrandedParameter, value: unknown): ReturnType<typeof encode>;
	decode(this: BrandedParameter, data: Uint8Array): ReturnType<typeof decode>;
};

export interface ParameterConstructor {
	<
		TType extends AbiType = AbiType,
		TName extends string = string,
		TInternalType extends string = string,
	>(
		param:
			| BrandedParameter<TType, TName, TInternalType>
			| {
					type: TType;
					name?: TName;
					internalType?: TInternalType;
					indexed?: boolean;
					components?: readonly any[];
			  },
	): ParameterPrototype<TType, TName, TInternalType>;
	prototype: ParameterPrototype;
	from: typeof from;
	encode: typeof encode;
	decode: typeof decode;
}
