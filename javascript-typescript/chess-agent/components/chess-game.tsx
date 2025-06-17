"use client"

import { useState, useCallback, useEffect } from "react"
import { Chessboard } from "react-chessboard"
import { Chess, Square, Move } from "chess.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, Flag, Lightbulb, MessageSquare, Brain, History, Info } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import MoveHistory from "./move-history"
import ChatPanel from "./chat-panel"
import ColorSelector from "./color-selector"
import { useChat } from '@ai-sdk/react'

type ChatMessage = {
  sender: string;
  message: string;
};

export default function ChessGame() {
  const [game, setGame] = useState<Chess>(new Chess())
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white")
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [gameStatus, setGameStatus] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "AI", message: "Hello! I'm your chess opponent. Choose your color and let's play!" },
  ])
  const [activeTab, setActiveTab] = useState<string>("history")
  const [showHints, setShowHints] = useState(false)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string }>>({})
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [aiDecision, setAiDecision] = useState<string | null>(null)
  const [pendingAiMove, setPendingAiMove] = useState(false)
  const [showResignDialog, setShowResignDialog] = useState(false)

  // Add move to history
  const addMoveToHistory = (move: Move) => {
    const moveNotation = `${move.color === "w" ? "White" : "Black"}: ${move.san}`
    setMoveHistory((prev) => [...prev, moveNotation])
  }

  // Check game status
  const checkGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      const winner = currentGame.turn() === "w" ? "Black" : "White"
      const isPlayerWinner =
        (winner === "White" && playerColor === "white") || (winner === "Black" && playerColor === "black")
      const message = `Checkmate! ${winner} wins!`
      setGameStatus(message)
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          message: isPlayerWinner ? "You've checkmated me! Well played!" : "I've checkmated you! Good game!",
        },
      ])
    } else if (currentGame.isDraw()) {
      setGameStatus("Game ended in a draw!")
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          message: "The game is a draw. Good match!",
        },
      ])
    } else if (currentGame.isStalemate()) {
      setGameStatus("Stalemate!")
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          message: "Stalemate! Neither of us can win now.",
        },
      ])
    } else if (currentGame.isThreefoldRepetition()) {
      setGameStatus("Draw by threefold repetition!")
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          message: "That's a draw by threefold repetition.",
        },
      ])
    } else if (currentGame.isInsufficientMaterial()) {
      setGameStatus("Draw by insufficient material!")
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          message: "Neither of us has enough pieces to checkmate. It's a draw.",
        },
      ])
    } else if (currentGame.isCheck()) {
      const inCheck = currentGame.turn() === "w" ? "White" : "Black"
      const isPlayerInCheck =
        (inCheck === "White" && playerColor === "white") || (inCheck === "Black" && playerColor === "black")
      setGameStatus(`${inCheck} is in check!`)
      if (isPlayerInCheck) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            message: "Check! Your king is under attack.",
          },
        ])
      }
    } else {
      setGameStatus(null)
    }
  }

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      const content = message.content;
      if (typeof content === 'string' && content) {
        setChatMessages(prev => [...prev, { 
          sender: 'AI', 
          message: content 
        }]);
      }
    }
  });

  // Start the game with the selected color
  const startGame = (color: "white" | "black") => {
    setPlayerColor(color)
    setBoardOrientation(color)
    setGameStarted(true)

    // If player chooses black, AI (white) makes the first move
    if (color === "black") {
      setTimeout(() => startAiThinking(), 500)
    }
  }

  // Helper function to get piece name
  const getPieceName = (piece: string) => {
    const pieceNames: { [key: string]: string } = {
      p: "pawn",
      n: "knight",
      b: "bishop",
      r: "rook",
      q: "queen",
      k: "king",
    }
    return pieceNames[piece.toLowerCase()] || piece
  }

  // Generate commentary for AI moves
  const getAiCommentary = async (move: string) => {
    const prompt = `I moved ${move}. Please provide a brief, natural explanation of this move based on my earlier strategic thinking.`;
    
    handleInputChange({ target: { value: prompt } } as React.ChangeEvent<HTMLInputElement>);
    await handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>);
  };

  // Make a move for the AI based on its decision
  const makeAiMove = useCallback(async (decision: string) => {
    if (game.isGameOver() || game.isDraw()) return

    const possibleMoves = game.moves({ verbose: true })
    if (possibleMoves.length === 0) return

    // Determine AI's color (opposite of player's color)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const aiColor = playerColor === "white" ? "black" : "white"

    // Select a move based on the AI's decision

    // Parse the decision to determine move priority
    const isCheckingMove = decision.toLowerCase().includes("check")
    const isCapturingMove =
      decision.toLowerCase().includes("attack") ||
      decision.toLowerCase().includes("capture") ||
      decision.toLowerCase().includes("take")
    const isDevelopingMove = decision.toLowerCase().includes("develop")
    const isCastlingMove = decision.toLowerCase().includes("castle")
    const isDefensiveMove = decision.toLowerCase().includes("defend") || decision.toLowerCase().includes("protect")
    const isControlMove = decision.toLowerCase().includes("control") || decision.toLowerCase().includes("position")
    const isPawnAdvance = decision.toLowerCase().includes("pawn") || decision.toLowerCase().includes("advance")

    // Filter moves based on the decision
    let candidateMoves = possibleMoves

    // Check moves
    if (isCheckingMove) {
      const checkMoves = possibleMoves.filter((move) => {
        const testGame = new Chess(game.fen())
        testGame.move(move)
        return testGame.isCheck()
      })
      if (checkMoves.length > 0) candidateMoves = checkMoves
    }
    // Capture moves
    else if (isCapturingMove) {
      const captureMoves = possibleMoves.filter((move) => move.captured)
      if (captureMoves.length > 0) candidateMoves = captureMoves
    }
    // Castling moves
    else if (isCastlingMove) {
      const castlingMoves = possibleMoves.filter((move) => move.san.includes("O-O"))
      if (castlingMoves.length > 0) candidateMoves = castlingMoves
    }
    // Developing moves (knights and bishops)
    else if (isDevelopingMove) {
      const developingMoves = possibleMoves.filter((move) => ["n", "b"].includes(move.piece))
      if (developingMoves.length > 0) candidateMoves = developingMoves
    }
    // Defensive moves (moving away from threatened squares)
    else if (isDefensiveMove) {
      // This is a simplification - in a real chess engine, you'd analyze threats
      const defensiveMoves = possibleMoves.filter((move) => ["k", "q"].includes(move.piece))
      if (defensiveMoves.length > 0) candidateMoves = defensiveMoves
    }
    // Control moves (rooks and queens to open files/ranks)
    else if (isControlMove) {
      const controlMoves = possibleMoves.filter((move) => ["r", "q"].includes(move.piece))
      if (controlMoves.length > 0) candidateMoves = controlMoves
    }
    // Pawn advances
    else if (isPawnAdvance) {
      const pawnMoves = possibleMoves.filter((move) => move.piece === "p")
      if (pawnMoves.length > 0) candidateMoves = pawnMoves
    }

    // If no moves match the specific strategy, use any available move
    if (candidateMoves.length === 0) candidateMoves = possibleMoves

    // Select a move from the candidates
    const selectedMove = candidateMoves[Math.floor(Math.random() * candidateMoves.length)]

    // Make the move
    const gameCopy = new Chess(game.fen())
    const result = gameCopy.move(selectedMove)

    if (result) {
      // Generate commentary about the move
      const commentary = await getAiCommentary(selectedMove.san);

      // Add the commentary to chat (only if we have valid commentary)
      if (commentary && typeof commentary === 'string') {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            message: commentary,
          },
        ]);
      }

      // Update last move for highlighting
      setLastMove({
        from: selectedMove.from,
        to: selectedMove.to,
      })

      setGame(gameCopy)
      addMoveToHistory(result)
      checkGameStatus(gameCopy)
    }

    setIsThinking(false)
  }, [game, playerColor, getAiCommentary, setLastMove, setGame, addMoveToHistory, checkGameStatus, setChatMessages, setIsThinking])

  // Generate AI's decision using the AI API
  const generateAiDecision = async (lastHumanMove: string | null, aiColor: string) => {
    try {
      // Create a prompt for the AI API
      const fen = game.fen()
      const gamePhase = moveHistory.length < 10 ? "opening" : moveHistory.length < 20 ? "middlegame" : "endgame"

      const prompt = `
You are playing a chess game as ${aiColor} pieces. The current position in FEN notation is: ${fen}
We are in the ${gamePhase} phase of the game.
${lastHumanMove ? `My opponent's last move was: ${lastHumanMove}` : "I am making the first move."}

What is your strategic thinking for your next move? What are you considering?
Keep your response to 1-2 sentences focused on your strategic thinking, not the specific move yet.
`

      // Use the chat input and submit handler
      handleInputChange({ target: { value: prompt } } as React.ChangeEvent<HTMLInputElement>)
      await handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>)

      // Get a strategy and customize it with the AI's color
      const strategy = input || "I'm considering my next move."
      return strategy.replace("my", `my ${aiColor}`)
    } catch (error) {
      console.error("Error in generateAiDecision:", error)
      // If any error occurs, return a simple response
      return `I'm considering my ${aiColor} pieces' development and position.`
    }
  }

  // Start AI thinking process
  const startAiThinking = async () => {
    if (game.isGameOver() || game.isDraw()) return

    setIsThinking(true)
    setAiDecision(null)

    // Get the last human move from history
    const lastHumanMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null

    // Determine AI's color (opposite of player's color)
    const aiColor = playerColor === "white" ? "black" : "white"

    // Generate AI's decision about what move to make
    const decision = await generateAiDecision(lastHumanMove, aiColor)
    setAiDecision(decision)

    // Add AI's thinking to chat
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "AI",
        message: `Thinking: ${decision}`,
      },
    ])

    // Set a flag that AI needs to make a move based on its decision
    setPendingAiMove(true)
  }


  // Effect to handle AI move after thinking
  useEffect(() => {
    if (pendingAiMove && aiDecision) {
      const timer = setTimeout(() => {
        makeAiMove(aiDecision)
        setPendingAiMove(false)
      }, 1500) // Delay to make it seem like the AI is thinking about its decision

      return () => clearTimeout(timer)
    }
  }, [pendingAiMove, aiDecision, makeAiMove])

  // Handle piece selection for move hints
  const onSquareClick = (square: string) => {
    // Only show hints if the feature is enabled
    if (!showHints || !gameStarted) return

    // Check if it's the player's turn
    const currentTurn = game.turn() === "w" ? "white" : "black"
    if (currentTurn !== playerColor) return

    // Get the piece on the clicked square
    const piece = game.get(square as Square)

    // If the square is empty or has an opponent's piece, clear selection
    if (!piece || piece.color !== game.turn()) {
      setSelectedSquare(null)
      setOptionSquares({})
      return
    }

    // Set the selected square
    setSelectedSquare(square)

    // Get all possible moves for the piece on this square
    const moves = game.moves({ square: square as Square, verbose: true })

    // Create an object with the target squares as keys
    const newOptionSquares: Record<string, { background: string }> = {}

    moves.forEach((move) => {
      newOptionSquares[move.to] = {
        background: move.captured
          ? "rgba(255, 100, 100, 0.4)" // Red for captures
          : "rgba(100, 255, 100, 0.4)", // Green for regular moves
      }
    })

    setOptionSquares(newOptionSquares)
  }

  // Handle player move
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (isThinking || !gameStarted) return false

    // Check if it's the player's turn
    const currentTurn = game.turn() === "w" ? "white" : "black"
    if (currentTurn !== playerColor) return false

    // Clear any highlighted squares
    setSelectedSquare(null)
    setOptionSquares({})

    try {
      const gameCopy = new Chess(game.fen())
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Always promote to queen for simplicity
      })

      if (move === null) return false

      // Update last move for highlighting
      setLastMove({
        from: sourceSquare,
        to: targetSquare,
      })

      setGame(gameCopy)
      addMoveToHistory(move)
      checkGameStatus(gameCopy)

      // Add player's move to chat
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "Human",
          message: `I moved my ${playerColor === "white" ? "white" : "black"} ${getPieceName(move.piece)} from ${sourceSquare} to ${targetSquare}.`,
        },
      ])

      // AI analyzes and responds to the player's move
      if (!gameCopy.isGameOver()) {
        // Start AI thinking process
        setTimeout(() => startAiThinking(), 1000)
      }

      return true
    } catch (error) {
      console.error("Move error:", error)
      return false
    }
  }

  // Reset the game
  const resetGame = () => {
    setGame(new Chess())
    setMoveHistory([])
    setGameStatus(null)
    setGameStarted(false)
    setLastMove(null)
    setSelectedSquare(null)
    setOptionSquares({})
    setAiDecision(null)
    setPendingAiMove(false)
    setChatMessages([
      {
        sender: "AI",
        message: "Let's play again! Choose your color.",
      },
    ])
  }

  // Undo last move (both player and AI)
  const undoMove = () => {
    if (moveHistory.length < 2) return

    const gameCopy = new Chess(game.fen())
    gameCopy.undo() // Undo AI move
    gameCopy.undo() // Undo player move

    setGame(gameCopy)
    setMoveHistory((prev) => prev.slice(0, -2))
    setLastMove(null)
    setSelectedSquare(null)
    setOptionSquares({})
    setAiDecision(null)
    setPendingAiMove(false)
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "AI",
        message: "I've undone our last moves. Let's try again.",
      },
    ])
    checkGameStatus(gameCopy)
  }

  // Flip the board orientation
  const flipBoard = () => {
    setBoardOrientation(boardOrientation === "white" ? "black" : "white")
  }

  // Get a hint (make a random legal move)
  const getHint = () => {
    const possibleMoves = game.moves({ verbose: true })
    if (possibleMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * possibleMoves.length)
      const hint = possibleMoves[randomIndex]
      setGameStatus(`Hint: Consider moving ${getPieceName(hint.piece)} from ${hint.from} to ${hint.to}`)
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          message: `Hint: You might want to consider moving your ${getPieceName(hint.piece)} from ${hint.from} to ${hint.to}.`,
        },
      ])
    }
  }

  // Handle resignation
  const handleResign = () => {
    setGameStatus(`You resigned. ${playerColor === "white" ? "Black" : "White"} wins!`)
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "AI",
        message: "You've resigned. Thanks for the game!",
      },
    ])
    setShowResignDialog(false)
  }

  // Create custom square styles for highlighting
  const customSquareStyles = useCallback(() => {
    const highlightStyles: Record<string, { backgroundColor: string }> = {}

    // Highlight last move
    if (lastMove) {
      highlightStyles[lastMove.from] = { backgroundColor: "rgba(255, 255, 0, 0.4)" } // Yellow for source
      highlightStyles[lastMove.to] = { backgroundColor: "rgba(255, 255, 0, 0.4)" } // Yellow for destination
    }

    return highlightStyles
  }, [lastMove])

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl">
      {/* Left panel - Game info and controls */}
      <div className="md:w-1/3 w-full space-y-4">
        {!gameStarted ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Choose Your Color</CardTitle>
            </CardHeader>
            <CardContent>
              <ColorSelector onSelectColor={startGame} />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center justify-between">
                  Game Information
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current game status and information</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Turn:</span>
                    <Badge variant={game.turn() === "w" ? "default" : "secondary"}>
                      {game.turn() === "w" ? "White" : "Black"}
                      {game.turn() === "w" && playerColor === "white" && " (Your turn)"}
                      {game.turn() === "b" && playerColor === "black" && " (Your turn)"}
                      {game.turn() === "w" && playerColor === "black" && " (AI's turn)"}
                      {game.turn() === "b" && playerColor === "white" && " (AI's turn)"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Your Color:</span>
                    <Badge variant={playerColor === "white" ? "outline" : "secondary"}>
                      {playerColor === "white" ? "White" : "Black"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">AI Status:</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
                      Using offline AI
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Move Hints:</span>
                    <Switch id="show-hints" checked={showHints} onCheckedChange={setShowHints} />
                  </div>
                </div>

                {gameStatus && <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-center">{gameStatus}</div>}

                {isThinking && (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-md">
                    <div className="flex items-center justify-center">
                      <Brain className="h-5 w-5 mr-2 animate-pulse" />
                      <span>AI is thinking...</span>
                    </div>
                    {aiDecision && <div className="mt-2 text-center italic text-sm">&quot;{aiDecision}&quot;</div>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Game Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={resetGame} variant="outline" className="w-full">
                    <RotateCcw className="mr-2 h-4 w-4" /> New Game
                  </Button>
                  <Button
                    onClick={undoMove}
                    variant="outline"
                    disabled={moveHistory.length < 2 || isThinking}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Undo Move
                  </Button>
                  <Button onClick={flipBoard} variant="outline" className="w-full">
                    Flip Board
                  </Button>
                  <Button onClick={getHint} variant="outline" className="w-full">
                    <Lightbulb className="mr-2 h-4 w-4" /> Hint
                  </Button>
                  <Dialog open={showResignDialog} onOpenChange={setShowResignDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full col-span-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Flag className="mr-2 h-4 w-4" /> Resign
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you sure you want to resign?</DialogTitle>
                        <DialogDescription>Resigning will end the game and count as a loss for you.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResignDialog(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleResign}>
                          Resign
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Game History</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="history" className="flex items-center">
                      <History className="mr-2 h-4 w-4" /> Moves
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" /> Chat
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="history" className="mt-2">
                    <MoveHistory moves={moveHistory} />
                  </TabsContent>
                  <TabsContent value="chat" className="mt-2">
                    <ChatPanel messages={chatMessages} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Right panel - Chess board */}
      <div className="md:w-2/3 w-full">
        <Card>
          <CardContent className="p-4">
            <div className="w-full aspect-square max-w-[600px] mx-auto">
              <Chessboard
                position={game.fen()}
                onPieceDrop={onDrop}
                onSquareClick={onSquareClick}
                boardOrientation={boardOrientation}
                areArrowsAllowed={true}
                customBoardStyle={{
                  borderRadius: "4px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
                customSquareStyles={{
                  ...customSquareStyles(),
                  ...optionSquares,
                }}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-0">
            <div className="text-xs text-muted-foreground">
              {showHints ? "Click on a piece to see valid moves" : "Enable move hints to see valid moves"}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
