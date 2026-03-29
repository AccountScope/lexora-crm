import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, any> = {};
  
  // Test 1: Can we import bcrypt?
  try {
    const bcrypt = require("bcrypt");
    results.bcrypt = { loaded: true, version: bcrypt.version || "unknown" };
    
    // Test hash
    const hash = await bcrypt.hash("test", 10);
    results.bcrypt.hashWorks = true;
    results.bcrypt.sampleHash = hash;
  } catch (e: any) {
    results.bcrypt = { loaded: false, error: e.message, code: e.code };
  }

  // Test 2: Can we import zxcvbn?
  try {
    const zxcvbn = require("zxcvbn");
    const result = zxcvbn("TestPassword123!");
    results.zxcvbn = { loaded: true, score: result.score };
  } catch (e: any) {
    results.zxcvbn = { loaded: false, error: e.message };
  }

  // Test 3: Can we read common-passwords.txt?
  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(process.cwd(), "lib/auth/common-passwords.txt");
    results.commonPasswords = { path: filePath, exists: fs.existsSync(filePath) };
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      results.commonPasswords.lineCount = content.split("\n").length;
    }
  } catch (e: any) {
    results.commonPasswords = { error: e.message };
  }

  // Test 4: Can we import ua-parser-js?
  try {
    const { UAParser } = require("ua-parser-js");
    const parser = new UAParser("Mozilla/5.0");
    results.uaParser = { loaded: true, browser: parser.getBrowser() };
  } catch (e: any) {
    results.uaParser = { loaded: false, error: e.message };
  }

  // Test 5: Can we import geoip-lite?
  try {
    const geoip = require("geoip-lite");
    results.geoip = { loaded: true };
  } catch (e: any) {
    results.geoip = { loaded: false, error: e.message };
  }

  return NextResponse.json(results);
}
