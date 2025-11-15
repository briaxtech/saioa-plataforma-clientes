"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, File, X, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface UploadedFile {
  id: string
  name: string
  size: number
  progress: number
  status: "uploading" | "complete" | "error"
}

interface DocumentUploadZoneProps {
  onUpload?: (files: File[]) => void
  acceptedFileTypes?: string
  maxSize?: number
}

export function DocumentUploadZone({
  onUpload,
  acceptedFileTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 10 * 1024 * 1024, // 10MB
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    },
    [onUpload],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      processFiles(files)
    },
    [onUpload],
  )

  const processFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach((file) => {
      const interval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) => {
            if (f.id === file.id) {
              const newProgress = f.progress + 10
              if (newProgress >= 100) {
                clearInterval(interval)
                return { ...f, progress: 100, status: "complete" as const }
              }
              return { ...f, progress: newProgress }
            }
            return f
          }),
        )
      }, 200)
    })

    if (onUpload) {
      onUpload(files)
    }
  }

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-4">
      <Card
        className={`relative border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Suelta los archivos aquí para subirlos</h3>
          <p className="text-sm text-muted-foreground mb-4">o haz clic para buscarlos en tu computadora</p>
          <input
            type="file"
            id="file-upload"
            className="sr-only"
            multiple
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload">
            <Button type="button" asChild>
              <span>Seleccionar archivos</span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-4">
            Formatos aceptados: PDF, DOC, DOCX, JPG, PNG (máx. {formatFileSize(maxSize)})
          </p>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <Card key={file.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {file.status === "complete" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <File className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={file.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {file.status === "complete" ? formatFileSize(file.size) : `${file.progress}%`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
