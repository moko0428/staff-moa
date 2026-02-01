"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "pointer-events-auto w-[calc(100vw-2rem)] sm:w-[420px] rounded-lg border bg-background/95 text-foreground backdrop-blur-md shadow-lg shadow-black/10 ring-1 ring-black/5 dark:ring-white/10" +
            " data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-10" +
            " data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-10",
          title: "text-sm font-semibold",
          description: "text-sm text-muted-foreground",
          closeButton:
            "border border-border/60 bg-background/80 hover:bg-background text-foreground",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "bg-muted text-muted-foreground hover:bg-muted/80",
          success:
            "border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/25 dark:text-emerald-50",
          error:
            "border-red-500/30 bg-red-50 text-red-950 dark:bg-red-950/25 dark:text-red-50",
        },
      }}
      offset={16}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
