'use client'

import dynamic from 'next/dynamic'

// The playground and walkthrough pull in the terminusdb client; ssr:false keeps
// them and their dependencies out of the shared page bundle. They mount after
// hydration on the few pages that use the tags.
const WoqlPlaygroundClient = dynamic(
  () => import('@/components/WoqlPlayground').then((m) => m.WoqlPlayground),
  { ssr: false },
)

export const LazyWalkthrough = dynamic(
  () => import('@/components/Walkthrough').then((m) => m.Walkthrough),
  { ssr: false },
)

export const LazyWalkthroughStep = dynamic(
  () => import('@/components/Walkthrough').then((m) => m.WalkthroughStep),
  { ssr: false },
)

type WoqlPlaygroundProps = {
  code: string
  title?: string
  description?: string
  anonymous?: boolean
  database?: string
  showResultOnly?: boolean
}

// Reserve approximate space in the static HTML so the late-mounting playground
// does not push the article below it (CLS). The textarea auto-sizes to the code
// at ~19px per line, plus chrome for the header, description and footer.
export function LazyWoqlPlayground(props: WoqlPlaygroundProps) {
  const lines = typeof props.code === 'string' ? props.code.split('\n').length : 1
  const minHeight = Math.max(160, lines * 19 + 150 + (props.description ? 40 : 0))
  return (
    <div style={{ minHeight }}>
      <WoqlPlaygroundClient {...props} />
    </div>
  )
}
