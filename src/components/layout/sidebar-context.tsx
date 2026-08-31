"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
  toggleCollapse: () => void;
  setIsCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  isCollapsed: false,
  toggle: () => {},
  close: () => {},
  open: () => {},
  toggleCollapse: () => {},
  setIsCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load saved collapsed state from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cuti_pgtk_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage errors
    }

    // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggleCollapse();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cuti_pgtk_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleSetIsCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsed((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      try {
        localStorage.setItem("cuti_pgtk_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isCollapsed,
        toggle: () => setIsOpen((prev) => !prev),
        close: () => setIsOpen(false),
        open: () => setIsOpen(true),
        toggleCollapse: handleToggleCollapse,
        setIsCollapsed: handleSetIsCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

