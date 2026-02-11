import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Auto-resize a textarea to fit its content. Use as onInput handler. */
export function autoResize(e: React.FormEvent<HTMLTextAreaElement>) {
  const target = e.currentTarget
  target.style.height = "auto"
  target.style.height = target.scrollHeight + "px"
}

/** Ref callback that auto-sizes a textarea on mount. Pair with onInput={autoResize}. */
export function autoResizeRef(el: HTMLTextAreaElement | null) {
  if (el) {
    el.style.height = "auto"
    el.style.height = el.scrollHeight + "px"
  }
}
