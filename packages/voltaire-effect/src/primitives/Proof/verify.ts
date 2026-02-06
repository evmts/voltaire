import { Proof } from "@tevm/voltaire";
import * as Effect from "effect/Effect";

type ProofType = Proof.ProofType;
export type VerifyResult = { valid: boolean; error?: string };

export const verify = (proof: ProofType): Effect.Effect<VerifyResult, Error> =>
	Effect.try({
		try: () => Proof.verify(proof),
		catch: (e) => e as Error,
	});
