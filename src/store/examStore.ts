'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CheckpointId, CheckpointState, CheckpointStatus,
  ExamSession, ExamStatus, Produk, Toko, CP_ORDER
} from '@/types'
import { CP_ORDER as cpOrder } from '@/types'

interface ExamStore {
  hydrated: boolean
  session: ExamSession | null
  // Actions
  setHydrated: (value: boolean) => void
  setSession: (s: ExamSession) => void
  startExam: () => void
  lockExam: () => void
  submitExam: () => void
  setCheckpointStatus: (
    cp: CheckpointId,
    status: CheckpointStatus,
    screenshots?: string | string[]
  ) => void
  clearSession: () => void
  // Computed helpers
  activeCheckpoint: () => CheckpointId | null
  completedCount: () => number
  totalScore: () => number
}

function buildInitialCheckpoints(): Record<CheckpointId, CheckpointState> {
  const cps = {} as Record<CheckpointId, CheckpointState>
  cpOrder.forEach((cp) => {
    cps[cp] = { status: 'active' }
  })
  return cps
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      session: null,

      setHydrated: (value) => set({ hydrated: value }),

      setSession: (s) => set({ session: s }),

      startExam: () =>
        set((state) => {
          if (!state.session) return state
          return {
            session: {
              ...state.session,
              status: 'started' as ExamStatus,
              startedAt: new Date().toISOString(),
            },
          }
        }),

      lockExam: () =>
        set((state) => {
          if (!state.session) return state
          return { session: { ...state.session, status: 'locked' as ExamStatus } }
        }),

      submitExam: () =>
        set((state) => {
          if (!state.session) return state
          return {
            session: {
              ...state.session,
              status: 'submitted' as ExamStatus,
              submittedAt: new Date().toISOString(),
            },
          }
        }),

      setCheckpointStatus: (cp, status, screenshots) =>
        set((state) => {
          if (!state.session) return state
          const checkpoints = { ...state.session.checkpoints }
          const currentUrls = checkpoints[cp].screenshotUrls?.length
            ? checkpoints[cp].screenshotUrls
            : checkpoints[cp].screenshotUrl
              ? [checkpoints[cp].screenshotUrl]
              : []
          const screenshotUrls = Array.isArray(screenshots)
            ? screenshots
            : screenshots
              ? [screenshots]
              : currentUrls

          checkpoints[cp] = {
            ...checkpoints[cp],
            status,
            screenshotUrl: screenshotUrls[0],
            screenshotUrls,
            ...(status === 'done' ? { completedAt: new Date().toISOString() } : {}),
          }

          return { session: { ...state.session, checkpoints } }
        }),

      clearSession: () => set({ session: null }),

      activeCheckpoint: () => {
        const s = get().session
        if (!s) return null
        return cpOrder.find((cp) => s.checkpoints[cp].status === 'active') ?? null
      },

      completedCount: () => {
        const s = get().session
        if (!s) return 0
        return cpOrder.filter((cp) => s.checkpoints[cp].status === 'done').length
      },

      totalScore: () => 0, // placeholder — real score from Sheets after dosen input
    }),
    {
      name: 'uas-ecom-exam-v1',
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)

export { buildInitialCheckpoints }
