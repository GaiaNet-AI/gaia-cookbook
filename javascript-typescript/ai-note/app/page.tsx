"use client"

import React from "react"

import type { ReactElement } from "react"

import { useState, useEffect } from "react"
import { Button } from "./../components/ui/button"
import { Textarea } from "./../components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./../components/ui/card"
import { Badge } from "./../components/ui/badge" 
import { Input } from "./../components/ui/input"
import { Label } from "./../components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  } from "./../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./../components/ui/select"
import {
  Trash2,
  FileText,
  Briefcase,
  Heart,
  GraduationCap,
  ShoppingCart,
  DollarSign,
  Lightbulb,
  Bell,
  Clock,
  Sparkles,
  Brain,
  Zap,
  Calendar,
  Bot,
  Settings,
  Key,
  ExternalLink,
  Link,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  TreePine,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { generateObject } from "ai"
import { openai, createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"

interface Note {
  id: string
  content: string
  category: string
  timestamp: Date
  deadline?: Date
  detectedDeadline?: string
  aiProcessed?: boolean
  priority?: "low" | "medium" | "high"
  tags?: string[]
  links?: string[]
  aiProvider?: "openai" | "gaia"
}

interface AppSettings {
  openaiApiKey?: string
  gaiaApiKey?: string
  aiProvider: "openai" | "gaia"
  enableAI: boolean
}

const categories = {
  "Content Creation": {
    keywords: [
      "blog",
      "write",
      "article",
      "post",
      "content",
      "video",
      "podcast",
      "social media",
      "instagram",
      "twitter",
      "youtube",
    ],
    icon: FileText,
    color: "bg-blue-100 text-blue-800",
  },
  "Health & Wellness": {
    keywords: ["water", "exercise", "sleep", "eat", "health", "workout", "gym", "run", "walk", "meditation", "yoga"],
    icon: Heart,
    color: "bg-green-100 text-green-800",
  },
  "Work & Career": {
    keywords: [
      "meeting",
      "project",
      "deadline",
      "work",
      "task",
      "job",
      "career",
      "presentation",
      "email",
      "client",
      "boss",
    ],
    icon: Briefcase,
    color: "bg-purple-100 text-purple-800",
  },
  "Learning & Education": {
    keywords: ["learn", "study", "read", "course", "tutorial", "book", "research", "practice", "skill", "language"],
    icon: GraduationCap,
    color: "bg-orange-100 text-orange-800",
  },
  "Shopping & Errands": {
    keywords: ["buy", "purchase", "shop", "get", "pick up", "grocery", "store", "order", "amazon"],
    icon: ShoppingCart,
    color: "bg-yellow-100 text-yellow-800",
  },
  Finance: {
    keywords: ["pay", "money", "budget", "bill", "expense", "bank", "investment", "save", "tax", "insurance"],
    icon: DollarSign,
    color: "bg-emerald-100 text-emerald-800",
  },
  General: {
    keywords: [],
    icon: Lightbulb,
    color: "bg-gray-100 text-gray-800",
  },
}

const thinkingMessages = [
  "🧠 Analyzing your brilliant thought...",
  "✨ Categorizing with AI magic...",
  "🔍 Understanding the context...",
  "🎯 Finding the perfect category...",
  "⚡ Processing your idea...",
  "🌟 Organizing your thoughts...",
  "📅 Detecting any deadlines...",
  "🕒 Parsing time references...",
  "🤖 AI is thinking deeply...",
  "🎭 Understanding your intent...",
  "🔗 Extracting relevant links...",
  "🌳 Gaia AI is processing...",
]

// AI Schema for structured note processing
const NoteProcessingSchema = z.object({
  category: z.enum([
    "Content Creation",
    "Health & Wellness",
    "Work & Career",
    "Learning & Education",
    "Shopping & Errands",
    "Finance",
    "General",
  ]),
  priority: z.enum(["low", "medium", "high"]),
  deadline: z.string().nullable().describe("ISO date string if deadline detected, null otherwise"),
  deadlinePhrase: z.string().nullable().describe("The natural language phrase that indicated the deadline"),
  tags: z.array(z.string()).describe("Relevant tags for this note (max 3)"),
  links: z.array(z.string()).describe("Any URLs or links mentioned in the content"),
  enhancedContent: z
    .string()
    .describe("Cleaned up version of the original content, keeping the same meaning but more organized"),
  reasoning: z.string().describe("Brief explanation of categorization and priority decisions"),
})

// Tool calling schema for note processing
const noteProcessingTool = {
  name: "processNote",
  description: "Process and categorize a note with enhanced information",
  parameters: z.object({
    content: z.string().describe("The note content to process"),
    category: z
      .enum([
        "Content Creation",
        "Health & Wellness",
        "Work & Career",
        "Learning & Education",
        "Shopping & Errands",
        "Finance",
        "General",
      ])
      .describe("The category that best fits this note"),
    priority: z.enum(["low", "medium", "high"]).describe("Priority level based on urgency"),
    deadline: z.string().nullable().describe("ISO date string if deadline detected"),
    deadlinePhrase: z.string().nullable().describe("Natural language phrase indicating deadline"),
    tags: z.array(z.string()).max(3).describe("Relevant tags for this note"),
    links: z.array(z.string()).describe("URLs found in the content"),
    enhancedContent: z.string().describe("Cleaned up version of the content"),
    reasoning: z.string().describe("Brief explanation of categorization decisions"),
  }),
}

// Extract URLs from text
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}

// AI-powered note processing with provider selection
async function processNoteWithAI(content: string, provider: "openai" | "gaia", apiKey: string) {
  if (!apiKey) {
    return null
  }

  try {
    let aiClient
    let model

    if (provider === "openai") {
      aiClient = openai("gpt-4o-mini", { apiKey })
      model = aiClient
    } else if (provider === "gaia") {
      // Create Gaia client using createOpenAI with custom baseURL
      const gaiaClient = createOpenAI({
        baseURL: "https://llama70b.gaia.domains/v1",
        apiKey: apiKey,
      })
      model = gaiaClient("llama70b")
    }

    if (!model) {
      throw new Error("Failed to create AI model")
    }

    const result = await generateObject({
      model,
      schema: NoteProcessingSchema,
      prompt: `
        Analyze this note and extract structured information:
        "${content}"
        
        Instructions:
        1. Categorize based on the main intent/topic
        2. Set priority based on urgency indicators (high: urgent/ASAP, medium: specific deadlines, low: general tasks)
        3. Extract any deadline from natural language (today, tomorrow, next week, by Friday, etc.)
        4. Generate 1-3 relevant tags
        5. Extract any URLs or links mentioned
        6. Clean up the content while preserving meaning
        7. Provide brief reasoning for your decisions
        
        Current date context: ${new Date().toISOString()}
      `,
    })

    return result.object
  } catch (error) {
    console.error(`${provider} AI processing failed:`, error)
    return null
  }
}

// Fallback categorization
function categorizeNote(content: string): string {
  const lowerContent = content.toLowerCase()

  for (const [categoryName, categoryData] of Object.entries(categories)) {
    if (categoryName === "General") continue

    const hasKeyword = categoryData.keywords.some((keyword) => lowerContent.includes(keyword.toLowerCase()))

    if (hasKeyword) {
      return categoryName
    }
  }

  return "General"
}

// Fallback date parser
function parseNaturalDate(text: string): { date: Date | null; detectedPhrase: string | null } {
  const lowerText = text.toLowerCase()
  const now = new Date()

  const patterns = [
    {
      regex: /\b(tomorrow|tmrw)\b/i,
      handler: () => {
        const date = new Date(now)
        date.setDate(date.getDate() + 1)
        return { date, phrase: "tomorrow" }
      },
    },
    {
      regex: /\btoday\b/i,
      handler: () => {
        return { date: new Date(now), phrase: "today" }
      },
    },
    {
      regex: /\bby this week\b/i,
      handler: () => {
        const date = new Date(now)
        const daysUntilFriday = 5 - now.getDay()
        if (daysUntilFriday <= 0) {
          date.setDate(date.getDate() + (7 + daysUntilFriday))
        } else {
          date.setDate(date.getDate() + daysUntilFriday)
        }
        date.setHours(23, 59, 0, 0)
        return { date, phrase: "by this week" }
      },
    },
    {
      regex: /\bnext week\b/i,
      handler: () => {
        const date = new Date(now)
        date.setDate(date.getDate() + 7)
        return { date, phrase: "next week" }
      },
    },
  ]

  for (const pattern of patterns) {
    const match = lowerText.match(pattern.regex)
    if (match) {
      const result = pattern.handler(match)
      return { date: result.date, detectedPhrase: result.phrase }
    }
  }

  return { date: null, detectedPhrase: null }
}

// Thinking Animation Component
function ThinkingAnimation({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-2xl border max-w-md mx-4"
      >
        <div className="text-center">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
              scale: { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
            }}
            className="mb-4"
          >
            <Brain className="w-12 h-12 text-purple-500 mx-auto" />
          </motion.div>

          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-semibold text-gray-800 mb-2"
          >
            {message}
          </motion.h3>

          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 bg-purple-500 rounded-full"
              />
            ))}
          </div>

          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
            }}
            className="mt-4 flex justify-center space-x-2"
          >
            {[Zap, Sparkles, TreePine].map((Icon, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-2, 2, -2],
                  rotate: [-5, 5, -5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.3,
                }}
              >
                <Icon className="w-4 h-4 text-purple-400" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Settings Dialog Component
function SettingsDialog({ settings, onSave }: { settings: AppSettings; onSave: (settings: AppSettings) => void }) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings)
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showGaiaKey, setShowGaiaKey] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    onSave(localSettings)
    setIsOpen(false)
  }

  const getCurrentApiKey = () => {
    return localSettings.aiProvider === "openai" ? localSettings.openaiApiKey : localSettings.gaiaApiKey
  }

  const hasValidApiKey = () => {
    return !!getCurrentApiKey()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            App Settings
          </DialogTitle>
          <DialogDescription>Configure your AI provider and API keys</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select
              value={localSettings.aiProvider}
              onValueChange={(value: "openai" | "gaia") => setLocalSettings({ ...localSettings, aiProvider: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    OpenAI
                  </div>
                </SelectItem>
                <SelectItem value="gaia">
                  <div className="flex items-center gap-2">
                    <TreePine className="w-4 h-4" />
                    Gaia AI
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {localSettings.aiProvider === "openai" && (
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                OpenAI API Key
              </Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showOpenAIKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={localSettings.openaiApiKey || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, openaiApiKey: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                >
                  {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Get your API key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>
          )}

          {localSettings.aiProvider === "gaia" && (
            <div className="space-y-2">
              <Label htmlFor="gaia-key" className="flex items-center gap-2">
                <TreePine className="w-4 h-4" />
                Gaia API Key
              </Label>
              <div className="relative">
                <Input
                  id="gaia-key"
                  type={showGaiaKey ? "text" : "password"}
                  placeholder="gaia-..."
                  value={localSettings.gaiaApiKey || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, gaiaApiKey: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowGaiaKey(!showGaiaKey)}
                >
                  {showGaiaKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Get your API key for Gaia AI processing</p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableAI"
              checked={localSettings.enableAI}
              onChange={(e) => setLocalSettings({ ...localSettings, enableAI: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="enableAI" className="flex items-center gap-2">
              {localSettings.aiProvider === "gaia" ? <TreePine className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              Enable AI Processing
            </Label>
          </div>

          {!hasValidApiKey() && localSettings.enableAI && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                API key required for {localSettings.aiProvider === "gaia" ? "Gaia AI" : "OpenAI"} features
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function NoteTakingApp(): ReactElement {
  const [notes, setNotes] = useState<Note[]>([])
  const [inputValue, setInputValue] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingMessage, setThinkingMessage] = useState("")
  const [newNoteId, setNewNoteId] = useState<string | null>(null)
  const [detectedDate, setDetectedDate] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>({
    aiProvider: "openai",
    enableAI: true,
  })

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("personal-notes")
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        timestamp: new Date(note.timestamp),
        deadline: note.deadline ? new Date(note.deadline) : undefined,
      }))
      setNotes(parsedNotes)
    }

    const savedSettings = localStorage.getItem("app-settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem("personal-notes", JSON.stringify(notes))
  }, [notes])

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem("app-settings", JSON.stringify(settings))
  }, [settings])

  // Clear the new note highlight after animation
  useEffect(() => {
    if (newNoteId) {
      const timer = setTimeout(() => {
        setNewNoteId(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [newNoteId])

  // Detect dates in real-time as user types (fallback)
  useEffect(() => {
    if (inputValue.trim()) {
      const { detectedPhrase } = parseNaturalDate(inputValue)
      setDetectedDate(detectedPhrase)
    } else {
      setDetectedDate(null)
    }
  }, [inputValue])

  const getCurrentApiKey = () => {
    return settings.aiProvider === "openai" ? settings.openaiApiKey : settings.gaiaApiKey
  }

  const hasValidApiKey = () => {
    return !!getCurrentApiKey()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setIsThinking(true)

    // Cycle through thinking messages
    const messageInterval = setInterval(() => {
      setThinkingMessage(thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)])
    }, 800)

    // Set initial message
    setThinkingMessage(thinkingMessages[0])

    let aiResult = null

    // Process with AI if enabled and API key is available
    if (settings.enableAI && hasValidApiKey()) {
      aiResult = await processNoteWithAI(inputValue.trim(), settings.aiProvider, getCurrentApiKey()!)
    }

    // Fallback to manual parsing if AI fails or is disabled
    let deadline = null
    let detectedPhrase = null
    let links: string[] = []

    if (aiResult?.deadline) {
      deadline = new Date(aiResult.deadline)
      detectedPhrase = aiResult.deadlinePhrase
      links = aiResult.links || []
    } else {
      const fallback = parseNaturalDate(inputValue)
      deadline = fallback.date
      detectedPhrase = fallback.detectedPhrase
      links = extractUrls(inputValue)
    }

    clearInterval(messageInterval)

    const noteId = Date.now().toString()
    const newNote: Note = {
      id: noteId,
      content: aiResult?.enhancedContent || inputValue.trim(),
      category: aiResult?.category || categorizeNote(inputValue.trim()),
      timestamp: new Date(),
      deadline: deadline || undefined,
      detectedDeadline: detectedPhrase || undefined,
      aiProcessed: !!aiResult,
      priority: aiResult?.priority || "medium",
      tags: aiResult?.tags || [],
      links: links.length > 0 ? links : undefined,
      aiProvider: aiResult ? settings.aiProvider : undefined,
    }

    setNotes((prev) => [newNote, ...prev])
    setNewNoteId(noteId)
    setInputValue("")
    setDetectedDate(null)
    setIsThinking(false)
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
  }

  const groupedNotes = notes.reduce(
    (acc, note) => {
      if (!acc[note.category]) {
        acc[note.category] = []
      }
      acc[note.category].push(note)
      return acc
    },
    {} as Record<string, Note[]>,
  )

  // Get upcoming notifications (notes with deadlines in the next 24 hours)
  const upcomingNotifications = notes.filter((note) => {
    if (!note.deadline) return false
    const now = new Date()
    const timeDiff = note.deadline.getTime() - now.getTime()
    return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000 // Next 24 hours
  })

  const isOverdue = (deadline: Date) => {
    return new Date() > deadline
  }

  const formatDeadline = (deadline: Date) => {
    const now = new Date()
    const timeDiff = deadline.getTime() - now.getTime()

    if (timeDiff < 0) {
      return "Overdue"
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} left`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} left`
    } else {
      return "Due soon"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const handleSettingsSave = (newSettings: AppSettings) => {
    setSettings(newSettings)
  }

  const getProviderIcon = () => {
    return settings.aiProvider === "gaia" ? TreePine : Bot
  }

  const getProviderName = () => {
    return settings.aiProvider === "gaia" ? "Gaia AI" : "OpenAI"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <AnimatePresence>{isThinking && <ThinkingAnimation message={thinkingMessage} />}</AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Header with Notifications and Settings */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-500" />
              Thought Catcher
            </h1>
            <p className="text-gray-600">AI-powered thought organization with {getProviderName()} integration ✨</p>
          </div>

          <div className="flex items-center gap-2">
            <SettingsDialog settings={settings} onSave={handleSettingsSave} />

            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {upcomingNotifications.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">
                    {upcomingNotifications.length}
                  </Badge>
                )}
              </Button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border p-4 z-10"
                  >
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Upcoming Reminders
                    </h3>
                    {upcomingNotifications.length === 0 ? (
                      <p className="text-gray-500 text-sm">No upcoming deadlines</p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingNotifications.map((note) => (
                          <div key={note.id} className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                            <p className="text-sm font-medium">{note.content}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {note.deadline && formatDeadline(note.deadline)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* AI Status Banner */}
        {!settings.enableAI && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2"
          >
            <Bot className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">AI processing is disabled. Using basic categorization.</p>
          </motion.div>
        )}

        {settings.enableAI && !hasValidApiKey() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              Add your {getProviderName()} API key in settings to enable AI features.
            </p>
          </motion.div>
        )}

        {settings.enableAI && hasValidApiKey() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          >
            {React.createElement(getProviderIcon(), { className: "w-4 h-4 text-green-600" })}
            <p className="text-sm text-green-700">{getProviderName()} AI processing is active and ready! 🚀</p>
          </motion.div>
        )}

        {/* Input Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(getProviderIcon(), { className: "w-5 h-5 text-purple-500" })}
                Tell Me What's On Your Mind
              </CardTitle>
              <CardDescription>
                {settings.enableAI && hasValidApiKey()
                  ? `I'll use ${getProviderName()} to understand your intent, detect deadlines, extract links, and organize everything perfectly! ✨`
                  : "I'll organize your thoughts using smart categorization and date detection! ✨"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="e.g., I need to finish the hackathon judging by this week, check out https://example.com for reference..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="min-h-[100px] border-purple-200 focus:border-purple-400"
                    disabled={isThinking}
                  />
                  <AnimatePresence>
                    {detectedDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-2 right-2 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        Detected: {detectedDate}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  type="submit"
                  disabled={isThinking || !inputValue.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                >
                  {isThinking ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      {settings.enableAI && hasValidApiKey()
                        ? `${getProviderName()} is Processing...`
                        : "Processing..."}
                    </>
                  ) : (
                    <>
                      {React.createElement(getProviderIcon(), { className: "w-4 h-4 mr-2" })}
                      {settings.enableAI && hasValidApiKey()
                        ? `Let ${getProviderName()} Organize This`
                        : "Organize This Thought"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notes Display */}
        {notes.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="text-center py-12">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 3,
                  }}
                >
                  {React.createElement(getProviderIcon(), { className: "w-12 h-12 text-purple-400 mx-auto mb-4" })}
                </motion.div>
                <p className="text-gray-500">
                  Your {settings.enableAI && hasValidApiKey() ? `${getProviderName()}-powered` : "smart"} thought
                  collection is empty. Start sharing your ideas above! 🌟
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {Object.entries(groupedNotes).map(([categoryName, categoryNotes]) => {
                const categoryData = categories[categoryName as keyof typeof categories]
                const IconComponent = categoryData.icon

                return (
                  <motion.div
                    key={categoryName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconComponent className="w-5 h-5" />
                          {categoryName}
                          <Badge variant="secondary" className="ml-auto">
                            {categoryNotes.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <AnimatePresence>
                            {categoryNotes.map((note, index) => (
                              <motion.div
                                key={note.id}
                                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                transition={{
                                  duration: 0.3,
                                  delay: index * 0.1,
                                }}
                                whileHover={{ scale: 1.02 }}
                                className={`flex items-start justify-between p-4 rounded-lg border-2 transition-all ${
                                  note.id === newNoteId
                                    ? "bg-gradient-to-r from-purple-100 to-blue-100 border-purple-300 shadow-lg"
                                    : note.deadline && isOverdue(note.deadline)
                                      ? "border-red-200 bg-red-50"
                                      : "bg-white border-gray-100 hover:border-purple-200"
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-start gap-2">
                                    <p className="text-gray-900 mb-2 font-medium flex-1">{note.content}</p>
                                    {note.id === newNoteId && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                      >
                                        {note.aiProcessed ? (
                                          note.aiProvider === "gaia" ? (
                                            <TreePine className="w-5 h-5 text-green-500" />
                                          ) : (
                                            <Bot className="w-5 h-5 text-purple-500" />
                                          )
                                        ) : (
                                          <Sparkles className="w-5 h-5 text-purple-500" />
                                        )}
                                      </motion.div>
                                    )}
                                  </div>

                                  {/* Links */}
                                  {note.links && note.links.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {note.links.map((link, i) => (
                                        <a
                                          key={i}
                                          href={link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full hover:bg-blue-100 transition-colors"
                                        >
                                          <Link className="w-3 h-3" />
                                          {new URL(link).hostname}
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ))}
                                    </div>
                                  )}

                                  {/* Tags */}
                                  {note.tags && note.tags.length > 0 && (
                                    <div className="flex gap-1 mb-2">
                                      {note.tags.map((tag, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>
                                      {note.timestamp.toLocaleDateString()} at{" "}
                                      {note.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>

                                    {note.priority && (
                                      <span
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(note.priority)}`}
                                      >
                                        {note.priority.toUpperCase()}
                                      </span>
                                    )}

                                    {note.deadline && (
                                      <span
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                          isOverdue(note.deadline)
                                            ? "bg-red-100 text-red-700"
                                            : "bg-blue-100 text-blue-700"
                                        }`}
                                      >
                                        <Clock className="w-3 h-3" />
                                        {isOverdue(note.deadline) ? "Overdue" : formatDeadline(note.deadline)}
                                      </span>
                                    )}

                                    {note.detectedDeadline && (
                                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                        <Calendar className="w-3 h-3" />
                                        From: "{note.detectedDeadline}"
                                      </span>
                                    )}

                                    {note.aiProcessed && (
                                      <span
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                          note.aiProvider === "gaia"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-blue-100 text-blue-700"
                                        }`}
                                      >
                                        {note.aiProvider === "gaia" ? (
                                          <TreePine className="w-3 h-3" />
                                        ) : (
                                          <Bot className="w-3 h-3" />
                                        )}
                                        {note.aiProvider === "gaia" ? "Gaia Enhanced" : "AI Enhanced"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteNote(note.id)}
                                  className="text-gray-400 hover:text-red-500 ml-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
