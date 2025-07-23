"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, AlertCircle } from "lucide-react"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    // Admin access check
    if (name.toLowerCase() === "admin" && email.toLowerCase() === "admin@biot-innovations.com") {
      // Redirect to scheduler with admin token
      window.location.href = "/schedule?t=admin-access"
      return
    }

    try {
      const response = await fetch("https://n8n.biot-innovations.com/webhook-test/coldCall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      })

      if (response.ok) {
        setStatus("success")
      } else {
        throw new Error("Request failed")
      }
    } catch (error) {
      setStatus("error")
      setErrorMessage("Something went wrong — please retry.")
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-lg p-8 max-w-md w-full text-center motion-safe:transition-all duration-500">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-biot-gold/20 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-biot-gold" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-neutral-200 mb-2">Check your inbox</h2>
          <p className="text-neutral-400">Your link is on the way.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-neutral-200 mb-6">Book a call with our engineers</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-neutral-300">
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-neutral-200 focus:ring-2 focus:ring-biot-purple focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-300">
              Work e-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-neutral-200 focus:ring-2 focus:ring-biot-purple focus:border-transparent"
              placeholder="your.email@company.com"
            />
          </div>

          <p className="text-sm text-neutral-400">We'll send you a secure link that lets you pick a time slot.</p>

          {status === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-biot-purple rounded-md">
              <AlertCircle className="w-4 h-4 text-biot-purple" />
              <span className="text-sm text-neutral-200">{errorMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-biot-gold text-biot-raisin hover:bg-biot-purple hover:text-white motion-safe:transition-all duration-200 font-medium"
          >
            {status === "loading" ? "Sending..." : "Request Access"}
          </Button>
        </form>
      </div>
    </div>
  )
}
