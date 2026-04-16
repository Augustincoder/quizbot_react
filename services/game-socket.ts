import type { SocketEvent, SocketEventType } from '@/types/socket'
import type { GameMode, Question } from '@/types/game'
import type { Player } from '@/types/user'

type EventCallback = (payload?: unknown) => void

// Mock questions database
const mockQuestions: Record<GameMode, Question[]> = {
  'brain-ring': [
    { id: 'br1', text: 'Qaysi sayyora Quyosh tizimida eng katta?', category: 'Astronomiya', difficulty: 'easy', correctAnswer: 'Yupiter', timeLimit: 15, points: 10 },
    { id: 'br2', text: 'O\'zbekiston mustaqillikka qachon erishdi?', category: 'Tarix', difficulty: 'easy', correctAnswer: '1991', timeLimit: 15, points: 10 },
    { id: 'br3', text: 'Kimyoviy element "Au" ning nomi nima?', category: 'Kimyo', difficulty: 'medium', correctAnswer: 'Oltin', timeLimit: 15, points: 15 },
  ],
  'kahoot': [
    { id: 'k1', text: 'Qaysi davlat eng katta maydonga ega?', category: 'Geografiya', difficulty: 'easy', correctAnswer: 'Rossiya', options: ['AQSH', 'Xitoy', 'Rossiya', 'Kanada'], timeLimit: 20, points: 10 },
    { id: 'k2', text: 'Davriy jadvalda birinchi element?', category: 'Kimyo', difficulty: 'easy', correctAnswer: 'Vodorod', options: ['Geliy', 'Vodorod', 'Litiy', 'Uglerod'], timeLimit: 20, points: 10 },
  ],
  'zakovat': [
    { id: 'z1', text: 'Nisbiylik nazariyasini kim kashf etgan?', category: 'Fizika', difficulty: 'medium', correctAnswer: 'Albert Eynshteyn', timeLimit: 60, points: 20 },
    { id: 'z2', text: 'O\'zbekistondagi eng uzun daryo?', category: 'Geografiya', difficulty: 'medium', correctAnswer: 'Amudaryo', timeLimit: 60, points: 20 },
  ],
  'erudit': [
    { id: 'e1', text: 'Pi sonini kim hisoblagan?', category: 'Matematika', difficulty: 'hard', correctAnswer: 'Arximed', timeLimit: 15, points: 15 },
    { id: 'e2', text: 'Birinchi olimpiya o\'yinlari qayerda?', category: 'Tarix', difficulty: 'medium', correctAnswer: 'Gretsiya', timeLimit: 15, points: 15 },
  ],
}

// Mock opponents
const mockOpponents: Player[] = [
  { id: 'bot1', username: 'Jasur_AI', avatar: '', mmr: 1150, gamesPlayed: 45, wins: 28, losses: 17, isReady: true, score: 0, connected: true },
  { id: 'bot2', username: 'Malika_Bot', avatar: '', mmr: 980, gamesPlayed: 32, wins: 18, losses: 14, isReady: true, score: 0, connected: true },
  { id: 'bot3', username: 'Sardor_Pro', avatar: '', mmr: 1250, gamesPlayed: 67, wins: 42, losses: 25, isReady: true, score: 0, connected: true },
]

class MockGameSocket {
  private listeners: Map<SocketEventType, EventCallback[]> = new Map()
  private connected: boolean = false
  private roomId: string | null = null
  private mode: GameMode | null = null
  private currentQuestionIndex: number = 0
  private mockDelay: number = 500

  async connect(): Promise<void> {
    await this.delay(this.mockDelay)
    this.connected = true
    this.emit('connect', { connected: true })
  }

  disconnect(): void {
    this.connected = false
    this.roomId = null
    this.mode = null
    this.currentQuestionIndex = 0
    this.emit('disconnect', { connected: false })
  }

  async joinRoom(roomId: string, mode: GameMode, matchType: string): Promise<void> {
    if (!this.connected) {
      await this.connect()
    }

    this.roomId = roomId
    this.mode = mode

    // Simulate matchmaking delay
    const matchDelay = matchType === 'solo' ? 500 : 1500 + Math.random() * 2000
    await this.delay(matchDelay)

    // Select random opponent
    const opponent = mockOpponents[Math.floor(Math.random() * mockOpponents.length)]

    this.emit('room_joined', {
      roomId,
      mode,
      players: [opponent],
    })

    // Start game after brief delay
    await this.delay(2000)
    this.emit('game_start', { roomId, mode })
    
    // Send first question
    await this.delay(500)
    this.sendNextQuestion()
  }

