import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getHistory } from '../lib/firebase'
import { CATEGORIES } from '../data/questions'

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function CategoryBadge({ categoryId }) {
  const cat = CATEGORIES.find(c => c.id === categoryId)
  if (!cat) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: cat.color + '33', color: cat.color }}>
      {cat.emoji} {cat.label}
    </span>
  )
}

function EventCard({ event, index }) {
  if (event.type === 'spin') {
    const { slice } = event
    if (!slice) return null
    const icons = { category: '🎯', passa_turno: '⏭️', powerup: slice?.powerupType === 'bomb' ? '💣' : '🔄', minus_punto: '💀' }
    const labels = { category: `${slice.emoji} ${slice.label}`, passa_turno: 'Passa turno', powerup: slice?.powerupType === 'bomb' ? 'Bomba ottenuta!' : 'Smista ottenuto!', minus_punto: '-1 punto' }
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/5 border border-white/8">
        <span className="text-lg w-7 text-center">{icons[slice?.type] || '🎰'}</span>
        <div className="flex-1 min-w-0">
          <span className="text-white/50 text-xs">{event.player} gira → </span>
          <span className="text-white/80 text-xs font-semibold">{labels[slice?.type] || slice?.label}</span>
        </div>
      </div>
    )
  }

  if (event.type === 'smista_used') {
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <span className="text-lg w-7 text-center">🔄</span>
        <span className="text-purple-300 text-xs">{event.player} usa Smista — salta <em className="not-italic text-white/40">"{event.skippedQuestion}"</em></span>
      </div>
    )
  }

  if (event.type === 'answer') {
    const correct = event.isCorrect
    const opts = event.options || []
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`rounded-xl border overflow-hidden ${correct ? 'border-green-500/25 bg-green-500/8' : 'border-red-500/25 bg-red-500/8'}`}
      >
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          <span className="text-base">{correct ? (event.speedBonus ? '⚡' : '✅') : '❌'}</span>
          <span className={`text-xs font-bold ${correct ? 'text-green-400' : 'text-red-400'}`}>{event.player}</span>
          {event.category && <CategoryBadge categoryId={event.category} />}
          {correct && <span className="ml-auto text-yellow-400 text-xs font-black">+{event.pointsEarned}pt</span>}
        </div>
        <p className="px-3 pb-1.5 text-white/80 text-xs leading-snug">{event.question}</p>
        <div className="grid grid-cols-2 gap-1 px-3 pb-2.5">
          {opts.map((opt, i) => {
            const isCorrect = i === event.correctIndex
            const isSelected = i === event.selectedIndex
            let cls = 'text-white/30 bg-white/3'
            if (isCorrect) cls = 'text-green-400 bg-green-500/15 font-semibold'
            else if (isSelected && !isCorrect) cls = 'text-red-400 bg-red-500/15 line-through'
            return (
              <div key={i} className={`rounded-lg px-2 py-1 text-[11px] border border-white/6 ${cls}`}>
                {String.fromCharCode(65 + i)}. {opt}
              </div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  if (event.type === 'timeout') {
    const opts = event.options || []
    return (
      <div className="rounded-xl border border-orange-500/25 bg-orange-500/8 overflow-hidden">
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          <span className="text-base">⏰</span>
          <span className="text-orange-400 text-xs font-bold">{event.player} — tempo scaduto</span>
          {event.category && <CategoryBadge categoryId={event.category} />}
        </div>
        <p className="px-3 pb-1.5 text-white/80 text-xs leading-snug">{event.question}</p>
        {opts.length > 0 && (
          <div className="grid grid-cols-2 gap-1 px-3 pb-2.5">
            {opts.map((opt, i) => (
              <div key={i} className={`rounded-lg px-2 py-1 text-[11px] border border-white/6 ${i === event.correctIndex ? 'text-green-400 bg-green-500/15 font-semibold' : 'text-white/25 bg-white/3'}`}>
                {String.fromCharCode(65 + i)}. {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}

export default function HistoryView({ historyId }) {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!historyId) return
    getHistory(historyId).then(data => {
      if (!data) setNotFound(true)
      else setHistory(data)
    }).catch(() => setNotFound(true)).finally(() => setLoading(false))
  }, [historyId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0a1e' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  if (notFound || !history) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3" style={{ background: '#0f0a1e' }}>
        <div className="text-5xl">🔍</div>
        <p className="text-white/50 text-sm">Cronologia non trovata</p>
        <a href="/" className="text-purple-400 text-sm underline">Torna al gioco</a>
      </div>
    )
  }

  const players = Object.entries(history.players || {}).sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
  const events = history.events || []
  const winner = history.winner
  const savedAt = history.savedAt || history.endedAt

  // Group events: show spins + their associated answer/timeout together
  const rounds = []
  let currentRound = null
  for (const ev of events) {
    if (ev.type === 'spin') {
      if (currentRound) rounds.push(currentRound)
      currentRound = { spin: ev, sub: [] }
    } else if (currentRound) {
      currentRound.sub.push(ev)
    }
  }
  if (currentRound) rounds.push(currentRound)

  return (
    <div className="min-h-screen py-6 px-4" style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f35 50%, #0f0a1e 100%)' }}>
      <div className="max-w-sm mx-auto space-y-5">

        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">{winner ? '🏆' : '🎮'}</div>
          <h1 className="text-xl font-black text-white">Cronologia partita</h1>
          {savedAt && <p className="text-white/30 text-xs mt-1">{formatTime(savedAt)}</p>}
        </div>

        {/* Final scores */}
        <div className="glass rounded-2xl p-4 space-y-2">
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold text-center mb-3">Risultato finale</p>
          {players.map(([name, data], i) => (
            <div key={name} className={`flex items-center gap-3 p-3 rounded-xl ${name === winner ? 'bg-yellow-500/15 border border-yellow-500/30' : 'bg-white/5'}`}>
              <span className="text-xl">{['🥇', '🥈', '🥉'][i] || '🎮'}</span>
              <span className="flex-1 text-white font-bold text-sm">{name}</span>
              <span className={`text-2xl font-black ${name === winner ? 'text-yellow-400' : 'text-white'}`}>{data.score || 0}</span>
              <span className="text-white/30 text-xs">pt</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        {events.length > 0 && (() => {
          const answers = events.filter(e => e.type === 'answer')
          const total = answers.length
          const correct = answers.filter(e => e.isCorrect).length
          const timeouts = events.filter(e => e.type === 'timeout').length
          const spins = events.filter(e => e.type === 'spin').length
          return (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Giri', value: spins, icon: '🎰' },
                { label: 'Domande', value: total, icon: '❓' },
                { label: 'Corrette', value: correct, icon: '✅' },
                { label: 'Timeout', value: timeouts, icon: '⏰' },
              ].map(s => (
                <div key={s.label} className="glass rounded-xl p-2.5 text-center">
                  <div className="text-lg">{s.icon}</div>
                  <div className="text-white font-black text-base">{s.value}</div>
                  <div className="text-white/30 text-[10px]">{s.label}</div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Timeline */}
        {rounds.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Cronologia turni</p>
            <div className="space-y-4">
              {rounds.map((round, ri) => (
                <div key={ri} className="space-y-2">
                  <EventCard event={round.spin} index={ri} />
                  {round.sub.map((ev, si) => (
                    <div key={si} className="ml-4">
                      <EventCard event={ev} index={ri * 10 + si} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pb-4">
          <a href="/" className="text-purple-400 text-sm underline">Gioca anche tu</a>
        </div>
      </div>
    </div>
  )
}
