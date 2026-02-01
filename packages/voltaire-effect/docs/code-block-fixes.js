(() => {
  if (typeof window === "undefined") return;
  const clipboard = navigator && navigator.clipboard;
  if (!clipboard || typeof clipboard.writeText !== "function") return;

  const bigintSpacePattern = /([-+]?(?:\b\d[\d_]*|\b0[xX][0-9A-Fa-f_]+|\b0[bB][01_]+|\b0[oO][0-7_]+))\s+n\b/g;

  const normalizeBigIntLiterals = (text) =>
    text.replace(bigintSpacePattern, "$1n");

  if (clipboard.writeText.__bigintNormalized) return;

  const originalWriteText = clipboard.writeText.bind(clipboard);
  const patchedWriteText = (text) =>
    originalWriteText(normalizeBigIntLiterals(String(text)));

  patchedWriteText.__bigintNormalized = true;
  clipboard.writeText = patchedWriteText;
})();