  private sendNextQuestion(): void {
    if (!this.mode) return

    const questions = mockQuestions[this.mode]
    if (this.currentQuestionIndex >= questions.length) {
      this.endGame()
      return
    }

    const question = questions[this.currentQuestionIndex]
    this.emit('question_start', {
      question,
      duration: question.timeLimit,
      questionNumber: this.currentQuestionIndex + 1,
      totalQuestions: questions.length,
    })
  }

  async submitBuzzer(playerId: string, timestamp: number): Promise<void> {
    // Simulate network delay
    await this.delay(50 + Math.random() * 100)

    // Randomly decide if opponent buzzed first (30% chance)
    const opponentBuzzedFirst = Math.random() < 0.3
    
    if (opponentBuzzedFirst) {
      const opponent = mockOpponents[0]
      this.emit('buzzer_result', {
        winnerId: opponent.id,
        timestamp: timestamp - Math.floor(Math.random() * 50),
      })
    } else {
      this.emit('buzzer_result', {
        winnerId: playerId,
        timestamp,
      })
    }
  }

  async submitAnswer(playerId: string, answer: string): Promise<void> {
    if (!this.mode) return

    const questions = mockQuestions[this.mode]
    const currentQuestion = questions[this.currentQuestionIndex]
    
    // Check answer (simple comparison)
    const isCorrect = currentQuestion.correctAnswer.toLowerCase() === answer.toLowerCase() ||
                     currentQuestion.correctAnswer.toLowerCase().includes(answer.toLowerCase())

    await this.delay(300)

    this.emit('answer_result', {
      playerId,
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      pointsEarned: isCorrect ? currentQuestion.points : 0,
    })

    // Move to next question after delay
    await this.delay(2500)
    this.currentQuestionIndex++
    this.sendNextQuestion()
  }

  async requestAIRecheck(questionId: string, playerId: string, answer: string): Promise<void> {
    await this.delay(1500)

    // Randomly decide if AI accepts the answer (40% chance)
    const isValid = Math.random() < 0.4

    this.emit('ai_recheck_result', {
      questionId,
      playerId,
      isValid,
      explanation: isValid
        ? 'Javobingiz sinonim sifatida qabul qilindi.'
        : 'Javobingiz to\'g\'ri deb topilmadi.',
      confidence: 0.85,
    })
  }

  startPeerVote(questionId: string, playerId: string, answer: string): void {
    this.emit('peer_vote_start', {
      questionId,
      playerId,
      answer,
    })

    // Simulate bot votes after delays
    setTimeout(() => {
      this.emit('peer_vote_cast', { voterId: 'bot1', vote: Math.random() > 0.4 })
    }, 1000)

    setTimeout(() => {
      this.emit('peer_vote_cast', { voterId: 'bot2', vote: Math.random() > 0.5 })
    }, 2000)

    // End voting after all votes
    setTimeout(() => {
      const votes = { bot1: true, bot2: true }
      const totalYes = Object.values(votes).filter(v => v).length
      const accepted = totalYes > 1

      this.emit('peer_vote_result', {
        accepted,
        votes,
        totalYes,
        totalNo: 2 - totalYes,
      })
    }, 3000)
  }

  private endGame(): void {
    const finalScores: Record<string, number> = {
      user: Math.floor(Math.random() * 50) + 20,
      bot1: Math.floor(Math.random() * 50) + 10,
    }

    const winner = finalScores.user >= finalScores.bot1 ? 'user' : 'bot1'
    const mmrChange = winner === 'user' ? 15 + Math.floor(Math.random() * 10) : -10 - Math.floor(Math.random() * 5)

    this.emit('game_end', {
      finalScores,
      mmrChanges: {
        user: mmrChange,
        bot1: -mmrChange,
      },
      winner,
    })
  }

  on(eventType: SocketEventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType) || []
    callbacks.push(callback)
    this.listeners.set(eventType, callbacks)
  }

  off(eventType: SocketEventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType) || []
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
      this.listeners.set(eventType, callbacks)
    }
  }

  private emit(eventType: SocketEventType, payload?: unknown): void {
    const callbacks = this.listeners.get(eventType) || []
    callbacks.forEach((callback) => callback(payload))
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
let socketInstance: MockGameSocket | null = null

export function getGameSocket(): MockGameSocket {
  if (!socketInstance) {
    socketInstance = new MockGameSocket()
  }
  return socketInstance
}

export function resetGameSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

export { MockGameSocket }
