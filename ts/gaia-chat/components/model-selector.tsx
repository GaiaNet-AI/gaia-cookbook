"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Model {
  id: string
  name: string
  provider: string
  description: string
}

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/models")
      const data = await response.json()
      setModels(data)
    } catch (error) {
      console.error("Failed to fetch models:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedModelData = models.find((m) => m.id === selectedModel)

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
  }

  return (
    <div className="flex items-center space-x-2">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-64">
          <SelectValue>
            {selectedModelData ? (
              <div className="flex items-center space-x-2">
                <span>{selectedModelData.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedModelData.id.toUpperCase()}
                </Badge>
              </div>
            ) : (
              "Select a blockchain AI model"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{model.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {model.provider}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
