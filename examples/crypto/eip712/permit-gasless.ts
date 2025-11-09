/**
 * EIP-712 Permit (ERC-2612) - Gasless Approvals
 *
 * Demonstrates:
 * - ERC-2612 Permit typed data structure
 * - Gasless token approvals via signatures
 * - Meta-transaction pattern
 * - Nonce management
 * - Deadline handling
 */

import * as EIP712 from "../../../src/crypto/Eip712/index.js";
import * as Address from "../../../src/primitives/Address/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Simulate token contract
const USDC_ADDRESS = Address.fromHex(
	"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
);
const OWNER_PRIVATE_KEY = new Uint8Array(32);
crypto.getRandomValues(OWNER_PRIVATE_KEY);

const SPENDER_ADDRESS = Address.fromHex(
	"0x1234567890123456789012345678901234567890",
);

const permit = {
	domain: {
		name: "USD Coin",
		version: "2",
		chainId: 1n,
		verifyingContract: USDC_ADDRESS,
	},
	types: {
		Permit: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		],
	},
	primaryType: "Permit",
	message: {
		owner: EIP712.recoverAddress(
			EIP712.signTypedData(
				{
					domain: permit.domain,
					types: permit.types,
					primaryType: "Permit",
					message: {} as any,
				},
				OWNER_PRIVATE_KEY,
			),
			{
				domain: permit.domain,
				types: permit.types,
				primaryType: "Permit",
				message: {} as any,
			},
		),
		spender: SPENDER_ADDRESS,
		value: 1000000n, // 1 USDC (6 decimals)
		nonce: 0n,
		deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
	},
};

const signature = EIP712.signTypedData(permit, OWNER_PRIVATE_KEY);

const recoveredOwner = EIP712.recoverAddress(signature, permit);

const isValid = EIP712.verifyTypedData(signature, permit, permit.message.owner);

for (let nonce = 0n; nonce < 3n; nonce++) {
	const noncePermit = {
		...permit,
		message: {
			...permit.message,
			nonce,
		},
	};

	const sig = EIP712.signTypedData(noncePermit, OWNER_PRIVATE_KEY);
	const hash = EIP712.hashTypedData(noncePermit);
}

const now = BigInt(Math.floor(Date.now() / 1000));

const validPermit = {
	...permit,
	message: {
		...permit.message,
		deadline: now + 3600n, // 1 hour from now
	},
};

const expiredPermit = {
	...permit,
	message: {
		...permit.message,
		nonce: 1n,
		deadline: now - 3600n, // 1 hour ago (expired)
	},
};

const amounts = [
	{ value: 1_000000n, desc: "1 USDC" },
	{ value: 100_000000n, desc: "100 USDC" },
	{
		value:
			115792089237316195423570985008687907853269984665640564039457584007913129639935n,
		desc: "MAX_UINT256 (unlimited)",
	},
];

for (const { value, desc } of amounts) {
	const amountPermit = {
		...permit,
		message: {
			...permit.message,
			value,
			nonce: value === 1_000000n ? 10n : value === 100_000000n ? 11n : 12n,
		},
	};

	const sig = EIP712.signTypedData(amountPermit, OWNER_PRIVATE_KEY);
}

const daiPermit = {
	domain: {
		name: "Dai Stablecoin",
		version: "1",
		chainId: 1n,
		verifyingContract: Address.fromHex(
			"0x6B175474E89094C44Da98b954EedeAC495271d0F",
		),
	},
	types: permit.types,
	primaryType: permit.primaryType,
	message: permit.message,
};

const usdcHash = EIP712.hashTypedData(permit);
const daiHash = EIP712.hashTypedData(daiPermit);
