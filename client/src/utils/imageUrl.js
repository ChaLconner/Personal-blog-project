const isPrivateIpv4 = (hostname) => {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value))) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

const isLocalOrPrivateHostname = (hostname) => {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1" ||
    isPrivateIpv4(normalized) ||
    /^(?:fc|fd|fe[89ab])/i.test(normalized)
  );
};

export const getSafeImageUrl = (
  value,
  {
    pageOrigin = globalThis.location?.origin,
    uploadsBaseUrl,
    fallback = null,
  } = {},
) => {
  if (typeof value !== "string" || !value.trim()) return fallback;

  const trimmed = value.trim();
  if (/^data:image\/(?:avif|gif|jpeg|jpg|png|webp);base64,/i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:\/(?!\/)|\.{1,2}\/)/.test(trimmed) && !trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  const candidate =
    trimmed.startsWith("/uploads/") && uploadsBaseUrl
      ? `${uploadsBaseUrl.replace(/\/+$/, "")}${trimmed}`
      : trimmed;

  try {
    const url = new URL(candidate, pageOrigin || "https://invalid.local");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      isLocalOrPrivateHostname(url.hostname)
    ) {
      return fallback;
    }
    return candidate;
  } catch {
    return fallback;
  }
};
