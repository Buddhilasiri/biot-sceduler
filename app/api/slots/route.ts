import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

function getWeekStart(week: string | null): Date {
  const now = new Date()
  if (!week) {
    const day = now.getUTCDay() || 7
    now.setUTCDate(now.getUTCDate() - day + 1)
    now.setUTCHours(0, 0, 0, 0)
    return now
  }
  const [y, w] = week.split("-").map(Number)
  const simple = new Date(Date.UTC(y, 0, 1 + (w - 1) * 7))
  const day = simple.getUTCDay()
  if (day <= 4) {
    simple.setUTCDate(simple.getUTCDate() - day + 1)
  } else {
    simple.setUTCDate(simple.getUTCDate() + 8 - day)
  }
  simple.setUTCHours(0, 0, 0, 0)
  return simple
}

function generateSlots(start: Date): string[] {
  const slots: string[] = []
  const times = ["18:00", "18:30", "19:00", "19:30"]
  for (let d = 0; d < 5; d++) {
    const base = new Date(start)
    base.setUTCDate(start.getUTCDate() + d)
    times.forEach((t) => {
      const [h, m] = t.split(":").map(Number)
      const slot = new Date(base)
      slot.setUTCHours(h - 5, m - 30, 0, 0)
      slots.push(slot.toISOString())
    })
  }
  return slots
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const week = searchParams.get("week")
  const weekStart = getWeekStart(week)
  const allSlots = generateSlots(weekStart)

  const rows = db
    .prepare("SELECT start FROM bookings WHERE start >= ? AND start < ?")
    .all(weekStart.toISOString(), new Date(weekStart.getTime() + 7 * 86400000).toISOString())
  const booked = new Set(rows.map((r: any) => r.start))

  const available = allSlots.filter((s) => !booked.has(s))
  return NextResponse.json(available)
}

