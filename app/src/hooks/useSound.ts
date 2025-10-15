import { useCallback, useEffect, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'

const SOUND_SETTINGS_KEY = 'memory-card-game:sound-settings'

export type SoundSettings = {
  sfx: boolean
  bgm: boolean
}

const DEFAULT_SETTINGS: SoundSettings = {
  sfx: true,
  bgm: true,
}

export function useSound() {
  const [settings, setSettings] = useLocalStorage<SoundSettings>(
    SOUND_SETTINGS_KEY,
    DEFAULT_SETTINGS,
  )

  const audioContextRef = useRef<AudioContext | null>(null)
  const bgmSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const bgmGainRef = useRef<GainNode | null>(null)
  const bgmBufferRef = useRef<AudioBuffer | null>(null)

  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined') {
      return null
    }
    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AudioCtx) {
        return null
      }
      audioContextRef.current = new AudioCtx()
    }
    return audioContextRef.current
  }, [])

  const playTone = useCallback(
    (frequency: number, durationMs: number, type: OscillatorType) => {
      if (!settings.sfx) {
        return
      }
      const ctx = ensureContext()
      if (!ctx) {
        return
      }
      const now = ctx.currentTime
      const oscillator = ctx.createOscillator()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)

      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(now)
      oscillator.stop(now + durationMs / 1000)
    },
    [ensureContext, settings.sfx],
  )

  const playFlip = useCallback(() => {
    playTone(880, 80, 'sine')
  }, [playTone])

  const playMatch = useCallback(() => {
    playTone(523.25, 180, 'triangle')
    setTimeout(() => playTone(659.25, 180, 'triangle'), 100)
  }, [playTone])

  const playMismatch = useCallback(() => {
    playTone(196, 200, 'sawtooth')
  }, [playTone])

  const playVictory = useCallback(() => {
    playTone(523.25, 200, 'sine')
    setTimeout(() => playTone(659.25, 200, 'sine'), 120)
    setTimeout(() => playTone(783.99, 300, 'sine'), 240)
  }, [playTone])

  const startBgm = useCallback(async () => {
    if (!settings.bgm) {
      return
    }
    const ctx = ensureContext()
    if (!ctx) {
      return
    }
    if (bgmSourceRef.current) {
      return
    }

    // BGMファイルの読み込み（初回のみ）
    if (!bgmBufferRef.current) {
      try {
        const response = await fetch('/sounds/bgm.mp3')
        const arrayBuffer = await response.arrayBuffer()
        bgmBufferRef.current = await ctx.decodeAudioData(arrayBuffer)
      } catch (error) {
        console.error('BGM読み込みエラー:', error)
        return
      }
    }

    const source = ctx.createBufferSource()
    source.buffer = bgmBufferRef.current
    source.loop = true

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1)

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()

    bgmSourceRef.current = source
    bgmGainRef.current = gain
  }, [ensureContext, settings.bgm])

  const stopBgm = useCallback(() => {
    const ctx = audioContextRef.current
    if (!ctx) {
      return
    }
    if (bgmSourceRef.current && bgmGainRef.current) {
      const now = ctx.currentTime
      bgmGainRef.current.gain.cancelScheduledValues(now)
      bgmGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.4)
      bgmSourceRef.current.stop(now + 0.5)
    }
    bgmSourceRef.current = null
    bgmGainRef.current = null
  }, [])

  useEffect(() => {
    if (!settings.bgm) {
      stopBgm()
    }
  }, [settings.bgm, stopBgm])

  useEffect(() => {
    return () => {
      stopBgm()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stopBgm])

  const setSfxEnabled = useCallback(
    (value: boolean) => {
      setSettings((prev) => ({ ...prev, sfx: value }))
    },
    [setSettings],
  )

  const setBgmEnabled = useCallback(
    (value: boolean) => {
      setSettings((prev) => ({ ...prev, bgm: value }))
      if (!value) {
        stopBgm()
      }
    },
    [setSettings, stopBgm],
  )

  return {
    settings,
    setSfxEnabled,
    setBgmEnabled,
    playFlip,
    playMatch,
    playMismatch,
    playVictory,
    startBgm,
    stopBgm,
  }
}
