import { NextResponse } from "next/server";

const rateLimit = new Map();

function getIP(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0] : "127.0.0.1";
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only rate limit auth endpoints
  const protectedPaths = [
    "/api/auth/signup",
    "/api/stripe/checkout",
    "/api/waitlist",
  ];

  if (protectedPaths.some(p => pathname.startsWith(p))) {
    const ip = getIP(request);
    const key = `${ip}:${pathname}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10;

    const record = rateLimit.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count++;
    rateLimit.set(key, record);

    if (record.count > maxRequests) {
      return NextResponse.json(
        { error: "Too many requests — please try again later" },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/signup",
    "/api/stripe/checkout",
    "/api/waitlist",
  ],
};