'use client'
import { create } from 'zustand'

import { setLoadingListener } from '@/service'

interface LoadingState {
  /**
   * Requests in flight. A counter rather than a flag, so when two calls
   * overlap the first one to finish does not hide the overlay while the
   * second is still running.
   */
  pending: number
  start: () => void
  stop: () => void
}

export const useLoadingStore = create<LoadingState>((set) => ({
  pending: 0,
  start: () => set((state) => ({ pending: state.pending + 1 })),
  // Floored at zero so a stray stop() can never drive the count negative and
  // leave the overlay stuck on.
  stop: () => set((state) => ({ pending: Math.max(0, state.pending - 1) })),
}))

/**
 * Hands the counter to the API client as soon as this module is evaluated.
 *
 * <p>Done here rather than in the overlay's effect because effects run in tree
 * order: a page that calls the API from its own effect would fire before the
 * overlay mounted and the request would go untracked.
 *
 * <p>Browser only. This module is also evaluated on the server while
 * rendering, and a listener registered there would be shared by every request.
 */
if (typeof window !== 'undefined') {
  const { start, stop } = useLoadingStore.getState()
  setLoadingListener({ start, stop })
}

/** True while at least one tracked request is outstanding. */
export function useIsLoading(): boolean {
  return useLoadingStore((state) => state.pending > 0)
}
