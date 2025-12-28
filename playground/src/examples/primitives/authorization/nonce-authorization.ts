import { Address, Authorization } from "voltaire";

const delegate = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const privateKey = new Uint8Array(32).fill(1);

// Create authorizations with sequential nonces
const auths = [];
for (let i = 0; i < 5; i++) {
	const auth = Authorization.sign(
		{
			chainId: 1n,
			address: delegate,
			nonce: BigInt(i),
		},
		privateKey,
	);
	auths.push(auth);
}

// Display nonce sequence
auths.forEach((auth, i) => {
	const signer = Authorization.verify(auth);
});

// Large nonce values
const largeNonce = Authorization.sign(
	{
		chainId: 1n,
		address: delegate,
		nonce: 999999999999n,
	},
	privateKey,
);

// Maximum nonce value
const maxNonce = 2n ** 64n - 1n;
const maxNonceAuth = Authorization.sign(
	{
		chainId: 1n,
		address: delegate,
		nonce: maxNonce,
	},
	privateKey,
);
try {
	Authorization.validate(maxNonceAuth);
} catch (error) {}
const auth1 = auths[0];
const auth2 = auths[1];
const auth3 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate,
		nonce: 0n, // Same nonce as auth1
	},
	privateKey,
);
