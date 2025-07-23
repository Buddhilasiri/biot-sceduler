import { BiotLogo } from "@/components/biot-logo"

export function Navigation() {
  return (
    <nav className="border-b border-white/10 bg-biot-raisin/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-[780px]">
        <div className="flex items-center gap-3">
          <BiotLogo className="w-8 h-8" />
          <span className="text-biot-gold font-semibold text-lg">BIoT Innovations</span>
        </div>
      </div>
    </nav>
  )
}
