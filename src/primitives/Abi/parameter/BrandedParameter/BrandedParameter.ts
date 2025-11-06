import type { AbiType } from "../../Type.js";

export type BrandedParameter<
	TType extends AbiType = AbiType,
	TName extends string = string,
	TInternalType extends string = string,
> = {
	readonly type: TType;
	readonly name?: TName;
	readonly internalType?: TInternalType;
	readonly indexed?: boolean;
	readonly components?: readonly BrandedParameter[];
	readonly __tag: "AbiParameter";
};
