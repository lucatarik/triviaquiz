import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Users, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function WaitingRoom({ playerName, roomId }) {
  const [copied, setCopied] = useState(false)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const shareUrl = `${window.location.origin}${window.location.pathname}?player=&room=${roomId}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0" style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f35 50%, #0f0a1e 100%)' }} />

      {/* Animated rings */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-purple-500/20"
            style={{ width: i * 150, height: i * 150 }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2 + i, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="glass rounded-3xl p-7 shadow-2xl text-center">
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
          >
            <Users size={36} className="text-white" />
          </motion.div>

          <h2 className="text-2xl font-black text-white mb-1">In attesa...</h2>
          <p className="text-white/50 text-sm mb-6">
            Ciao <span className="text-purple-400 font-semibold">{playerName}</span>! Aspettando un avversario{dots}
          </p>

          {/* Room Code */}
          <div className="mb-5">
            <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">Codice Stanza</p>
            <motion.button
              onClick={copyCode}
              whileTap={{ scale: 0.96 }}
              className="w-full bg-white/10 border-2 border-dashed border-purple-500/50 rounded-2xl p-4 flex items-center justify-between group hover:border-purple-500 transition-all"
            >
              <span className="text-3xl font-black tracking-widest text-white font-mono">{roomId}</span>
              <div className="text-purple-400 group-hover:text-purple-300 transition-colors">
                {copied ? <Check size={22} className="text-green-400" /> : <Copy size={22} />}
              </div>
            </motion.button>
            <p className="text-white/30 text-xs mt-2">Tocca per copiare il codice</p>
          </div>

          {/* QR Code */}
          <div className="mb-5">
            <p className="text-white/40 text-xs mb-3 uppercase tracking-wider font-semibold">Scansiona per entrare</p>
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-2xl inline-block">
                <QRCodeSVG value={shareUrl} size={140} level="M" />
              </div>
            </div>
          </div>

          {/* Share URL */}
          <motion.button
            onClick={copyToClipboard}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-xl font-semibold text-white/80 text-sm flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-all"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            {copied ? 'Link copiato!' : 'Copia link di invito'}
          </motion.button>

          {/* Instructions */}
          <div className="mt-5 pt-5 border-t border-white/10 space-y-2 text-left">
            <p className="text-white/30 text-xs text-center font-semibold uppercase tracking-wider mb-3">Come invitare un amico</p>
            {[
              { icon: '1️⃣', text: 'Condividi il codice stanza' },
              { icon: '2️⃣', text: `L'amico apre il gioco` },
              { icon: '3️⃣', text: 'Inserisce il codice e un nome' },
              { icon: '4️⃣', text: 'La partita inizia automaticamente!' },
            ].map((step) => (
              <div key={step.icon} className="flex items-center gap-3">
                <span className="text-base">{step.icon}</span>
                <span className="text-white/40 text-xs">{step.text}</span>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          <div className="mt-5 flex items-center justify-center gap-2 text-white/30">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">In attesa in tempo reale...</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
