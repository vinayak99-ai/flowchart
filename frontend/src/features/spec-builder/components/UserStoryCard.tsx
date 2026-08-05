import type { UserStory } from "@/features/spec-builder/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AcceptanceScenarioList } from "@/features/spec-builder/components/AcceptanceScenarioList"
import { EditableBlock } from "@/features/spec-builder/components/EditableBlock"
import { Trash2 } from "lucide-react"

interface UserStoryCardProps {
  index: number
  story: UserStory
  onChange: (story: UserStory) => void
  onRemove: () => void
}

function StoryProse({ index, story }: { index: number; story: UserStory }) {
  return (
    <div className="flex flex-col gap-2 px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">{story.title || `Story ${index + 1}`}</h3>
        <Badge variant="secondary">{story.priority || "P?"}</Badge>
      </div>
      {story.description && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{story.description}</p>
      )}
      {story.why_this_priority && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Why this priority:</span> {story.why_this_priority}
        </p>
      )}
      {story.independent_test && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Independent test:</span> {story.independent_test}
        </p>
      )}
      {story.acceptance_scenarios.length > 0 && (
        <div className="mt-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Acceptance scenarios
          </p>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            {story.acceptance_scenarios.map((s, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <em>Given</em> {s.given}, <em>when</em> {s.when}, <em>then</em> {s.then}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function UserStoryCard({ index, story, onChange, onRemove }: UserStoryCardProps) {
  return (
    <Card>
      <EditableBlock label={story.title || `story ${index + 1}`} read={<StoryProse index={index} story={story} />}>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Story {index + 1}</CardTitle>
            <Badge variant="secondary">{story.priority || "P?"}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove story">
            <Trash2 className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Title</Label>
              <Input
                value={story.title}
                onChange={(e) => onChange({ ...story, title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <Input
                placeholder="P1"
                value={story.priority}
                onChange={(e) => onChange({ ...story, priority: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea
              className="min-h-16"
              value={story.description}
              onChange={(e) => onChange({ ...story, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Why this priority</Label>
            <Textarea
              className="min-h-16"
              value={story.why_this_priority}
              onChange={(e) => onChange({ ...story, why_this_priority: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Independent test</Label>
            <Textarea
              className="min-h-16"
              value={story.independent_test}
              onChange={(e) => onChange({ ...story, independent_test: e.target.value })}
            />
          </div>

          <AcceptanceScenarioList
            items={story.acceptance_scenarios}
            onChange={(acceptance_scenarios) => onChange({ ...story, acceptance_scenarios })}
          />
        </CardContent>
      </EditableBlock>
    </Card>
  )
}
