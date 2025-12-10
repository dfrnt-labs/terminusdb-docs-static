'use client'

import React from 'react'

export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 my-6">
      <table className="min-w-full">
        {children}
      </table>
    </div>
  )
}
