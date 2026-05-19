import { create } from 'zustand'

interface UiState {
  activeModal: string | null
  setActiveModal: (modal: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal })
}))