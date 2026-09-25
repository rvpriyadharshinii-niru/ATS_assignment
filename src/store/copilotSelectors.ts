import type { CopilotTurn } from '../types/copilot'
import { useAppStore } from './useAppStore'

// A stable reference for the "no active conversation" case — returning a fresh
// [] from the selector on every call makes Zustand think the state changed on
// every render (infinite update loop).
const EMPTY_TURNS: CopilotTurn[] = []

export function useActiveConversationTurns(): CopilotTurn[] {
  return useAppStore((state) => {
    const id = state.activeConversationId
    if (!id) return EMPTY_TURNS
    return state.conversations[id]?.turns ?? EMPTY_TURNS
  })
}
