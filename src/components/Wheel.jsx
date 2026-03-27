import React, { useState, useRef, useCallback } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { CATEGORIES } from '../data/questions'

const SLICE_COUNT = CATEGORIES.length // 9
const SLICE_ANGLE = 360 / SLICE_COUNT // 40°

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function buildSlicePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

const SIZE = 300
const CX = SIZE / 2
const CY = SIZE / 2
const R = SIZE / 2 - 4

export default function Wheel({ onSpinComplete, isMyTurn, initialAngle = 0 }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(initialAngle)
  const controls = useAnimation()
  const wheelRef = useRef(null)

  const spin = useCallback(async () => {
    if (isSpinning || !isMyTurn) return
    setIsSpinning(true)

    // Random spin: 3-5 full rotations + random landing
    const extraRotations = (Math.floor(Math.random() * 5) + 5) * 360
    const randomOffset = Math.random() * 360
    const targetAngle = currentAngle + extraRotations + randomOffset

    const duration = 3.5 + Math.random() * 1.5

    await controls.start({
      rotate: targetAngle,
      transition: {
        duration,
        ease: [0.17, 0.67, 0.16, 0.99], // custom easeOut
      },
    })

    setCurrentAngle(targetAngle)
    setIsSpinning(false)

    // Calculate which slice is at the top (pointer position)
    // The pointer is at the top (0° = 12 o'clock)
    const normalizedAngle = ((targetAngle % 360) + 360) % 360
    // Which category ended up at top pointer (180° from bottom = top)
    // Pointer at top means we need angle that rotated to face top
    const sliceIndex = Math.floor(((360 - normalizedAngle + SLICE_ANGLE / 2) % 360) / SLICE_ANGLE) % SLICE_COUNT
    const selectedCategory = CATEGORIES[sliceIndex]

    onSpinComplete && onSpinComplete(targetAngle, selectedCategory)
  }, [isSpinning, isMyTurn, currentAngle, controls, onSpinComplete])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pointer arrow */}
      <div className="relative">
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon
            points="12,0 24,20 0,20"
            fill="#fbbf24"
            filter="url(#glow)"
          />
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Wheel container */}
      <div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'transparent',
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.4), 0 0 80px rgba(139, 92, 246, 0.15)',
            borderRadius: '50%',
          }}
        />

        {/* Wheel SVG */}
        <motion.div
          ref={wheelRef}
          animate={controls}
          initial={{ rotate: initialAngle }}
          style={{
            width: SIZE,
            height: SIZE,
            transformOrigin: 'center center',
            cursor: isMyTurn && !isSpinning ? 'pointer' : 'default',
          }}
          onClick={spin}
        >
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ display: 'block' }}
          >
            {/* Outer border circle */}
            <circle cx={CX} cy={CY} r={R + 2} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

            {/* Slices */}
            {CATEGORIES.map((cat, i) => {
              const startAngle = i * SLICE_ANGLE
              const endAngle = (i + 1) * SLICE_ANGLE
              const midAngle = startAngle + SLICE_ANGLE / 2

              // Label position (70% of radius)
              const labelPos = polarToCartesian(CX, CY, R * 0.7, midAngle)
              // Emoji position (85% of radius)
              const emojiPos = polarToCartesian(CX, CY, R * 0.87, midAngle)

              return (
                <g key={cat.id}>
                  {/* Slice */}
                  <path
                    d={buildSlicePath(CX, CY, R, startAngle, endAngle)}
                    fill={cat.color}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="1.5"
                  />

                  {/* Separator line */}
                  <line
                    x1={CX}
                    y1={CY}
                    x2={polarToCartesian(CX, CY, R, startAngle).x}
                    y2={polarToCartesian(CX, CY, R, startAngle).y}
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth="1"
                  />

                  {/* Emoji */}
                  <text
                    x={emojiPos.x}
                    y={emojiPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="13"
                    transform={`rotate(${midAngle}, ${emojiPos.x}, ${emojiPos.y})`}
                    className="wheel-label"
                  >
                    {cat.emoji}
                  </text>

                  {/* Label text */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8.5"
                    fontWeight="800"
                    fill="rgba(255,255,255,0.95)"
                    transform={`rotate(${midAngle}, ${labelPos.x}, ${labelPos.y})`}
                    className="wheel-label"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                    filter="url(#textShadow)"
                  >
                    {cat.label}
                  </text>
                </g>
              )
            })}

            {/* Center hub */}
            <circle cx={CX} cy={CY} r={26} fill="#1e1b4b" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <circle cx={CX} cy={CY} r={22} fill="url(#hubGradient)" />

            {/* Hub text */}
            {isMyTurn && !isSpinning && (
              <text
                x={CX}
                y={CY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7"
                fontWeight="900"
                fill="white"
                className="wheel-label"
              >
                GIRA!
              </text>
            )}
            {isSpinning && (
              <text
                x={CX}
                y={CY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="6"
                fontWeight="900"
                fill="rgba(255,255,255,0.7)"
                className="wheel-label"
              >
                ...
              </text>
            )}

            {/* Definitions */}
            <defs>
              <radialGradient id="hubGradient" cx="50%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4c1d95" />
              </radialGradient>
              <filter id="textShadow">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.8)" />
              </filter>
            </defs>
          </svg>
        </motion.div>

        {/* Spin ring pulse when it's your turn */}
        {isMyTurn && !isSpinning && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-yellow-400/50 pointer-events-none"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.02, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Instruction text */}
      <div className="text-center min-h-[24px]">
        {isMyTurn && !isSpinning && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-yellow-400 font-bold text-sm"
          >
            Tocca la ruota per girare!
          </motion.p>
        )}
        {isSpinning && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-white/60 text-sm"
          >
            La ruota sta girando...
          </motion.p>
        )}
        {!isMyTurn && !isSpinning && (
          <motion.p
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white/40 text-sm"
          >
            Aspetta il tuo turno...
          </motion.p>
        )}
      </div>
    </div>
  )
}
