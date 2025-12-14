'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'

interface TaskHeadingProps {
  id: string
  level?: 2 | 3 | 4
  number?: string
  children: React.ReactNode
  className?: string
}

const STORAGE_KEY = 'terminusdb_tasks'

function getTaskStatus(taskId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return tasks[taskId] || false
  } catch {
    return false
  }
}

function setTaskStatus(taskId: string, completed: boolean): void {
  if (typeof window === 'undefined') return
  try {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    tasks[taskId] = completed
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    
    // Track task completion with Plausible
    if (typeof window !== 'undefined') {
      const w = window as any
      w.plausible = w.plausible || function() { (w.plausible.q = w.plausible.q || []).push(arguments) }
      w.plausible('task_completion', { 
        props: { 
          task_id: taskId,
          completed: completed 
        }
      })
    }
    
    // Track task completion with Pagesense
    if (typeof window !== 'undefined') {
      const w = window as any
      w.pagesense = w.pagesense || []
      if (w.$PS && typeof w.$PS.trackEvent === 'function') {
        w.$PS.trackEvent('task_completion', { task_id: taskId, completed: completed })
      } else {
        w.pagesense.push(['trackEvent', 'task_completion'])
      }
    }
  } catch (error) {
    console.error('Failed to save task status:', error)
  }
}

export function TaskHeading({
  id,
  level = 2,
  number,
  children,
  className,
}: TaskHeadingProps) {
  const [completed, setCompleted] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCompleted(getTaskStatus(id))
  }, [id])

  const handleToggle = () => {
    const newStatus = !completed
    setCompleted(newStatus)
    setTaskStatus(id, newStatus)
  }

  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements

  return (
    <HeadingTag
      id={id}
      className={clsx(
        'group scroll-mt-24 relative',
        level === 2 && 'text-2xl font-bold tracking-tight text-slate-900 dark:text-white',
        level === 3 && 'text-xl font-semibold tracking-tight text-slate-900 dark:text-white',
        level === 4 && 'text-lg font-semibold tracking-tight text-slate-900 dark:text-white',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {number && (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
              {number}
            </span>
          )}
          <a
            href={`#${id}`}
            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            {children}
          </a>
        </div>
        
        {mounted && (
          <button
            onClick={handleToggle}
            className={clsx(
              'flex-shrink-0 h-6 w-6 rounded border-2 transition-all duration-200',
              'hover:scale-110 active:scale-95',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
              completed
                ? 'bg-sky-600 border-sky-600 dark:bg-sky-500 dark:border-sky-500'
                : 'bg-white border-slate-300 hover:border-sky-400 dark:bg-slate-800 dark:border-slate-600 dark:hover:border-sky-500'
            )}
            aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
            aria-pressed={completed}
          >
            {completed && (
              <svg
                className="h-full w-full text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </HeadingTag>
  )
}
