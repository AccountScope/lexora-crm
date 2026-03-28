import crypto from "node:crypto";

const HIBP_ENDPOINT = "https://api.pwnedpasswords.com/range/";
const USER_AGENT = process.env.PWNED_PASSWORD_USER_AGENT ?? "LexoraSecurity/1.0";

export interface PasswordBreachResult {
  breached: boolean;
  count: number;
  hashSuffix?: string;
}

export const checkPasswordBreach = async (password: string): Promise<PasswordBreachResult> => {
  if (!password) {
    return { breached: false, count: 0 };
  }

  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const response = await fetch(`${HIBP_ENDPOINT}${prefix}`, {
    headers: {
      "Add-Padding": "true",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to check password breach (status ${response.status})`);
  }

  const body = await response.text();
  const match = body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith(suffix));

  const count = match ? parseInt(match.split(":")[1] ?? "0", 10) : 0;
  return { breached: count > 0, count, hashSuffix: suffix };
};
