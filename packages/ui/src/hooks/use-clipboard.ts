"use client"

import { useState, useCallback, useRef, useEffect } from "react"

/**
 * Hook for copying text to clipboard with temporary "copied" feedback state.
 *
 * @param timeout - Duration in ms to show "copied" state (default 2000)
 * @returns { copy, copiedValue, isCopied }
 */
export function useClipboard(timeout = 2000) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const copy = useCallback(
    async (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      try {
        await navigator.clipboard.writeText(value)
      } catch {
        // Fallback for non-secure contexts (e.g., Storybook, extension popup)
        const textArea = document.createElement("textarea")
        textArea.value = value
        textArea.style.position = "fixed"
        textArea.style.left = "-9999px"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }

      setCopiedValue(value)
      timeoutRef.current = setTimeout(() => setCopiedValue(null), timeout)
    },
    [timeout]
  )

  const isCopied = useCallback(
    (value: string) => copiedValue === value,
    [copiedValue]
  )

  return { copy, copiedValue, isCopied }
}
