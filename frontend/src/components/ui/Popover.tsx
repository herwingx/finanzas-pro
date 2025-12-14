"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "../../lib/utils" // Asegúrate que esta ruta apunte a tu util 'cn'

// El componente raíz que maneja el estado abierto/cerrado
const Popover = PopoverPrimitive.Root

// El elemento (botón) que abre el popover
const PopoverTrigger = PopoverPrimitive.Trigger

// El contenido flotante
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 8, ...props }, ref) => (
  // Portal mueve este HTML al final del <body> para evitar errores de CSS (z-index/overflow)
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        // === Layout & Posicionamiento ===
        "z-50 w-auto outline-none", // Z-50 para que flote sobre todo

        // === Estilo Visual (Clean Fintech) ===
        "rounded-2xl border border-app-border",
        "bg-app-surface/95 text-app-text", // /95 para leve transparencia
        "shadow-2xl shadow-black/10 dark:shadow-black/40", // Sombra profunda y suave
        "backdrop-blur-xl", // Efecto vidrio esmerilado premium

        // === Animaciones (Radix States) ===
        "animate-in fade-in-0 zoom-in-95", // Entrada suave y pequeña escala
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95", // Salida inversa
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",

        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }