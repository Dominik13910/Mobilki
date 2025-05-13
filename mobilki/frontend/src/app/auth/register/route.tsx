import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  console.log("Rejestracja:", username, password);

  return NextResponse.json({
    success: true,
    message: "Użytkownik zarejestrowany",
  });
}
