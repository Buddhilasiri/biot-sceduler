export function BiotLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#8E6FFF" />
      <path
        d="M8 24L16 8L24 24H20L16 16L12 24H8Z"
        fill="#FEC53C"
        stroke="#FEC53C"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
