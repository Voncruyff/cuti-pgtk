/**
 * Centralized Motion System - CUTI PGTK
 * Standards inspired by 60fps.design, Linear, Vercel, and Raycast.
 * Subtle, snappy, enterprise-grade physics and transitions.
 */

import { type Variants, type Transition } from "motion/react";

// ==================== 1. TIMING TOKENS (Seconds) ====================
export const DURATION = {
  instant: 0.08,
  fast: 0.14,    // Micro-interactions, button active, icon rotations (120-160ms)
  normal: 0.20,  // Page transitions, dropdowns, tab glide (180-220ms)
  slow: 0.28,    // Modals, drawers (250-320ms)
} as const;

// ==================== 2. EASINGS & SPRING PHYSICS ====================
export const EASING = {
  // Modern snappy cubic-bezier (natural deceleration curve)
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  in: [0.7, 0, 0.84, 0] as [number, number, number, number],
  inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

export const SPRING = {
  // Snappy spring for quick responsive actions (tabs, buttons)
  snappy: {
    type: "spring",
    stiffness: 420,
    damping: 32,
    mass: 0.9,
  } as const,
  // Gentle spring for modals, dropdowns
  gentle: {
    type: "spring",
    stiffness: 320,
    damping: 28,
    mass: 1,
  } as const,
  // Bouncy spring (strictly restrained for enterprise micro-interactions)
  bouncy: {
    type: "spring",
    stiffness: 380,
    damping: 25,
    mass: 0.85,
  } as const,
} as const;

// ==================== 3. REUSABLE ANIMATION VARIANTS ====================

/**
 * Modal / Dialog Backdrop
 * Fades in gently with backdrop blur
 */
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: "easeOut" } as Transition,
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: "easeIn" } as Transition,
  },
};

/**
 * Modal / Dialog Content Container
 * Scale 0.97 -> 1, TranslateY 8px -> 0
 */
export const modalContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.97,
    y: 8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASING.out } as Transition,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: DURATION.fast, ease: "easeIn" } as Transition,
  },
};

/**
 * Dropdown / Popover / Select Menu
 * Snappy 150ms micro-dropdown
 */
export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: -4,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: EASING.out } as Transition,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: { duration: 0.12, ease: "easeIn" } as Transition,
  },
};

/**
 * Content / Page Transition (Dashboard Shell)
 * Smooth, non-distracting vertical slide (6px) and fade
 */
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 6,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASING.out } as Transition,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATION.fast, ease: "easeIn" } as Transition,
  },
};

/**
 * Accordion Expand / Collapse (FAQ, Collapsible sections)
 * Smooth height animation without jitter
 */
export const accordionVariants: Variants = {
  initial: {
    height: 0,
    opacity: 0,
  },
  animate: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.22, ease: EASING.out },
      opacity: { duration: 0.18, ease: "easeOut" },
    } as Transition,
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.18, ease: "easeInOut" },
      opacity: { duration: 0.12, ease: "easeIn" },
    } as Transition,
  },
};

/**
 * Calendar Month Navigation Slide
 */
export const calendarSlideVariants = (direction: number): Variants => ({
  initial: {
    opacity: 0,
    x: direction > 0 ? 6 : -6,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: EASING.out } as Transition,
  },
  exit: {
    opacity: 0,
    x: direction > 0 ? -6 : 6,
    transition: { duration: 0.14, ease: "easeIn" } as Transition,
  },
});

/**
 * Simple Fade In
 */
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: "easeOut" } as Transition,
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: "easeIn" } as Transition,
  },
};
