'use client'
import { create } from 'zustand'

interface POSStore {
  sessionId: string | null
  openingCash: number
  isSessionOpen: boolean
  activeTab: 'products' | 'cart' | 'payment'
  searchQuery: string
  selectedCategory: string | null

  setSession: (id: string, openingCash: number) => void
  closeSession: () => void
  setActiveTab: (tab: 'products' | 'cart' | 'payment') => void
  setSearchQuery: (q: string) => void
  setSelectedCategory: (id: string | null) => void
}

export const usePOSStore = create<POSStore>((set) => ({
  sessionId: null,
  openingCash: 0,
  isSessionOpen: false,
  activeTab: 'products',
  searchQuery: '',
  selectedCategory: null,

  setSession: (id, openingCash) => set({ sessionId: id, openingCash, isSessionOpen: true }),
  closeSession: () => set({ sessionId: null, openingCash: 0, isSessionOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCategory: (id) => set({ selectedCategory: id }),
}))
