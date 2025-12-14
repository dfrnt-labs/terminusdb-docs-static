export function PersonaGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  )
}
