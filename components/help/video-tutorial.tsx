"use client"

import { useState } from "react"
import { Play, X, ExternalLink, Maximize2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface VideoTutorialProps {
  title: string
  description: string
  videoUrl: string // YouTube/Vimeo URL or video ID
  duration: string // e.g., "5:30"
  category?: "getting-started" | "features" | "advanced" | "tips"
  thumbnail?: string
  transcriptUrl?: string
}

/**
 * Video Tutorial Component
 * Embeds YouTube/Vimeo videos with player controls
 */
export function VideoTutorial({
  title,
  description,
  videoUrl,
  duration,
  category = "features",
  thumbnail,
  transcriptUrl
}: VideoTutorialProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showFullScreen, setShowFullScreen] = useState(false)

  // Extract video ID from URL
  const getVideoId = (url: string): { platform: "youtube" | "vimeo", id: string } | null => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/)
    if (youtubeMatch) {
      return { platform: "youtube", id: youtubeMatch[1] }
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return { platform: "vimeo", id: vimeoMatch[1] }
    }

    return null
  }

  const video = getVideoId(videoUrl)
  if (!video) return null

  const embedUrl = video.platform === "youtube"
    ? `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${video.id}?autoplay=1`

  const categoryColors = {
    "getting-started": "bg-blue-100 text-blue-800",
    "features": "bg-green-100 text-green-800",
    "advanced": "bg-purple-100 text-purple-800",
    "tips": "bg-yellow-100 text-yellow-800"
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div 
          className="relative aspect-video bg-muted"
          onClick={() => setIsPlaying(true)}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Play className="h-16 w-16 text-primary/50" />
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Play className="h-8 w-8 text-primary-foreground ml-1" />
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {duration}
          </div>

          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <Badge className={categoryColors[category]}>
              {category.replace("-", " ")}
            </Badge>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold mb-2 line-clamp-1">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsPlaying(true)}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-1" />
              Watch
            </Button>
            
            {transcriptUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(transcriptUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullScreen(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Inline player modal */}
      <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogContent>
      </Dialog>

      {/* Full screen player */}
      <Dialog open={showFullScreen} onOpenChange={setShowFullScreen}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full">
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Video Tutorial Gallery
 * Grid of video tutorials with filtering
 */
interface VideoGalleryProps {
  videos: VideoTutorialProps[]
  columns?: 2 | 3 | 4
}

export function VideoGallery({ videos, columns = 3 }: VideoGalleryProps) {
  const [filter, setFilter] = useState<string>("all")

  const filteredVideos = filter === "all"
    ? videos
    : videos.filter(v => v.category === filter)

  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Videos
        </Button>
        <Button
          variant={filter === "getting-started" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("getting-started")}
        >
          Getting Started
        </Button>
        <Button
          variant={filter === "features" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("features")}
        >
          Features
        </Button>
        <Button
          variant={filter === "advanced" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("advanced")}
        >
          Advanced
        </Button>
        <Button
          variant={filter === "tips" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("tips")}
        >
          Tips & Tricks
        </Button>
      </div>

      {/* Video grid */}
      <div className={`grid ${gridCols[columns]} gap-6`}>
        {filteredVideos.map((video, idx) => (
          <VideoTutorial key={idx} {...video} />
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No videos found in this category.
        </div>
      )}
    </div>
  )
}
