import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "frontend",
      method: request.method,
      path: request.nextUrl.pathname,
      host: request.headers.get("host"),
    })
  );

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
