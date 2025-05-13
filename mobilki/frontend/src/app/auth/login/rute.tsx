import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (username === "admin" && password === "admin") {
    const response = NextResponse.json({
      success: true,
      message: "Zalogowano!",
    });

    response.cookies.set("token", "dummy_token", {
      httpOnly: true,
      path: "/",
    });

    return response;
  }

  return NextResponse.json(
    { success: false, message: "Nieprawidłowe dane logowania" },
    { status: 401 }
  );
}
