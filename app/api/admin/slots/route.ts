import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

function authenticate(request: NextRequest) {
  const header = request.headers.get("authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  const admin = process.env.ADMIN_TOKEN || "admin-access"
  return token === admin
}

export async function DELETE(request: NextRequest) {
  if (!authenticate(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }
  try {
    const { eventId } = await request.json()

    db.prepare("DELETE FROM bookings WHERE start = ?").run(eventId)

    return NextResponse.json({
      success: true,
      message: "Booking canceled successfully",
    })
  } catch (error) {
    console.error("Cancel error:", error)
    return NextResponse.json({ success: false, message: "Cancel failed" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!authenticate(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }
  try {
    const { eventId, newStart } = await request.json()

    const start = new Date(eventId)
    const newStartDate = new Date(newStart)
    const newEnd = new Date(newStartDate.getTime() + 30 * 60 * 1000)

    db.prepare("UPDATE bookings SET start = ?, end = ? WHERE start = ?").run(
      newStartDate.toISOString(),
      newEnd.toISOString(),
      start.toISOString()
    )

    return NextResponse.json({
      success: true,
      message: "Booking moved successfully",
    })
  } catch (error) {
    console.error("Move error:", error)
    return NextResponse.json({ success: false, message: "Move failed" }, { status: 500 })
  }
}

