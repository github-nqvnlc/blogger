"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "hsl(142 76% 90%)",
          "--success-border": "hsl(142 76% 70%)",
          "--success-text": "hsl(142 76% 15%)",
          "--success-icon": "hsl(142 76% 25%)",
          "--error-bg": "hsl(0 86% 90%)",
          "--error-border": "hsl(0 86% 65%)",
          "--error-text": "hsl(0 86% 15%)",
          "--error-icon": "hsl(0 86% 35%)",
          "--warning-bg": "hsl(45 93% 90%)",
          "--warning-border": "hsl(45 93% 65%)",
          "--warning-text": "hsl(45 93% 15%)",
          "--warning-icon": "hsl(45 93% 35%)",
          "--info-bg": "hsl(210 100% 90%)",
          "--info-border": "hsl(210 100% 65%)",
          "--info-text": "hsl(210 100% 15%)",
          "--info-icon": "hsl(210 100% 35%)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
