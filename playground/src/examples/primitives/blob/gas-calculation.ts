import { Blob } from "voltaire";
const gas1 = Blob.calculateGas(1);
for (let count = 2; count <= Blob.MAX_PER_TRANSACTION; count++) {
	const gas = Blob.calculateGas(count);
}
const maxPerBlob =
	Blob.FIELD_ELEMENTS_PER_BLOB * (Blob.BYTES_PER_FIELD_ELEMENT - 1);

const dataSizes = [
	{ name: "1 KB", bytes: 1024 },
	{ name: "10 KB", bytes: 10240 },
	{ name: "50 KB", bytes: 51200 },
	{ name: "100 KB", bytes: 102400 },
	{ name: "128 KB", bytes: maxPerBlob },
	{ name: "200 KB", bytes: 204800 },
	{ name: "500 KB", bytes: 512000 },
];

for (const size of dataSizes) {
	const blobCount = Blob.estimateBlobCount(size.bytes);
	const gas = Blob.calculateGas(blobCount);
}
// Typical image sizes
const imageSizes = [
	{ name: "Small thumbnail", kb: 20 },
	{ name: "Medium image", kb: 150 },
	{ name: "Large image", kb: 500 },
	{ name: "High-res image", kb: 2000 },
];

for (const img of imageSizes) {
	const bytes = img.kb * 1024;
	const blobCount = Blob.estimateBlobCount(bytes);
	const canFit = blobCount <= Blob.MAX_PER_TRANSACTION;
	const gas = canFit ? Blob.calculateGas(blobCount) : "N/A (too large)";
}
// Calculate optimal batching for multiple items
const itemSize = 80000; // 80 KB per item
const blobsPerItem = Blob.estimateBlobCount(itemSize);
const maxItemsPerTx = Math.floor(Blob.MAX_PER_TRANSACTION / blobsPerItem);
const blobsInOptimalTx = Math.min(
	maxItemsPerTx * blobsPerItem,
	Blob.MAX_PER_TRANSACTION,
);
const totalItems = 5; // Reduced to stay within limits
const totalBlobs = totalItems * blobsPerItem;
const txNeeded = Math.ceil(totalBlobs / Blob.MAX_PER_TRANSACTION);
let totalGas = 0;

for (let i = 0; i < txNeeded; i++) {
	const blobsInTx = Math.min(
		Blob.MAX_PER_TRANSACTION,
		totalBlobs - i * Blob.MAX_PER_TRANSACTION,
	);
	totalGas += Blob.calculateGas(blobsInTx);
}
