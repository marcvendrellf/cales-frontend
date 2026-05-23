import { useNavigate } from "react-router-dom"
import { Activity, TrendingUp } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Illustration } from "@/components/common/Illustration"
import { COMMODITIES } from "@/data/mock"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()

  const go = (path: string) => {
    onOpenChange(false)
    navigate(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Ask Cales — e.g. 'should we buy aluminium?'" />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <Illustration className="h-20 w-20" />
            <span className="text-sm text-muted-foreground">No matches.</span>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Recommendations">
          {COMMODITIES.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${c.id} buy wait hedge ${c.recommendation.action}`}
              onSelect={() => go(`/c/${c.id}`)}
            >
              <TrendingUp className="size-4 text-muted-foreground" />
              <span>Should we act on {c.name}?</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem value="command center overview dashboard" onSelect={() => go("/")}>
            <Activity className="size-4 text-muted-foreground" />
            Command Center
          </CommandItem>
          <CommandItem value="signals feed market" onSelect={() => go("/signals")}>
            <Activity className="size-4 text-muted-foreground" />
            Signals Feed
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
