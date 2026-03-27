'use client';

import { useEffect, useState } from 'react';

import { BLUEPRINT_PHASE } from '@/lib/blueprint-phase';

export default function BlueprintOverlay({
  isVisible,
  phase = BLUEPRINT_PHASE.SCANNING,
  onRevealComplete,
  acceleratedReveal = false,
}) {
  const [internalPhase, setInternalPhase] = useState(phase);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setInternalPhase(phase);
  }, [phase]);

  useEffect(() => {
    if (internalPhase === BLUEPRINT_PHASE.REVEAL) {
      const duration = acceleratedReveal ? 300 : 600;
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onRevealComplete?.();
        }, 50);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [internalPhase, acceleratedReveal, onRevealComplete]);

  if (!isVisible && !isExiting) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        zIndex: 'var(--z-overlay)',
        background: 'var(--color-bg-app)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateY(20px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: `opacity ${acceleratedReveal ? '300ms' : '600ms'} cubic-bezier(0.16, 1, 0.3, 1), transform ${acceleratedReveal ? '300ms' : '600ms'} cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, var(--color-border-subtle) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {internalPhase === BLUEPRINT_PHASE.SCANNING && (
        <div
          className="absolute left-0 right-0 h-0.5"
          style={{
            background: 'var(--color-accent)',
            boxShadow: '0 0 15px 2px var(--color-accent-alpha10), 0 0 30px 4px var(--color-accent-alpha10)',
            animation: 'scan 2s cubic-bezier(0.45, 0, 0.55, 1) infinite',
          }}
        />
      )}

      {internalPhase === BLUEPRINT_PHASE.DRAFTING && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-3 p-8" style={{ maxWidth: '280px' }}>
            {Array.from({ length: 16 }).map((_, index) => {
              const heights = [20, 32, 24, 40, 28, 36, 22, 30, 26, 38, 20, 34, 28, 24, 32, 26];
              const delays = [0, 0.1, 0.2, 0.15, 0.25, 0.3, 0.05, 0.2, 0.35, 0.1, 0.4, 0.25, 0.15, 0.3, 0.05, 0.2];

              return (
                <div
                  key={index}
                  className="rounded"
                  style={{
                    height: `${heights[index]}px`,
                    background: 'var(--color-border-subtle)',
                    animation: 'pulse-draft 1.5s ease infinite',
                    animationDelay: `${delays[index]}s`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {internalPhase === BLUEPRINT_PHASE.REVEAL && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
            Diagram ready
          </div>
        </div>
      )}
    </div>
  );
}

BlueprintOverlay.PHASE = BLUEPRINT_PHASE;
