function TerminusDBMark() {
  return (
    <svg
      viewBox="0 0 45 50"
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <linearGradient
        id="tdbPoweredByGradient"
        x1={3.317}
        x2={41.544}
        y1={13.993}
        y2={36.064}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#ffdf79" />
        <stop offset={0.5} stopColor="#c178af" />
        <stop offset={0.8} stopColor="#3d54a0" />
      </linearGradient>
      <path
        fill="url(#tdbPoweredByGradient)"
        d="M18.49 25.03c0 2.17 1.77 3.94 3.94 3.94s3.94-1.77 3.94-3.94-1.77-3.94-3.94-3.94-3.94 1.77-3.94 3.94zm5.46 0a1.52 1.52 0 1 1-3.039.001 1.52 1.52 0 0 1 3.039-.001zm5.29-11c-2.04-1.27-4.4-1.94-6.81-1.94-7.13 0-12.93 5.8-12.93 12.93 0 2.39.66 4.73 1.91 6.76.35.57.17 1.31-.4 1.66-.2.12-.42.18-.63.18-.41 0-.8-.2-1.03-.58a15.305 15.305 0 0 1-2.26-8.02c0-8.46 6.88-15.35 15.35-15.35 2.86 0 5.66.79 8.08 2.3.57.35.74 1.1.39 1.66-.36.58-1.1.75-1.67.4zm6.37 3.13c1.42 2.37 2.17 5.09 2.17 7.87 0 8.46-6.88 15.35-15.35 15.35-2.97 0-5.86-.85-8.34-2.46a1.21 1.21 0 0 1-.36-1.67 1.21 1.21 0 0 1 1.67-.36c2.09 1.36 4.52 2.07 7.03 2.07 7.13 0 12.93-5.8 12.93-12.93 0-2.34-.63-4.63-1.83-6.63-.34-.57-.16-1.31.42-1.65.58-.35 1.32-.16 1.66.41zm1.32 24.83c0 1.23-1 2.23-2.23 2.23-.35 0-.67-.09-.97-.23a22.084 22.084 0 0 1-11.3 3.11C10.26 47.1.36 37.2.36 25.03c0-4.28 1.22-8.42 3.54-11.99a1.21 1.21 0 0 1 1.67-.36c.56.36.72 1.11.36 1.67a19.59 19.59 0 0 0-3.15 10.68c0 10.84 8.82 19.65 19.65 19.65 3.54 0 7.02-.95 10.04-2.76.03-1.2 1.01-2.17 2.22-2.17 1.24.01 2.24 1 2.24 2.24zm7.57-16.96c0 4.12-1.14 8.14-3.3 11.62-.23.37-.62.57-1.03.57a1.204 1.204 0 0 1-1.03-1.84c1.92-3.1 2.94-6.68 2.94-10.35 0-10.84-8.82-19.65-19.65-19.65-3.62 0-7.15.99-10.22 2.87a2.222 2.222 0 0 1-2.22 2.12c-1.23 0-2.23-1-2.23-2.23s1-2.23 2.23-2.23c.36 0 .7.1 1.01.25 3.44-2.09 7.39-3.19 11.43-3.19C34.6 2.96 44.5 12.86 44.5 25.03z"
      />
    </svg>
  )
}

export function PoweredByTerminusDB() {
  return (
    <a
      href="/docs/versioned-search/"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-300"
    >
      Powered by
      <TerminusDBMark />
      <span className="font-semibold text-[#3d55a2] dark:text-white">
        TerminusDB
      </span>
      hybrid search
    </a>
  )
}
