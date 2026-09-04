// Official Cloudflare edge IP ranges: https://www.cloudflare.com/ips-v4 / ips-v6.
// Used to verify that a request claiming to carry a trusted cf-ipcountry header
// actually reached the origin via Cloudflare, since anyone can send that header
// directly to the origin otherwise. Update if Cloudflare rotates these (rare).
const CLOUDFLARE_IPV4_RANGES = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];

const CLOUDFLARE_IPV6_RANGES = [
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    result = (result << 8) | octet;
  }
  return result >>> 0;
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  if (ipInt === null || rangeInt === null) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

const SIXTEEN = BigInt(16);
const ONE = BigInt(1);
const FULL_128 = BigInt(128);

function expandIpv6(ip: string): bigint | null {
  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  let groups: string[];
  if (ip.includes("::")) {
    const missing = 8 - headParts.length - tailParts.length;
    if (missing < 0) return null;
    groups = [...headParts, ...Array(missing).fill("0"), ...tailParts];
  } else {
    groups = ip.split(":");
  }
  if (groups.length !== 8) return null;
  return groups.reduce(
    (acc, group) => (acc << SIXTEEN) | BigInt(parseInt(group || "0", 16)),
    BigInt(0)
  );
}

function isIpv6InCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = BigInt(Number(bitsStr));
  const ipInt = expandIpv6(ip);
  const rangeInt = expandIpv6(range);
  if (ipInt === null || rangeInt === null) return false;
  if (bits === BigInt(0)) return true;
  const mask = ((ONE << FULL_128) - ONE) ^ ((ONE << (FULL_128 - bits)) - ONE);
  return (ipInt & mask) === (rangeInt & mask);
}

export function isCloudflareIp(rawIp?: string | null): boolean {
  if (!rawIp) return false;
  const ip = rawIp.trim().split(",")[0]?.trim();
  if (!ip) return false;

  if (ip.includes(":")) {
    return CLOUDFLARE_IPV6_RANGES.some((cidr) => isIpv6InCidr(ip, cidr));
  }
  return CLOUDFLARE_IPV4_RANGES.some((cidr) => isIpv4InCidr(ip, cidr));
}
