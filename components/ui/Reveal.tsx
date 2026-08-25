"use client";

import { type ElementType, type ReactNode, useEffect, useRef } from "react";

type RevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
};

export function Reveal({ as: Component = "div", children, className = "" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("isVisible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("isVisible");
          observer.disconnect();
        }
      },
      { threshold: 0.16 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Component ref={ref} className={`reveal ${className}`.trim()}>
      {children}
    </Component>
  );
}
