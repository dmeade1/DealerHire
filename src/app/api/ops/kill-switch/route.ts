import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    paused: true,
    scope: "all_execution",
    actorRequired: true,
    note: "Audited kill switch — wire to durable flag store in production",
  });
}
