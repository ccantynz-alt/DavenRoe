import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Sidebar state
      sidebarOpen: true,
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Active entity context
      activeEntityId: null,
      setActiveEntity: (id) => set({ activeEntityId: id }),

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // Notification preferences
      notificationsEnabled: true,
      toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
    }),
    {
      name: 'astra-app-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeEntityId: state.activeEntityId,
        theme: state.theme,
        notificationsEnabled: state.notificationsEnabled,
      }),
    }
  )
);
