import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconChevronRight, IconShield, IconUsers, IconClock } from "@tabler/icons-react"
import { mockExperiences } from "@/data/mock-data"
import Image from "next/image"

export function CardsExperience() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header with Filter */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-clash text-3xl font-medium">Experiences</h2>
          <p className="text-muted-foreground">
            Manage your Roblox experiences and monitor community health
          </p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Experiences</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
            <SelectItem value="recent">Recently Updated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Experience Cards Grid */}
      <div className="grid grid-cols-1 gap-4 @xl/page:grid-cols-2 @5xl/page:grid-cols-3">
        {mockExperiences.map((experience) => (
          <Card key={experience.id} className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card overflow-hidden">
            {/* Thumbnail Header */}
            <div className="relative aspect-video bg-gradient-to-br from-muted/50 to-muted w-full border-b overflow-hidden">
              <Image
                src={experience.thumbnail}
                alt={experience.title}
                fill
                className="object-cover"
              />
              
              {/* Active/Live Indicator */}
              {experience.isActive && (
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1.5 bg-green-500/90 text-white text-xs px-2.5 py-1.5 rounded-full backdrop-blur-sm font-medium">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Live
                  </div>
                </div>
              )}
            </div>
            
            <CardHeader>
              {/* Status and Safety Score */}
              <div className="flex items-center justify-between gap-3 mb-2">
                <Badge 
                  variant={experience.isActive ? "default" : "secondary"}
                  className={`gap-1 ${
                    experience.isActive 
                      ? "bg-green-50 text-green-700 hover:bg-green-50 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" 
                      : "bg-muted text-muted-foreground hover:bg-muted border-border"
                  } shadow-none font-medium`}
                >
                  {experience.isActive ? "Active" : "Inactive"}
                </Badge>
                
                <div className="flex items-center gap-1 text-sm">
                  <IconShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                    {experience.safetyScore}%
                  </span>
                </div>
              </div>

              {/* Experience Title */}
              <CardTitle className="font-clash text-xl font-semibold @[250px]/card:text-2xl line-clamp-1">
                {experience.title}
              </CardTitle>
              
              {/* Stats Row */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <IconUsers className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-medium">{experience.playerCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <IconClock className="w-3.5 h-3.5" />
                  <span className="font-medium">{new Date(experience.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Description */}
              <CardDescription className="text-sm leading-relaxed mb-4 line-clamp-2">
                {experience.description}
              </CardDescription>
              
              {/* Action Button */}
              <Button 
                className="w-full shadow-none font-medium" 
                variant={experience.isActive ? "default" : "outline"}
              >
                Manage Experience
                <IconChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 