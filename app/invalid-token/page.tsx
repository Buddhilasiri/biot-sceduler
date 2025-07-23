import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function InvalidTokenPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card rounded-lg p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-neutral-200 mb-4">Link expired or invalid</h2>
        <p className="text-neutral-400 mb-6">Your scheduling link has expired or is no longer valid.</p>
        <Link href="/">
          <Button className="bg-biot-gold text-biot-raisin hover:bg-biot-purple hover:text-white motion-safe:transition-all duration-200">
            Request new link
          </Button>
        </Link>
      </div>
    </div>
  )
}
