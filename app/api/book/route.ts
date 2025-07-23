import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, slot } = await request.json()

    // Handle admin access
    if (token === "admin-token") {
      console.log("Admin booking:", { slot, timestamp: new Date().toISOString() })

      return NextResponse.json({
        success: true,
        message: "Admin booking confirmed",
        meetingLink: "https://meet.google.com/admin-meeting-link",
      })
    }

    // In production, verify the JWT token here
    // and validate the slot availability

    // Simulate booking process
    const bookingData = {
      token,
      slot,
      timestamp: new Date().toISOString(),
    }

    // Make the webhook call to n8n
    const webhookResponse = await fetch("https://n8n.biot-innovations.com/webhook-test/schedulingAgent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    })

    if (!webhookResponse.ok) {
      throw new Error("Webhook call failed")
    }

    return NextResponse.json({
      success: true,
      message: "Booking confirmed",
      meetingLink: "https://meet.google.com/abc-defg-hij", // Mock meeting link
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json({ success: false, message: "Booking failed" }, { status: 500 })
  }
}
