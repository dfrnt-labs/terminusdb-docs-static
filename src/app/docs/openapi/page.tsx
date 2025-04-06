'use client'
import { useTheme } from 'next-themes'
import { SwaggerDark } from './SwaggerDark'
import { SwaggerLight } from './SwaggerLight'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'
// const SwaggerUI = dynamic(import('swagger-ui-react'), { ssr: false })

const OpenApi = () => {
  return (
    <div className="w-full max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <article className="w-full max-w-none">
        <div className="">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">
            OpenAPI spec
          </h2>
          <div className="mt-8 rounded-md bg-slate-50 py-1">
            <SwaggerLight />
          </div>
        </div>
      </article>
    </div>
  )
}

export default OpenApi
