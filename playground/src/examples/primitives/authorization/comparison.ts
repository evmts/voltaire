import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

const delegate1 = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const delegate2 = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const privateKey = new Uint8Array(32).fill(1);

// Create base authorization
const auth1 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate1,
		nonce: 0n,
	},
	privateKey,
);

// Create identical authorization
const auth2 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate1,
		nonce: 0n,
	},
	privateKey,
);

// Create different authorizations
const auth3 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate2, // Different delegate
		nonce: 0n,
	},
	privateKey,
);

const auth4 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate1,
		nonce: 1n, // Different nonce
	},
	privateKey,
);

const auth5 = Authorization.sign(
	{
		chainId: 2n, // Different chain
		address: delegate1,
		nonce: 0n,
	},
	privateKey,
);

const authList = [auth1, auth2, auth3, auth1, auth4, auth3];

const deduplicated = authList.filter(
	(auth, index) =>
		authList.findIndex((a) => Authorization.equalsAuth(a, auth)) === index,
);
deduplicated.forEach((auth, i) => {});
