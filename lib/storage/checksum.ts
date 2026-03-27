import crypto from "crypto";

export const sha256 = (buffer: Buffer | Uint8Array) =>
  crypto.createHash("sha256").update(buffer).digest("hex");
