import { Address, Authorization, Bytes, Bytes32 } from "@tevm/voltaire";

const delegate = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const privateKey = Bytes32.zero().fill(1);

const auth = Authorization.sign(
	{
		chainId: 1n,
		address: delegate,
		nonce: 0n,
	},
	privateKey,
);

const costExisting = Authorization.getGasCost(auth, false);
const costEmpty = Authorization.getGasCost(auth, true);

const scenarios = [
	{ count: 1, empty: 0 },
	{ count: 1, empty: 1 },
	{ count: 3, empty: 0 },
	{ count: 3, empty: 1 },
	{ count: 3, empty: 3 },
	{ count: 10, empty: 5 },
];

scenarios.forEach(({ count, empty }) => {
	const authList = Array.from({ length: count }, (_, i) =>
		Authorization.sign(
			{
				chainId: 1n,
				address: delegate,
				nonce: BigInt(i),
			},
			privateKey,
		),
	);

	const total = Authorization.calculateGasCost(authList, empty);
	const base = Authorization.PER_AUTH_BASE_COST * BigInt(count);
	const emptyGas = Authorization.PER_EMPTY_ACCOUNT_COST * BigInt(empty);
});

const costs = {
	single: Authorization.PER_AUTH_BASE_COST,
	singleEmpty:
		Authorization.PER_AUTH_BASE_COST + Authorization.PER_EMPTY_ACCOUNT_COST,
	batch10: Authorization.PER_AUTH_BASE_COST * 10n,
	batch10Empty:
		Authorization.PER_AUTH_BASE_COST * 10n +
		Authorization.PER_EMPTY_ACCOUNT_COST * 10n,
};

// Empty list
const emptyCost = Authorization.calculateGasCost([], 0);
