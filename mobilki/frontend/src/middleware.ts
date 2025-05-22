import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("session");
  console.log("Middleware: hasSession  =", hasSession ? "true" : "false");
  console.log("Middleware: pathname =", req.nextUrl.pathname);

  if (!hasSession  && !["/login", "/register"].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!api|_next|favicon.ico|service-worker.js|manifest.json|icon-.*\\.png).*)"],
};
