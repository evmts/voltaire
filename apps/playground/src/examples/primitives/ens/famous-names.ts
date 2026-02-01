import { Ens, Hex } from "@tevm/voltaire";
const ethFoundation = [
	{ name: "vitalik.eth", desc: "Vitalik Buterin - Ethereum founder" },
	{ name: "nick.eth", desc: "Nick Johnson - ENS creator" },
	{ name: "brantly.eth", desc: "Brantly Millegan - Former ENS director" },
];

for (const { name, desc } of ethFoundation) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
}
const systemDomains = [
	{ name: "eth", desc: "Root TLD for Ethereum Name Service" },
	{ name: "reverse", desc: "Reverse resolution namespace" },
	{ name: "addr.reverse", desc: "Reverse address lookup" },
];

for (const { name, desc } of systemDomains) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
}
const projects = [
	{ name: "dao.eth", desc: "The DAO" },
	{ name: "uniswap.eth", desc: "Uniswap protocol" },
	{ name: "ens.eth", desc: "ENS Protocol" },
	{ name: "ethereum.eth", desc: "Ethereum" },
];

for (const { name, desc } of projects) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
}
const patterns = [
	{ name: "app.eth", desc: "Application domains" },
	{ name: "nft.eth", desc: "NFT projects" },
	{ name: "dao.eth", desc: "DAO organizations" },
	{ name: "defi.eth", desc: "DeFi protocols" },
	{ name: "web3.eth", desc: "Web3 projects" },
];

for (const { name, desc } of patterns) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
}
const shortNames = [
	"abc.eth",
	"btc.eth",
	"nft.eth",
	"dao.eth",
	"eth.eth",
	"web.eth",
];

for (const name of shortNames) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
}
const variants = [
	["vitalik.eth", "VITALIK.eth", "Vitalik.ETH"],
	["uniswap.eth", "UNISWAP.eth", "UniSwap.ETH"],
	["dao.eth", "DAO.eth", "Dao.ETH"],
];

for (const [lower, upper, mixed] of variants) {
	const lowerNorm = Ens.normalize(lower);
	const upperNorm = Ens.normalize(upper);
	const mixedNorm = Ens.normalize(mixed);

	const lowerHash = Ens.namehash(lowerNorm);
	const upperHash = Ens.namehash(upperNorm);
	const mixedHash = Ens.namehash(mixedNorm);

	const allMatch =
		Hex.fromBytes(lowerHash) === Hex.fromBytes(upperHash) &&
		Hex.fromBytes(upperHash) === Hex.fromBytes(mixedHash);
}
const memorable = [
	{ name: "wallet.eth", desc: "Generic wallet name" },
	{ name: "crypto.eth", desc: "Cryptocurrency" },
	{ name: "hodl.eth", desc: "HODL meme" },
	{ name: "moon.eth", desc: "To the moon" },
	{ name: "lambo.eth", desc: "When Lambo?" },
];

for (const { name, desc } of memorable) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
}
