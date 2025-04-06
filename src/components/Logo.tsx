import * as React from 'react'
export const Logo: React.FC<{className?: string}> = (props) => (
  <svg
    className={props.className}
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    id="Layer_1"
    x={0}
    y={0}
    {...props}
  >
    <style>{'.st0{fill:#3d55a2}'}</style>
    <path
      d="M55.81 21.5v15.6h3.46V21.5h-3.46zm-6.23-6.68v3.33h16.1v-3.33h-16.1zM80.27 34.91h-.03c-.68.66-1.61 1.24-2.8 1.75-1.19.51-2.43.76-3.72.76-1.74 0-3.27-.37-4.6-1.1a7.9 7.9 0 0 1-3.1-3.02c-.74-1.29-1.11-2.74-1.11-4.38 0-1.87.39-3.46 1.18-4.79.79-1.33 1.83-2.34 3.12-3.06 1.29-.71 2.71-1.06 4.23-1.06 1.4 0 2.67.34 3.82 1.03s2.06 1.64 2.74 2.85c.68 1.21 1.02 2.62 1.02 4.23l-.03 1.4h-12.8c.19 1.51.81 2.7 1.86 3.58 1.05.88 2.38 1.32 3.99 1.32 1.17 0 2.11-.22 2.83-.65.72-.44 1.31-.85 1.78-1.26l1.62 2.4zm-6.84-11.87c-1.25 0-2.34.29-3.28.88-.93.58-1.55 1.59-1.85 3.01h9.36v-.23c-.06-.72-.3-1.36-.72-1.91-.41-.55-.93-.98-1.54-1.29-.62-.31-1.27-.46-1.97-.46zM93.93 23.93c-.21-.11-.47-.2-.78-.27-.31-.08-.63-.11-.97-.11-.68 0-1.35.17-2.01.52-.66.35-1.2.85-1.64 1.5-.44.65-.65 1.42-.65 2.31v9.23h-3.31V20.4h3.31v3.15A6.146 6.146 0 0 1 90 21.03c.94-.66 1.94-.99 2.98-.99.78 0 1.39.11 1.81.32l-.86 3.57zM105.9 20.11c1.38 0 2.48.31 3.31.94s1.42 1.48 1.78 2.56c.3-.53.73-1.07 1.31-1.61.57-.54 1.24-.99 2.01-1.35.76-.36 1.58-.54 2.45-.54 1.44 0 2.57.31 3.37.94.81.63 1.37 1.46 1.7 2.52.33 1.05.49 2.22.49 3.52v10.03h-3.31v-9.84c0-1.23-.23-2.23-.7-2.99-.47-.76-1.35-1.15-2.64-1.15-1.23 0-2.24.39-3.04 1.16-.8.77-1.19 1.72-1.19 2.82v10h-3.31v-9.9c0-1.19-.26-2.17-.76-2.93-.51-.76-1.35-1.15-2.52-1.15-.81 0-1.53.18-2.16.54-.64.36-1.14.83-1.5 1.42-.36.58-.54 1.24-.54 1.96v10.06h-3.31V20.4h3.31v2.67c.51-.76 1.23-1.45 2.15-2.05.92-.61 1.95-.91 3.1-.91zM128.91 16.77c-.74 0-1.29-.19-1.66-.57-.36-.38-.54-.88-.54-1.5 0-.53.18-1.01.54-1.43s.91-.64 1.66-.64c.74 0 1.29.19 1.66.57.36.38.54.88.54 1.49 0 .53-.18 1.01-.54 1.43-.36.43-.91.65-1.66.65zm1.69 20.34h-3.28V20.4h3.28v16.71zM144.32 20.05c1.51 0 2.67.31 3.5.92.83.62 1.41 1.44 1.74 2.48.33 1.04.49 2.2.49 3.47v10.19h-3.28v-9.96c0-.81-.11-1.53-.32-2.16-.21-.64-.57-1.14-1.08-1.5-.51-.36-1.22-.51-2.13-.45-.85 0-1.6.18-2.26.54-.66.36-1.18.84-1.56 1.43s-.57 1.25-.57 1.97V37.1h-3.28V20.4h3.28v2.64c.51-.79 1.25-1.48 2.23-2.09.97-.6 2.05-.9 3.24-.9zM165.91 30.46V20.4h3.28v16.71h-3.28v-2.67c-.49.79-1.2 1.48-2.15 2.09-.94.6-2.08.91-3.39.91-1.74 0-3.15-.59-4.23-1.78-1.08-1.19-1.62-2.83-1.62-4.94V20.4h3.28v9.42c0 .85.13 1.63.4 2.36.27.72.69 1.3 1.27 1.73.58.44 1.33.65 2.24.65 1.15 0 2.13-.36 2.96-1.08.82-.72 1.24-1.73 1.24-3.02zM183.42 24.79a7.895 7.895 0 0 0-2.02-1.46c-.75-.38-1.45-.58-2.08-.58-.45 0-.89.05-1.32.16-.44.11-.8.3-1.1.59-.3.29-.45.71-.45 1.26.02.76.37 1.3 1.04 1.62.67.32 1.5.61 2.5.86.87.23 1.72.53 2.55.88.83.35 1.51.86 2.05 1.53s.81 1.61.81 2.82c0 1.04-.29 1.93-.88 2.67-.58.74-1.34 1.31-2.26 1.7-.92.39-1.89.59-2.91.59-1.21 0-2.4-.22-3.58-.65-1.18-.44-2.18-1.18-3.01-2.24l2.23-1.91c.57.66 1.23 1.17 1.96 1.54.73.37 1.63.56 2.69.56.4 0 .81-.07 1.21-.21.4-.14.75-.36 1.04-.67.29-.31.43-.73.43-1.26 0-.51-.15-.91-.46-1.19-.31-.29-.72-.52-1.23-.7-.51-.18-1.07-.34-1.69-.49-.91-.26-1.81-.57-2.69-.94-.88-.37-1.61-.9-2.2-1.59-.58-.69-.87-1.63-.87-2.82 0-1 .28-1.85.84-2.56.56-.71 1.3-1.26 2.21-1.66.91-.39 1.89-.59 2.93-.59 1 0 2.08.21 3.25.64 1.17.42 2.13 1.1 2.9 2.04l-1.89 2.06zM199.91 14.83c1.72 0 3.23.29 4.54.88 1.31.58 2.39 1.39 3.26 2.42.87 1.03 1.53 2.22 1.97 3.57s.67 2.77.67 4.28c0 2.04-.39 3.9-1.18 5.59a9.406 9.406 0 0 1-3.5 4.04c-1.55 1.01-3.47 1.51-5.76 1.51h-8.72V14.83h8.72zm-.16 18.97c1.68 0 3.04-.35 4.08-1.06 1.04-.71 1.8-1.66 2.29-2.85.49-1.19.73-2.49.73-3.92 0-1.4-.24-2.69-.73-3.88a6.403 6.403 0 0 0-2.29-2.87c-1.04-.72-2.4-1.08-4.08-1.08h-5.12V33.8h5.12zM222.63 14.83c2.16 0 3.8.48 4.9 1.43 1.1.95 1.66 2.34 1.66 4.17 0 1-.24 1.89-.72 2.68-.48.79-1.18 1.4-2.12 1.84.7.23 1.35.59 1.96 1.07.6.48 1.1 1.09 1.48 1.83.38.74.57 1.65.57 2.71 0 1.3-.22 2.37-.67 3.22-.45.85-1.03 1.52-1.75 2.01-.72.49-1.52.83-2.39 1.04-.87.2-1.74.3-2.61.3h-9.61v-22.3h9.3zm-.58 3.31h-5.28v5.92h5.67c.87-.02 1.64-.28 2.31-.8.67-.51 1-1.23 1-2.17 0-1.06-.35-1.82-1.07-2.27-.71-.46-1.59-.68-2.63-.68zm.54 9.23h-5.83v6.43h5.98c1.21 0 2.2-.27 2.96-.81.76-.54 1.15-1.37 1.15-2.5 0-.81-.22-1.43-.67-1.88-.45-.45-.99-.76-1.64-.95-.63-.2-1.29-.29-1.95-.29z"
      className="st0"
    />
    <linearGradient
      id="SVGID_1_"
      x1={3.317}
      x2={41.544}
      y1={13.993}
      y2={36.064}
      gradientUnits="userSpaceOnUse"
    >
      <stop
        offset={0}
        style={{
          stopColor: '#ffdf79',
        }}
      />
      <stop
        offset={0.5}
        style={{
          stopColor: '#c178af',
        }}
      />
      <stop
        offset={0.8}
        style={{
          stopColor: '#3d54a0',
        }}
      />
    </linearGradient>
    <path
      d="M18.49 25.03c0 2.17 1.77 3.94 3.94 3.94s3.94-1.77 3.94-3.94-1.77-3.94-3.94-3.94-3.94 1.77-3.94 3.94zm5.46 0a1.52 1.52 0 1 1-3.039.001 1.52 1.52 0 0 1 3.039-.001zm5.29-11c-2.04-1.27-4.4-1.94-6.81-1.94-7.13 0-12.93 5.8-12.93 12.93 0 2.39.66 4.73 1.91 6.76.35.57.17 1.31-.4 1.66-.2.12-.42.18-.63.18-.41 0-.8-.2-1.03-.58a15.305 15.305 0 0 1-2.26-8.02c0-8.46 6.88-15.35 15.35-15.35 2.86 0 5.66.79 8.08 2.3.57.35.74 1.1.39 1.66-.36.58-1.1.75-1.67.4zm6.37 3.13c1.42 2.37 2.17 5.09 2.17 7.87 0 8.46-6.88 15.35-15.35 15.35-2.97 0-5.86-.85-8.34-2.46a1.21 1.21 0 0 1-.36-1.67 1.21 1.21 0 0 1 1.67-.36c2.09 1.36 4.52 2.07 7.03 2.07 7.13 0 12.93-5.8 12.93-12.93 0-2.34-.63-4.63-1.83-6.63-.34-.57-.16-1.31.42-1.65.58-.35 1.32-.16 1.66.41zm1.32 24.83c0 1.23-1 2.23-2.23 2.23-.35 0-.67-.09-.97-.23a22.084 22.084 0 0 1-11.3 3.11C10.26 47.1.36 37.2.36 25.03c0-4.28 1.22-8.42 3.54-11.99a1.21 1.21 0 0 1 1.67-.36c.56.36.72 1.11.36 1.67a19.59 19.59 0 0 0-3.15 10.68c0 10.84 8.82 19.65 19.65 19.65 3.54 0 7.02-.95 10.04-2.76.03-1.2 1.01-2.17 2.22-2.17 1.24.01 2.24 1 2.24 2.24zm7.57-16.96c0 4.12-1.14 8.14-3.3 11.62-.23.37-.62.57-1.03.57a1.204 1.204 0 0 1-1.03-1.84c1.92-3.1 2.94-6.68 2.94-10.35 0-10.84-8.82-19.65-19.65-19.65-3.62 0-7.15.99-10.22 2.87a2.222 2.222 0 0 1-2.22 2.12c-1.23 0-2.23-1-2.23-2.23s1-2.23 2.23-2.23c.36 0 .7.1 1.01.25 3.44-2.09 7.39-3.19 11.43-3.19C34.6 2.96 44.5 12.86 44.5 25.03z"
      style={{
        fill: 'url(#SVGID_1_)',
      }}
    />
  </svg>
)