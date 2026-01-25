import type { Proof } from "@tevm/voltaire";

type ProofType = Proof.ProofType;

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const ProofTypeSchema = S.declare<ProofType>(
	(u): u is ProofType => {
		if (typeof u !== "object" || u === null) return false;
		const obj = u as ProofType;
		return (
			"value" in obj &&
			"proof" in obj &&
			obj.value instanceof Uint8Array &&
			Array.isArray(obj.proof)
		);
	},
	{ identifier: "Proof" },
);

export const Schema: S.Schema<ProofType, ProofType> = S.transformOrFail(
	ProofTypeSchema,
	ProofTypeSchema,
	{
		strict: true,
		decode: (t, _options, _ast) => ParseResult.succeed(t),
		encode: (t) => ParseResult.succeed(t),
	},
).annotations({ identifier: "ProofSchema" });

export type { ProofType };
