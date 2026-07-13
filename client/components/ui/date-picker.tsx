"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

// We use inline cn to avoid issues if lib/utils isn't there, but usually shadcn has it.
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  value?: string | Date
  onChange: (date: string | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const date = value ? new Date(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-[var(--bg-card)] border-[var(--border)] h-10 px-3 hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]",
            !date && "text-[var(--text-muted)] opacity-80",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[var(--bg-card)] border-[var(--border)] shadow-xl" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : undefined)}
          disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
          className="text-[var(--text-primary)]"
          captionLayout="dropdown"
          startMonth={new Date(1900, 0)}
          endMonth={new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
