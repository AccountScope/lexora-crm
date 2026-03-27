import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";

export const success = (body: any, init?: ResponseInit) => NextResponse.json(body, init);

export const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
  }
  // eslint-disable-next-line no-console
  console.error(error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
};
