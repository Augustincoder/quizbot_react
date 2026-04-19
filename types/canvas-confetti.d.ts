declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number
    angle?: number
    spread?: number
    startVelocity?: number
    decay?: number
    gravity?: number
    drift?: number
    flat?: boolean
    ticks?: number
    origin?: { x?: number; y?: number }
    colors?: string[]
    shapes?: ('square' | 'circle')[]
    scalar?: number
    zIndex?: number
    disableForReducedMotion?: boolean
    useWorker?: boolean
    resize?: boolean
    canvas?: HTMLCanvasElement
    driftX?: number
    driftY?: number
  }

  interface ConfettiInstance {
    (options?: ConfettiOptions): Promise<void>
    reset: () => void
  }

  const confetti: ConfettiInstance
  export default confetti
}
