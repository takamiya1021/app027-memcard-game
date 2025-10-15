import { useEffect, useRef, useState } from 'react'
import { HUD } from './components/HUD'
import { CardGrid } from './components/CardGrid'
import { ActionBar } from './components/ActionBar'
import { ScoreModal } from './components/ScoreModal'
import { SettingsPanel } from './components/SettingsPanel'
import { ResumeModal } from './components/ResumeModal'
import { HowToPlayModal } from './components/HowToPlayModal'
import { useGameEngine } from './hooks/useGameEngine'
import { useSound } from './hooks/useSound'
import { useOnboarding } from './hooks/useOnboarding'

function App() {
  const {
    cards,
    score,
    bestScores,
    bestScore,
    matchedPairs,
    totalPairs,
    status,
    isResolving,
    remainingTimeMs,
    difficulty,
    theme,
    themes,
    hintAvailable,
    hintUsed,
    isHintPreviewing,
    resumeAvailable,
    hasNewBest,
    flipCard,
    restart,
    changeDifficulty,
    changeTheme,
    useHint,
    resumeSession,
    resetProgress,
    discardSession,
    pendingSession,
  } = useGameEngine()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showResumeBadge, setShowResumeBadge] = useState(resumeAvailable)
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const [resumePromptShown, setResumePromptShown] = useState(false)
  const isInitialMount = useRef(true)

  const {
    settings: soundSettings,
    setSfxEnabled,
    setBgmEnabled,
    playFlip,
    playMatch,
    playMismatch,
    playVictory,
    startBgm,
    stopBgm,
  } = useSound()

  const previousScoreRef = useRef(score)
  const { hasSeenTutorial, acknowledge: acknowledgeTutorial } = useOnboarding()
  const [isHowToOpen, setIsHowToOpen] = useState(!hasSeenTutorial)

  useEffect(() => {
    if (status === 'finished') {
      setIsModalOpen(true)
    }
  }, [status])

  useEffect(() => {
    if (resumeAvailable) {
      setShowResumeBadge(true)
    }
  }, [resumeAvailable])

  useEffect(() => {
    if (!hasSeenTutorial) {
      setIsHowToOpen(true)
    }
  }, [hasSeenTutorial])

  useEffect(() => {
    // 初回マウント時のみ「続きから遊ぶ？」を表示
    if (isInitialMount.current) {
      if (resumeAvailable && pendingSession && !resumePromptShown) {
        setIsResumeModalOpen(true)
        setResumePromptShown(true)
      }
      isInitialMount.current = false
    }
    if (!resumeAvailable) {
      setIsResumeModalOpen(false)
    }
  }, [pendingSession, resumeAvailable, resumePromptShown])

  useEffect(() => {
    if (score > previousScoreRef.current) {
      playMatch()
    } else if (score < previousScoreRef.current) {
      playMismatch()
    }
    previousScoreRef.current = score
  }, [playMatch, playMismatch, score])

  useEffect(() => {
    if (status === 'running' && soundSettings.bgm) {
      startBgm()
    }
    if (status !== 'running') {
      stopBgm()
    }
    if (status === 'finished' && matchedPairs === totalPairs) {
      playVictory()
    }
  }, [matchedPairs, playVictory, soundSettings.bgm, startBgm, status, stopBgm, totalPairs])

  const handleRestart = () => {
    setIsModalOpen(false)
    restart()
  }

  const handleResume = () => {
    resumeSession()
    setShowResumeBadge(false)
    setIsResumeModalOpen(false)
  }

  const handleFlipCard = (cardId: string) => {
    const target = cards.find((card) => card.id === cardId)
    if (!target || target.status !== 'hidden') {
      flipCard(cardId)
      return
    }
    playFlip()
    if (soundSettings.bgm) {
      startBgm()
    }
    flipCard(cardId)
  }

  const handleCloseHowTo = () => {
    setIsHowToOpen(false)
    acknowledgeTutorial()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center gap-6 px-4 py-8">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-500">
          Memory Challenge
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-800 sm:text-4xl">
          きらめきメモリーカード
        </h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          カードをよく見て、同じ絵柄をそろえよう。ペアをきれいに揃えるたびにスコアが上がるで！
        </p>
      </header>

      <HUD
        score={score}
        bestScore={bestScore}
        bestScores={bestScores}
        matchedPairs={matchedPairs}
        totalPairs={totalPairs}
        remainingTimeMs={remainingTimeMs}
        difficulty={difficulty}
        onSelectDifficulty={changeDifficulty}
        theme={theme}
        themes={themes}
        onSelectTheme={changeTheme}
        hintAvailable={hintAvailable}
        hintUsed={hintUsed}
      />

      <main className="flex w-full flex-1 flex-col items-center gap-5">
        <CardGrid
          cards={cards}
          onFlip={handleFlipCard}
          disabled={isResolving || isHintPreviewing}
          revealFront={isHintPreviewing}
        />
        <ActionBar
          onRestart={handleRestart}
          onHint={useHint}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onResume={handleResume}
          onShowHowTo={() => setIsHowToOpen(true)}
          canUseHint={hintAvailable && !hintUsed}
          isResolving={isResolving}
          isHintPreviewing={isHintPreviewing}
          resumeAvailable={resumeAvailable && showResumeBadge}
        />
      </main>

      <footer className="pb-4 text-center text-xs text-slate-500">
        ローカルにスコアを保存して、記録を更新しよう！
      </footer>

      <ScoreModal
        open={isModalOpen}
        score={score}
        bestScore={bestScore}
        isBestUpdated={hasNewBest}
        onRestart={handleRestart}
        onClose={() => setIsModalOpen(false)}
      />

      <ResumeModal
        open={isResumeModalOpen}
        onResume={handleResume}
        onDiscard={() => {
          discardSession()
          restart()
          setShowResumeBadge(false)
        }}
        onClose={() => setIsResumeModalOpen(false)}
        savedAt={pendingSession?.savedAt}
        score={pendingSession?.score}
        matchedPairs={pendingSession?.matchedPairs}
        totalPairs={pendingSession?.totalPairs ?? totalPairs}
        remainingTimeMs={
          pendingSession?.remainingTimeMs ?? remainingTimeMs ?? null
        }
        difficulty={pendingSession?.difficulty ?? difficulty}
        theme={pendingSession?.theme ?? theme}
      />

      <SettingsPanel
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        difficulty={difficulty}
        onSelectDifficulty={(mode) => {
          changeDifficulty(mode)
          setIsSettingsOpen(false)
        }}
        theme={theme}
        themes={themes}
        onSelectTheme={(mode) => {
          changeTheme(mode)
          setIsSettingsOpen(false)
        }}
        bestScores={bestScores}
        onResetProgress={() => {
          resetProgress()
          setIsSettingsOpen(false)
        }}
        soundSettings={soundSettings}
        onToggleSfx={setSfxEnabled}
        onToggleBgm={(value) => {
          setBgmEnabled(value)
          if (!value) {
            stopBgm()
          }
        }}
      />

      <HowToPlayModal
        open={isHowToOpen}
        onClose={handleCloseHowTo}
        difficulty={difficulty}
      />
    </div>
  )
}

export default App
