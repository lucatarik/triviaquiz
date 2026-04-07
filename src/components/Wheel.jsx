import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { WHEEL_SLICES } from '../data/questions'

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function buildSlicePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`, 'Z'].join(' ')
}

const SIZE = 300
const CX = SIZE / 2
const CY = SIZE / 2
const R = SIZE / 2 - 4

// Pre-compute cumulative angles once at module load
const SLICE_DATA = (() => {
  let cum = 0
  return WHEEL_SLICES.map(slice => {
    const start = cum
    cum += slice.angle
    return { ...slice, startAngle: start, endAngle: cum, midAngle: start + slice.angle / 2 }
  })
})()

function getSliceAt(absoluteAngle) {
  const norm = ((absoluteAngle % 360) + 360) % 360
  const pointerAt = ((360 - norm) + 360) % 360
  return (
    SLICE_DATA.find(s => pointerAt >= s.startAngle && pointerAt < s.endAngle) ||
    SLICE_DATA[SLICE_DATA.length - 1]
  )
}

export default function Wheel({ onSpinComplete, onSpinStart, isMyTurn, initialAngle = 0, spinData }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(initialAngle)
  const controls = useAnimation()
  const observedSpinRef = useRef(null)
  const lastCategoryRef = useRef(null) // anti-repeat for category slices

  // Observer: replay spin animation when detected
  useEffect(() => {
    if (isMyTurn) return
    if (!spinData?.isSpinning || !spinData.spinStartTime || spinData.spinTargetAngle == null) return
    if (observedSpinRef.current === spinData.spinStartTime) return
    observedSpinRef.current = spinData.spinStartTime

    const elapsed = (Date.now() - spinData.spinStartTime) / 1000
    const totalDuration = spinData.spinDuration || 4
    const remaining = totalDuration - elapsed

    if (remaining <= 0.3) {
      setCurrentAngle(spinData.spinTargetAngle)
      controls.set({ rotate: spinData.spinTargetAngle })
      return
    }
    setIsSpinning(true)
    controls.start({
      rotate: spinData.spinTargetAngle,
      transition: { duration: remaining, ease: [0.17, 0.67, 0.16, 0.99] },
    }).then(() => {
      setCurrentAngle(spinData.spinTargetAngle)
      setIsSpinning(false)
    })
  }, [isMyTurn, spinData?.isSpinning, spinData?.spinStartTime])

  const spin = useCallback(async () => {
    if (isSpinning || !isMyTurn) return
    setIsSpinning(true)

    const extraRotations = (Math.floor(Math.random() * 5) + 5) * 360
    let randomOffset = Math.random() * 360

    // Anti-repeat: if we'd land on the same category, shift by ~25° (one category slice)
    const candidate = getSliceAt(currentAngle + extraRotations + randomOffset)
    if (lastCategoryRef.current && candidate?.type === 'category' && candidate.id === lastCategoryRef.current) {
      randomOffset = (randomOffset + 25) % 360
    }

    const targetAngle = currentAngle + extraRotations + randomOffset
    const duration = 3.5 + Math.random() * 1.5

    onSpinStart && onSpinStart(targetAngle, duration)

    await controls.start({
      rotate: targetAngle,
      transition: { duration, ease: [0.17, 0.67, 0.16, 0.99] },
    })

    setCurrentAngle(targetAngle)
    setIsSpinning(false)

    const selectedSlice = getSliceAt(targetAngle)
    if (selectedSlice?.type === 'category') {
      lastCategoryRef.current = selectedSlice.id
    }

    onSpinComplete && onSpinComplete(targetAngle, selectedSlice)
  }, [isSpinning, isMyTurn, currentAngle, controls, onSpinComplete, onSpinStart])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pointer arrow */}
      <div className="relative">
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon points="12,0 24,20 0,20" fill="#fbbf24" filter="url(#glow)" />
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
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.4), 0 0 80px rgba(139, 92, 246, 0.15)' }}
        />

        <motion.div
          animate={controls}
          initial={{ rotate: initialAngle }}
          style={{
            width: SIZE, height: SIZE,
            transformOrigin: 'center center',
            cursor: isMyTurn && !isSpinning ? 'pointer' : 'default',
          }}
          onClick={spin}
        >
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block' }}>
            <circle cx={CX} cy={CY} r={R + 2} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

            {SLICE_DATA.map((slice) => {
              const emojiPos = polarToCartesian(CX, CY, R * 0.87, slice.midAngle)
              const labelPos = polarToCartesian(CX, CY, R * 0.68, slice.midAngle)
              const isNarrow = slice.angle < 20 // -1 punto slice

              return (
                <g key={slice.id}>
                  <path
                    d={buildSlicePath(CX, CY, R, slice.startAngle, slice.endAngle)}
                    fill={slice.color}
                    stroke="rgba(0,0,0,0.35)"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={CX} y1={CY}
                    x2={polarToCartesian(CX, CY, R, slice.startAngle).x}
                    y2={polarToCartesian(CX, CY, R, slice.startAngle).y}
                    stroke="rgba(0,0,0,0.4)" strokeWidth="1"
                  />
                  <text
                    x={emojiPos.x} y={emojiPos.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={isNarrow ? "10" : "12"}
                    transform={`rotate(${slice.midAngle}, ${emojiPos.x}, ${emojiPos.y})`}
                    className="wheel-label"
                  >
                    {slice.emoji}
                  </text>
                  {!isNarrow && (
                    <text
                      x={labelPos.x} y={labelPos.y}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="7.5" fontWeight="800"
                      fill="rgba(255,255,255,0.92)"
                      transform={`rotate(${slice.midAngle}, ${labelPos.x}, ${labelPos.y})`}
                      className="wheel-label"
                      filter="url(#textShadow)"
                    >
                      {slice.label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Center hub */}
            <circle cx={CX} cy={CY} r={26} fill="#1e1b4b" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <circle cx={CX} cy={CY} r={22} fill="url(#hubGradient)" />
            {isMyTurn && !isSpinning && (
              <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="900" fill="white" className="wheel-label">
                GIRA!
              </text>
            )}
            {isSpinning && (
              <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="6" fontWeight="900" fill="rgba(255,255,255,0.7)" className="wheel-label">
                ...
              </text>
            )}

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

        {isMyTurn && !isSpinning && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-yellow-400/50 pointer-events-none"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.02, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        {isMyTurn && !isSpinning && (
          <div
            className="absolute inset-0 rounded-full z-20"
            style={{ cursor: 'pointer', background: 'transparent' }}
            onClick={spin}
          />
        )}
      </div>

      <div className="text-center min-h-[24px]">
        {isMyTurn && !isSpinning && (
          <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-yellow-400 font-bold text-sm">
            Tocca la ruota per girare!
          </motion.p>
        )}
        {isSpinning && (
          <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-white/60 text-sm">
            La ruota sta girando...
          </motion.p>
        )}
        {!isMyTurn && !isSpinning && (
          <motion.p animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-white/40 text-sm">
            Aspetta il tuo turno...
          </motion.p>
        )}
      </div>
    </div>
  )
}
