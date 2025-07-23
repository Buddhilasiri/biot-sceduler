"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, X, Settings, Move, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import * as Tooltip from "@radix-ui/react-tooltip"

// JWT decode function (simplified)
function decodeJWT(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const now = Date.now() / 1000
    if (payload.exp && payload.exp < now) {
      throw new Error("Token expired")
    }
    return payload
  } catch {
    throw new Error("Invalid token")
  }
}

// Utility functions
const toUTC = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes())

function ScheduleContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("t")

  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [slotsBooked, setSlotsBooked] = useState<Set<number>>(new Set())
  const [holidays, setHolidays] = useState<Set<string>>(new Set())
  const [adminMode, setAdminMode] = useState(false)
  const [pickedEvent, setPickedEvent] = useState<{ eventId: string; startUTC: number; start: Date; end: Date } | null>(
    null,
  )
  const [eventLookup, setEventLookup] = useState<Record<number, { eventId: string; start: Date; end: Date }>>({})

  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveTarget, setMoveTarget] = useState<Date | null>(null)
  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [loading, setLoading] = useState(true)

  // Grid constants
  const timeGutterW = 80
  const colTemplate = `${timeGutterW}px repeat(5, 1fr)`

  // Time slots in LK time (GMT+5:30)
  const timeSlots = [
    { start: "18:00", end: "18:30", value: "18:00" },
    { start: "18:30", end: "19:00", value: "18:30" },
    { start: "19:00", end: "19:30", value: "19:00" },
    { start: "19:30", end: "20:00", value: "19:30" },
  ]

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"]

  // Check if user is admin
  const isAdmin =
    token === "admin-access" ||
    (token &&
      (() => {
        try {
          const decoded = decodeJWT(token)
          return decoded.role === "admin"
        } catch {
          return false
        }
      })())

  useEffect(() => {
    if (!token) {
      router.push("/invalid-token")
      return
    }

    // Allow admin access
    if (token === "admin-access") {
      loadSlots()
      loadHolidays()
      return
    }

    try {
      decodeJWT(token)
      loadSlots()
      loadHolidays()
    } catch {
      router.push("/invalid-token")
      return
    }
  }, [token, currentWeek, router])

  const loadSlots = async () => {
    setLoading(true)
    try {
      const weekString = getWeekString(currentWeek)
      const response = await fetch(`/api/slots?week=${weekString}`)
      if (response.ok) {
        const slots: string[] = await response.json()
        const bookedSet = new Set(slots.map((s) => toUTC(new Date(s))))
        setSlotsBooked(bookedSet)

        // Build event lookup for admin mode
        const lookup: Record<number, { eventId: string; start: Date; end: Date }> = {}
        slots.forEach((slot, index) => {
          const start = new Date(slot)
          const end = new Date(start.getTime() + 30 * 60 * 1000)
          const utc = toUTC(start)
          lookup[utc] = {
            eventId: `event-${index}`,
            start,
            end,
          }
        })
        setEventLookup(lookup)
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadHolidays = async () => {
    try {
      const year = currentWeek.getFullYear()
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/LK`)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      let list: Array<{ date: string }> = []

      try {
        // Some environments return an empty body or non-JSON on CORS errors.
        list = (await res.json()) as Array<{ date: string }>
      } catch {
        console.warn("Holiday API returned empty or invalid JSON, using fallback")
      }

      // If the API delivered nothing, provide at least one safe mock date
      if (!Array.isArray(list) || list.length === 0) {
        list = [{ date: `${year}-01-29` }] // Wed 29 Jan – demo fallback
      }

      setHolidays(new Set(list.map((h) => h.date)))
    } catch (err) {
      console.error("Failed to fetch holidays:", err)
      // Ensure we still have a Set to check against
      setHolidays(new Set([`${currentWeek.getFullYear()}-01-29`]))
    }
  }

  const getWeekString = (date: Date) => {
    const year = date.getFullYear()
    const week = getWeekNumber(date)
    return `${year}-${week.toString().padStart(2, "0")}`
  }

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    for (let i = 0; i < 5; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const openConfirm = (start: Date, end: Date) => {
    setSelectedSlot({ start, end })
    setShowConfirmModal(true)
  }

  const handleSlotClick = (start: Date, end: Date) => {
    const startUTC = toUTC(start)
    const isBooked = slotsBooked.has(startUTC)
    const dayISO = start.toISOString().split("T")[0]
    const isHoliday = holidays.has(dayISO)
    const disabled = isBooked || isHoliday

    if (!adminMode && !disabled) {
      openConfirm(start, end)
    } else if (adminMode) {
      if (isBooked && pickedEvent?.startUTC !== startUTC) {
        // Pick this booked event
        const event = eventLookup[startUTC]
        if (event) {
          setPickedEvent({
            eventId: event.eventId,
            startUTC,
            start: event.start,
            end: event.end,
          })
        }
      } else if (pickedEvent && pickedEvent.startUTC === startUTC) {
        // Unpick the currently selected event
        setPickedEvent(null)
      } else if (pickedEvent && !disabled) {
        // Move picked event to this free slot
        setMoveTarget(start)
        setShowMoveModal(true)
      }
    }
  }

  const handleBooking = async () => {
    if (!selectedSlot || !token) return

    setBookingStatus("loading")
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token === "admin-access" ? "admin-token" : token,
          slot: selectedSlot.start.toISOString(),
        }),
      })

      if (response.ok) {
        setBookingStatus("success")
        // Update local state
        const startUTC = toUTC(selectedSlot.start)
        setSlotsBooked((prev) => new Set([...prev, startUTC]))

        // Add to event lookup
        setEventLookup((prev) => ({
          ...prev,
          [startUTC]: {
            eventId: `event-${Date.now()}`,
            start: selectedSlot.start,
            end: selectedSlot.end,
          },
        }))
      } else {
        throw new Error("Booking failed")
      }
    } catch (error) {
      setBookingStatus("error")
      setTimeout(() => {
        setShowConfirmModal(false)
        setBookingStatus("idle")
      }, 3000)
    }
  }

  const handleCancelBooking = async () => {
    if (!pickedEvent) return

    try {
      const response = await fetch("/api/admin/slots", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: pickedEvent.eventId }),
      })

      if (response.ok) {
        // Remove from booked slots
        setSlotsBooked((prev) => {
          const newSet = new Set(prev)
          newSet.delete(pickedEvent.startUTC)
          return newSet
        })

        // Remove from event lookup
        setEventLookup((prev) => {
          const newLookup = { ...prev }
          delete newLookup[pickedEvent.startUTC]
          return newLookup
        })

        setPickedEvent(null)
        setShowCancelModal(false)
      }
    } catch (error) {
      console.error("Cancel failed:", error)
    }
  }

  const handleMoveBooking = async () => {
    if (!pickedEvent || !moveTarget) return

    try {
      const response = await fetch("/api/admin/slots", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: pickedEvent.eventId,
          newStart: moveTarget.toISOString(),
        }),
      })

      if (response.ok) {
        const newUTC = toUTC(moveTarget)
        const newEnd = new Date(moveTarget.getTime() + 30 * 60 * 1000)

        // Update booked slots
        setSlotsBooked((prev) => {
          const newSet = new Set(prev)
          newSet.delete(pickedEvent.startUTC)
          newSet.add(newUTC)
          return newSet
        })

        // Update event lookup
        setEventLookup((prev) => {
          const newLookup = { ...prev }
          delete newLookup[pickedEvent.startUTC]
          newLookup[newUTC] = {
            eventId: pickedEvent.eventId,
            start: moveTarget,
            end: newEnd,
          }
          return newLookup
        })

        setPickedEvent(null)
        setMoveTarget(null)
        setShowMoveModal(false)
      }
    } catch (error) {
      console.error("Move failed:", error)
    }
  }

  const weekDates = getWeekDates(currentWeek)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-neutral-400">Loading schedule...</div>
      </div>
    )
  }

  return (
    <Tooltip.Provider>
      <div className="space-y-6">
        <div className="glass-card rounded-lg p-6">
          {/* Week Navigation Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const prevWeek = new Date(currentWeek)
                prevWeek.setDate(prevWeek.getDate() - 7)
                setCurrentWeek(prevWeek)
              }}
              className="text-white hover:text-biot-gold"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium text-white">
                Week of {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </h2>

              {isAdmin && (
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAdminMode((prev) => !prev)}
                      className={`p-2 ${adminMode ? "text-biot-gold" : "text-neutral-400"} hover:text-biot-gold`}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-biot-raisin border border-white/20 rounded-md px-3 py-2 text-sm text-neutral-200 shadow-lg z-50"
                      sideOffset={5}
                    >
                      Manage bookings
                      <Tooltip.Arrow className="fill-white/20" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const nextWeek = new Date(currentWeek)
                nextWeek.setDate(nextWeek.getDate() + 7)
                setCurrentWeek(nextWeek)
              }}
              className="text-white hover:text-biot-gold"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-xl overflow-hidden bg-[#8E6FFF40] shadow-[0_0_0_1px_#8E6FFF60]">
            {/* Weekday Header */}
            <div className="grid" style={{ gridTemplateColumns: colTemplate }}>
              <div className="h-[60px]"></div>
              {weekdays.map((day, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center bg-[#1B1A2A] border-b border-biot-purple/60"
                >
                  <span className="uppercase text-xs font-semibold text-neutral-100">{day}</span>
                  <span className="text-[11px] text-biot-purple/70">{weekDates[i].getDate()}</span>
                </div>
              ))}
            </div>

            {/* Slot Rows */}
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot.value} className="grid" style={{ gridTemplateColumns: colTemplate }}>
                {/* Time Gutter */}
                <div className="relative h-[64px] flex flex-col justify-between py-1 pr-2 text-neutral-300 text-xs border-r border-biot-purple/40">
                  <span className="text-right">{timeSlot.start}</span>
                  <span className="text-right text-biot-purple/70">{timeSlot.end}</span>
                </div>

                {/* Day Cells */}
                {weekDates.map((date, dayIndex) => {
                  const start = new Date(date)
                  const [hours, minutes] = timeSlot.value.split(":").map(Number)
                  start.setHours(hours, minutes, 0, 0)
                  const end = new Date(start.getTime() + 30 * 60 * 1000)
                  const startUTC = toUTC(start)
                  const dayISO = date.toISOString().split("T")[0]

                  const isBooked = slotsBooked.has(startUTC)
                  const isHoliday = holidays.has(dayISO)
                  const disabled = isBooked || isHoliday
                  const picked = adminMode && pickedEvent?.startUTC === startUTC
                  const targetable = adminMode && pickedEvent && !disabled && !picked
                  const isAvailable = !disabled

                  let tooltipText = `Click to book ${timeSlot.start} – ${timeSlot.end}`
                  if (isHoliday) {
                    tooltipText = "Public holiday"
                  } else if (isBooked) {
                    tooltipText = adminMode ? "Click to select booking" : "Already booked"
                  }

                  return (
                    <Tooltip.Root key={dayIndex}>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={() => handleSlotClick(start, end)}
                          disabled={disabled && !adminMode}
                          aria-pressed={picked}
                          className={`
                            group relative h-[64px] w-full
                            transition-all duration-150
                            ${
                              isAvailable && !adminMode
                                ? "bg-biot-gold/20 hover:bg-biot-gold/30 border border-biot-gold/40 hover:border-biot-gold cursor-pointer"
                                : isBooked
                                  ? "bg-biot-purple/25 border border-biot-purple/60"
                                  : "bg-[rgba(255,255,255,0.03)]"
                            }
                            ${targetable ? "hover:ring-2 hover:ring-biot-gold cursor-pointer" : ""}
                            ${picked ? "outline outline-2 outline-biot-gold bg-biot-gold/10" : ""}
                            ${isHoliday && !isBooked ? "cursor-not-allowed opacity-60" : ""}
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biot-gold
                          `}
                        >
                          {/* Remove time numbers - keep slots clean */}

                          {/* Holiday diagonal stripes */}
                          {isHoliday && !isBooked && (
                            <span className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(142,111,255,.45)_6px_12px)]"></span>
                          )}
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-biot-raisin border border-white/20 rounded-md px-3 py-2 text-sm text-neutral-200 shadow-lg z-50"
                          sideOffset={5}
                        >
                          {tooltipText}
                          <Tooltip.Arrow className="fill-white/20" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Admin Legend */}
          {adminMode && (
            <div className="flex items-center justify-end gap-4 mt-4 text-xs text-neutral-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-biot-gold/20 border border-biot-gold/40"></div>
                <span>available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-biot-purple/25 border border-biot-purple/60"></div>
                <span>booked</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 outline outline-2 outline-biot-gold"></div>
                <span>selected</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-[rgba(255,255,255,0.03)] ring-1 ring-biot-gold"></div>
                <span>target</span>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {adminMode && pickedEvent && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Cancel Booking
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPickedEvent(null)}
                className="border-white/20 text-neutral-300 hover:bg-white/10"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>

        {/* Booking Confirmation Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-biot-raisin border-white/20">
            <DialogHeader>
              <DialogTitle className="text-neutral-200">
                {bookingStatus === "success" ? "Booking Confirmed!" : "Confirm Time Slot"}
              </DialogTitle>
            </DialogHeader>

            {bookingStatus === "success" ? (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-biot-gold/20 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-biot-gold" />
                  </div>
                </div>
                <p className="text-neutral-300 mb-4">✓ Booked! We've emailed the details.</p>
                <div className="glass-card rounded-lg p-4">
                  <p className="text-sm text-neutral-400">
                    Meeting: {selectedSlot && `${formatTime(selectedSlot.start)} – ${formatTime(selectedSlot.end)}`}{" "}
                    (GMT+05:30)
                  </p>
                  <p className="text-sm text-biot-gold mt-2">Google Meet link will be shared via email</p>
                </div>
              </div>
            ) : bookingStatus === "error" ? (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <p className="text-red-400">That slot just vanished – pick another!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-neutral-300">
                  Confirm {selectedSlot && `${formatTime(selectedSlot.start)} – ${formatTime(selectedSlot.end)}`}{" "}
                  (GMT+05:30)?
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBooking}
                    disabled={bookingStatus === "loading"}
                    className="flex-1 bg-biot-gold text-biot-raisin hover:bg-biot-purple hover:text-white"
                  >
                    {bookingStatus === "loading" ? "Booking..." : "Book"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 border-white/20 text-neutral-300 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Booking Modal */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="bg-biot-raisin border-white/20">
            <DialogHeader>
              <DialogTitle className="text-neutral-200">Cancel Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-neutral-300">Are you sure you want to cancel this booking?</p>
              <div className="flex gap-2">
                <Button onClick={handleCancelBooking} className="flex-1 bg-red-500 text-white hover:bg-red-600">
                  Cancel Booking
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 border-white/20 text-neutral-300 hover:bg-white/10"
                >
                  Keep Booking
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Move Booking Modal */}
        <Dialog open={showMoveModal} onOpenChange={setShowMoveModal}>
          <DialogContent className="bg-biot-raisin border-white/20">
            <DialogHeader>
              <DialogTitle className="text-neutral-200">Move Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-neutral-300">
                Move booking to{" "}
                {moveTarget &&
                  `${formatTime(moveTarget)} – ${formatTime(new Date(moveTarget.getTime() + 30 * 60 * 1000))}`}
                ?
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleMoveBooking}
                  className="flex-1 bg-biot-gold text-biot-raisin hover:bg-biot-purple hover:text-white"
                >
                  <Move className="w-4 h-4 mr-1" />
                  Move Booking
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowMoveModal(false)}
                  className="flex-1 border-white/20 text-neutral-300 hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Tooltip.Provider>
  )
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-neutral-400">Loading...</div>
        </div>
      }
    >
      <ScheduleContent />
    </Suspense>
  )
}
