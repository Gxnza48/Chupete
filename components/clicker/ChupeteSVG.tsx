"use client";

import { motion } from "framer-motion";

interface ChupeteSVGProps {
  size?: number;
  onClick?: () => void;
  isAnimating?: boolean;
  disabled?: boolean;
}

export default function ChupeteSVG({
  size = 200,
  onClick,
  isAnimating = false,
  disabled = false,
}: ChupeteSVGProps) {
  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      animate={isAnimating ? { scale: [1, 0.88, 1.04, 1] } : {}}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={disabled ? {} : { scale: 1.04 }}
      className="select-none"
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-block",
        opacity: disabled ? 0.4 : 1,
        filter: disabled
          ? "grayscale(1)"
          : isAnimating
          ? "drop-shadow(0 0 18px rgba(255,255,255,0.35))"
          : "drop-shadow(0 4px 24px rgba(255,255,255,0.12))",
        transition: "filter 0.2s",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Chupete"
        role="img"
      >
        <defs>
          {/* Shield gradient */}
          <radialGradient
            id="shieldGrad"
            cx="42%"
            cy="38%"
            r="58%"
            fx="38%"
            fy="34%"
          >
            <stop offset="0%" stopColor="#e8e8e8" />
            <stop offset="40%" stopColor="#c5c5c5" />
            <stop offset="100%" stopColor="#888" />
          </radialGradient>

          {/* Nipple gradient */}
          <linearGradient id="nippleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d0d0d0" />
            <stop offset="40%" stopColor="#f0f0f0" />
            <stop offset="70%" stopColor="#b8b8b8" />
            <stop offset="100%" stopColor="#909090" />
          </linearGradient>

          {/* Ring gradient */}
          <linearGradient
            id="ringGrad"
            x1="20%"
            y1="20%"
            x2="80%"
            y2="80%"
          >
            <stop offset="0%" stopColor="#d8d8d8" />
            <stop offset="50%" stopColor="#a0a0a0" />
            <stop offset="100%" stopColor="#787878" />
          </linearGradient>

          {/* Shield highlight */}
          <radialGradient
            id="shieldHighlight"
            cx="30%"
            cy="25%"
            r="45%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Outer glow filter */}
          <filter id="outerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="8"
              floodColor="rgba(0,0,0,0.7)"
            />
          </filter>
        </defs>

        {/* === SHIELD / GUARD === */}
        {/* Shadow ellipse */}
        <ellipse
          cx="100"
          cy="118"
          rx="62"
          ry="8"
          fill="rgba(0,0,0,0.5)"
          style={{ filter: "blur(6px)" }}
        />

        {/* Main shield body */}
        <ellipse
          cx="100"
          cy="105"
          rx="60"
          ry="44"
          fill="url(#shieldGrad)"
          stroke="rgba(80,80,80,0.8)"
          strokeWidth="1.5"
          filter="url(#softShadow)"
        />

        {/* Shield inner bevel */}
        <ellipse
          cx="100"
          cy="105"
          rx="53"
          ry="38"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />

        {/* Shield highlight top-left */}
        <ellipse
          cx="100"
          cy="105"
          rx="60"
          ry="44"
          fill="url(#shieldHighlight)"
        />

        {/* Bottom shadow for 3D */}
        <ellipse
          cx="102"
          cy="120"
          rx="45"
          ry="18"
          fill="rgba(0,0,0,0.22)"
          style={{ mixBlendMode: "multiply" }}
        />

        {/* Decorative dots on shield */}
        <circle cx="85" cy="97" r="2.5" fill="rgba(255,255,255,0.25)" />
        <circle cx="100" cy="92" r="2.5" fill="rgba(255,255,255,0.25)" />
        <circle cx="115" cy="97" r="2.5" fill="rgba(255,255,255,0.25)" />
        <circle cx="92" cy="110" r="2" fill="rgba(255,255,255,0.2)" />
        <circle cx="108" cy="110" r="2" fill="rgba(255,255,255,0.2)" />

        {/* === NIPPLE / TEAT === */}
        {/* Nipple base (wider, attaches to shield) */}
        <ellipse
          cx="100"
          cy="74"
          rx="14"
          ry="8"
          fill="url(#nippleGrad)"
          stroke="rgba(100,100,100,0.6)"
          strokeWidth="1"
        />

        {/* Nipple body */}
        <path
          d="M 88 74 Q 86 58 90 50 Q 94 44 100 44 Q 106 44 110 50 Q 114 58 112 74 Z"
          fill="url(#nippleGrad)"
          stroke="rgba(100,100,100,0.6)"
          strokeWidth="1"
        />

        {/* Nipple tip */}
        <ellipse
          cx="100"
          cy="44"
          rx="10"
          ry="6"
          fill="#e0e0e0"
          stroke="rgba(100,100,100,0.5)"
          strokeWidth="1"
        />

        {/* Nipple highlight */}
        <path
          d="M 91 72 Q 90 58 93 50 Q 95 46 98 45"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* === RING / HANDLE === */}
        {/* Outer ring */}
        <circle
          cx="100"
          cy="155"
          r="22"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          filter="url(#outerGlow)"
        />

        {/* Ring highlight */}
        <path
          d="M 84 144 Q 78 155 84 166"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Ring connector to shield */}
        <rect
          x="95"
          y="147"
          width="10"
          height="12"
          rx="3"
          fill="url(#ringGrad)"
          stroke="rgba(80,80,80,0.5)"
          strokeWidth="1"
        />

        {/* Ring center hole highlight */}
        <circle
          cx="100"
          cy="155"
          r="14"
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      </svg>
    </motion.div>
  );
}
