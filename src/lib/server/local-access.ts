import { headers } from "next/headers";

const LOCAL_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function compact(value: string | null | undefined) {
  return String(value || "").trim();
}

function normalizeHost(value: string) {
  const trimmed = compact(value).toLowerCase();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("[")) {
    const closingIndex = trimmed.indexOf("]");
    if (closingIndex >= 0) {
      return trimmed.slice(0, closingIndex + 1);
    }
  }
  return trimmed.split(":")[0] || trimmed;
}

function normalizeIp(value: string) {
  return compact(value)
    .replace(/^for=/i, "")
    .replace(/^"(.*)"$/, "$1")
    .replace(/^\[(.*)\](:\d+)?$/, "$1")
    .replace(/:\d+$/, "");
}

function firstForwardedIp(value: string) {
  const first = compact(value).split(",")[0] || "";
  return normalizeIp(first.split(";")[0] || first);
}

function isLocalIp(value: string) {
  const normalized = normalizeIp(value);
  return LOCAL_IPS.has(normalized);
}

function isLocalHost(value: string) {
  return LOCAL_HOSTS.has(normalizeHost(value));
}

export async function isLocalRequest() {
  const requestHeaders = await headers();
  const forwardedFor = firstForwardedIp(requestHeaders.get("x-forwarded-for") || "");
  const realIp = normalizeIp(requestHeaders.get("x-real-ip") || "");
  const forwarded = firstForwardedIp(requestHeaders.get("forwarded") || "");
  const host = normalizeHost(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || ""
  );

  if (forwardedFor && isLocalIp(forwardedFor)) {
    return true;
  }
  if (realIp && isLocalIp(realIp)) {
    return true;
  }
  if (forwarded && isLocalIp(forwarded)) {
    return true;
  }
  return isLocalHost(host);
}
