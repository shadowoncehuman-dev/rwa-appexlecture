import CryptoJS from "crypto-js";

const VAULT_KEY = "SpidyBillionaireVault2026@Secure";
const VAULT_IV = "SpidyLalit123456";
const DEFAULT_IV_B64 = "ZmVkY2JhOTg3NjU0MzIxMA==";
const DEFAULT_IV_UTF8 = "fedcba9876543210";

/** Decrypt the `vaultData` envelope returned by the backend. */
export function decryptVault<T = unknown>(payload: string): T | null {
  try {
    const plain = CryptoJS.AES.decrypt(
      payload,
      CryptoJS.enc.Utf8.parse(VAULT_KEY),
      {
        iv: CryptoJS.enc.Utf8.parse(VAULT_IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    ).toString(CryptoJS.enc.Utf8);
    return plain ? (JSON.parse(plain) as T) : null;
  } catch {
    return null;
  }
}

/** Decrypt an encrypted media/pdf link ("<cipher>:<iv>" form). */
export function decryptLink(link?: string | null, key?: string): string {
  if (!link) return "";
  if (link.startsWith("http")) return link;

  let cipher = link;
  let iv = DEFAULT_IV_B64;
  if (link.includes(":")) {
    const parts = link.split(":");
    if (parts.length >= 2) {
      cipher = parts[0]!;
      iv = parts[1]!;
    }
  }

  let mainKey = key;
  let mainIv: string | undefined;
  if (key && key.includes(":")) {
    const parts = key.split(":");
    mainKey = parts[0]!;
    mainIv = parts[1];
  }

  const attempts = [
    { key: mainKey, iv: mainIv || iv, mode: "base64" as const },
    { key: "g+MewM0jj7b1+puhl+draw==", iv, mode: "base64" as const },
    { key: "638udh3829162018", iv: DEFAULT_IV_UTF8, mode: "utf8" as const },
    { key: mainKey, iv: DEFAULT_IV_B64, mode: "base64" as const },
  ];

  for (const attempt of attempts) {
    if (!attempt.key) continue;
    try {
      const parsedKey =
        attempt.mode === "base64"
          ? CryptoJS.enc.Base64.parse(attempt.key)
          : CryptoJS.enc.Utf8.parse(attempt.key);
      const parsedIv =
        attempt.mode === "base64"
          ? CryptoJS.enc.Base64.parse(attempt.iv || DEFAULT_IV_B64)
          : CryptoJS.enc.Utf8.parse(attempt.iv || DEFAULT_IV_UTF8);
      const out = CryptoJS.AES.decrypt(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ciphertext: CryptoJS.enc.Base64.parse(cipher) } as any,
        parsedKey,
        { iv: parsedIv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
      ).toString(CryptoJS.enc.Utf8);
      if (out && out.length > 5 && (out.startsWith("http") || out.length > 20)) {
        return out;
      }
    } catch {
      // try next strategy
    }
  }
  return "";
}
