"use client";

import React, { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  duration?: number; // duration in milliseconds (default: 450ms)
  formatter?: (val: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 450,
  formatter = (v) => v.toLocaleString("id-ID"),
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const currentValRef = useRef(value);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      currentValRef.current = value;
      return;
    }

    const startValue = currentValRef.current;
    const difference = value - startValue;
    if (difference === 0) return;

    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Fast deceleration curve (cubic-bezier approximation)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + difference * easeOut);

      setDisplayValue(current);
      currentValRef.current = current;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(value);
        currentValRef.current = value;
      }
    };

    const animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, [value, duration, prefersReducedMotion]);

  return <span>{formatter(displayValue)}</span>;
}
