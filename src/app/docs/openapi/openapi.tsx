'use client'
import { useTheme } from 'next-themes'
import { SwaggerDark } from './SwaggerDark'
import { SwaggerLight } from './SwaggerLight'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'

export default function OpenApiTerminusDB() {
  return (
    <article className="w-full max-w-none">
      <div className="">
        <h2 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">
          OpenAPI spec
        </h2>
        <div className="w-64 mt-8 rounded-md bg-slate-50 py-1">
          <SwaggerLight />
        </div>
      </div>
    </article>
  )
}
