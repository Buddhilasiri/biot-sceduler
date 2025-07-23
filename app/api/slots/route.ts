import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const week = searchParams.get("week")

  // Mock available slots - in production, this would fetch from your database
  // Format: ISO string timestamps for available 30-minute slots
  const mockSlots = [
    "2025-01-27T12:30:00.000Z", // Monday 18:00 LK time
    "2025-01-27T13:00:00.000Z", // Monday 18:30 LK time
    "2025-01-28T12:30:00.000Z", // Tuesday 18:00 LK time
    "2025-01-28T14:00:00.000Z", // Tuesday 19:30 LK time
    "2025-01-29T13:30:00.000Z", // Wednesday 19:00 LK time
    "2025-01-30T12:30:00.000Z", // Thursday 18:00 LK time
    "2025-01-30T13:00:00.000Z", // Thursday 18:30 LK time
    "2025-01-31T13:30:00.000Z", // Friday 19:00 LK time
  ]

  return NextResponse.json(mockSlots)
}
