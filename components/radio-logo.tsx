"use client"

import { Radio } from "lucide-react"

export function RadioLogo() {
  return (
    <div className="flex items-center gap-2">
      <Radio className="h-8 w-8 text-primary" />
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
        Rádio DoubleG
      </h1>
    </div>
  )
}