'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function SpotlightEffects() {
  // Spotlight motion values (tracks mouse)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const spotY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  const spotlightMask = useTransform([spotX, spotY], (latest: number[]) => {
    const [x, y] = latest;
    return `radial-gradient(650px circle at ${x}px ${y}px, transparent 0%, transparent 20%, rgba(0,0,0,0.20) 45%, rgba(0,0,0,0.42) 70%, rgba(0,0,0,0.52) 100%)`;
  });

  const glowX = useTransform(spotX, (v: number) => v - 350);
  const glowY = useTransform(spotY, (v: number) => v - 350);

  useEffect(() => {
    // Initialize on client side only
    mouseX.set(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
    mouseY.set(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Mouse Spotlight Overlay (masked dark layer - reveals content near cursor) */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-[25]"
        style={{
          background: 'rgba(6,12,28,0.38)',
          WebkitMaskImage: spotlightMask,
          maskImage: spotlightMask,
        }}
      />
      {/* Teal glow orb follows cursor */}
      <motion.div
        className="fixed pointer-events-none z-[24] rounded-full"
        style={{
          width: 700,
          height: 700,
          background: 'radial-gradient(circle, rgba(59, 130, 246,0.15) 0%, rgba(56,189,248,0.09) 35%, transparent 70%)',
          filter: 'blur(25px)',
          x: glowX,
          y: glowY,
        }}
      />
    </>
  );
}
