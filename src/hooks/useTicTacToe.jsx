import { useState } from 'react'
import confetti from 'canvas-confetti'

import { TURNS } from '../constants.js'
import { saveGameToStorage, resetGameStorage, getItemFromStorage, clearHistoryGame } from '../storage/index.js'
import { checkWinnerFrom, checkEndGame } from '../logic/board.js'
import audioPop from '../assets/pop.mp3'
import audioWinner from '../assets/winner.wav'

export function useTicTacToe () {
  const [history, setHistory] = useState(() => getItemFromStorage({
    key: 'history',
    fallback: [Array(9).fill(null)]
  }))
  const [currentMove, setCurrentMove] = useState(() => {
    const value = window.localStorage.getItem('move')
    return value || 0
  })
  const xIsNext = currentMove % 2 === 0
  const turn = xIsNext ? TURNS.X : TURNS.O
  const currentSquares = history[currentMove]

  const [winner, setWinner] = useState(null)

  // Estado para controlar el audio
  const [sound, toggleSound] = useState(false)

  const startAgain = () => {
    setHistory([Array(9).fill(null)])

    setCurrentMove(0)
    setWinner(null)

    // Limpiamos storage
    resetGameStorage()
    clearHistoryGame({ keys: ['history', 'move'] })
  }

  const jumpTo = ({ to }) => {
    const nextMove = to === 'next' ? currentMove + 1 : currentMove - 1
    if (nextMove < 0 || nextMove === history.length) return
    setCurrentMove(nextMove)
  }

  const updateBoard = (index) => {
    if (currentSquares[index] || winner) return

    const newBoard = [...currentSquares]

    // Guardar historial
    const nextHistory = [...history.slice(0, currentMove + 1), newBoard]
    setHistory(nextHistory)
    const nextMove = nextHistory.length - 1
    setCurrentMove(nextMove)

    newBoard[index] = turn

    // Guardamos partida
    saveGameToStorage({
      data: {
        move: nextMove,
        history: nextHistory
      }
    })

    const newWinner = checkWinnerFrom(newBoard)

    const audio = new window.Audio(audioPop)
    audio.oncanplaythrough = () => {
      sound && !newWinner && audio.play()
    }

    const playSound = () => {
      const audio = new window.Audio(audioWinner)
      audio.oncanplaythrough = () => {
        sound && audio.play()
      }
    }

    // verificamos si hay ganador
    if (newWinner) {
      playSound()
      confetti()
      setWinner(newWinner)
    } else if (checkEndGame(newBoard)) {
      playSound()
      setWinner(false)
    }
  }

  return { board: currentSquares, updateBoard, startAgain, turn, winner, sound, toggleSound, jumpTo }
}
