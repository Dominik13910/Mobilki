import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  console.log("Middleware: token =", token);
  console.log("Middleware: pathname =", req.nextUrl.pathname);

  if (!token && !["/login", "/register"].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
