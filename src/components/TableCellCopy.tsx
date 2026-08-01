'use client'

import { useEffect, useRef } from 'react'

const COPY_ICON = `<svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M10.5 1h-7A1.5 1.5 0 0 0 2 2.5v9a.5.5 0 0 0 1 0v-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 0 0-1Z"/><path d="M12.5 3h-7A1.5 1.5 0 0 0 4 4.5v9A1.5 1.5 0 0 0 5.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 12.5 3Zm.5 10.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v9Z"/></svg>`
const CHECK_ICON = `<svg class="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd"/></svg>`

export function TableCellCopy() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current?.querySelector('.prose') ?? document.querySelector('.prose')
    if (!container) return

    const tables = container.querySelectorAll('table')
    if (tables.length === 0) return

    const buttons: HTMLButtonElement[] = []

    tables.forEach((table) => {
      const cells = table.querySelectorAll('td')
      cells.forEach((cell) => {
        // Skip cells that are empty or only whitespace
        const text = cell.textContent?.trim()
        if (!text) return

        // Skip cells that already have a copy button (e.g. from ResultPanel)
        if (cell.querySelector('button[aria-label*="Copy"]')) return

        const btn = document.createElement('button')
        btn.innerHTML = COPY_ICON
        btn.className =
          'absolute top-1 right-1 inline-flex items-center rounded p-0.5 text-slate-400 opacity-0 transition-opacity group-hover/cell:opacity-100 focus:opacity-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded dark:text-slate-500 dark:hover:text-slate-300'
        btn.setAttribute('aria-label', `Copy ${text.length > 8 ? text.substring(0, 8) + '…' : text}`)
        btn.style.cursor = 'pointer'

        btn.addEventListener('click', async (e) => {
          e.preventDefault()
          e.stopPropagation()
          try {
            await navigator.clipboard.writeText(text)
            btn.innerHTML = CHECK_ICON
            setTimeout(() => {
              btn.innerHTML = COPY_ICON
            }, 2000)
          } catch {
            // Fallback: no-op
          }
        })

        // Make td relative for absolute positioning of button, add group/cell for hover reveal
        cell.classList.add('group/cell', 'relative')
        cell.appendChild(btn)
        buttons.push(btn)
      })
    })

    return () => {
      buttons.forEach((btn) => {
        const cell = btn.parentElement
        btn.remove()
        cell?.classList.remove('group/cell', 'relative')
      })
    }
  }, [])

  return <div ref={containerRef} className="contents" />
}
