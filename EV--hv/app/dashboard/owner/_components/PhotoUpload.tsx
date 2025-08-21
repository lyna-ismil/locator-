"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface PhotoUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
  className?: string
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5, className = "" }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setUploading(true)

    try {
      const newPhotos: string[] = []

      for (let i = 0; i < files.length && photos.length + newPhotos.length < maxPhotos; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith("image/")) {
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          continue
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        newPhotos.push(base64)
      }

      onPhotosChange([...photos, ...newPhotos])
    } catch (error) {
      console.error("Error uploading photos:", error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(updatedPhotos)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Attach Photos</label>
        <span className="text-xs text-gray-500">
          {photos.length}/{maxPhotos} photos
        </span>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo || "/placeholder.svg"}
                alt={`Upload ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg border"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-dashed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-1">Max {maxPhotos} photos, 5MB each. Supported: JPG, PNG, GIF</p>
        </div>
      )}
    </div>
  )
}
