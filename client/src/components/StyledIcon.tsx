import { type LucideIcon } from "lucide-react";
import { useTheme, type IconStyle } from "@/lib/ThemeContext";
import { cn } from "@/lib/utils";

interface StyledIconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  containerClassName?: string;
  showContainer?: boolean;
}

const ICON_STYLE_CONFIG: Record<IconStyle, { strokeWidth: number; containerClass: string }> = {
  default: { 
    strokeWidth: 1.5, 
    containerClass: "rounded-lg" 
  },
  rounded: { 
    strokeWidth: 2, 
    containerClass: "rounded-full" 
  },
  sharp: { 
    strokeWidth: 2.5, 
    containerClass: "rounded-none" 
  },
  playful: { 
    strokeWidth: 1.75, 
    containerClass: "rounded-xl" 
  },
};

export function StyledIcon({ 
  icon: Icon, 
  size = 22, 
  className = "",
  containerClassName = "",
  showContainer = false
}: StyledIconProps) {
  const { iconStyle } = useTheme();
  const config = ICON_STYLE_CONFIG[iconStyle];

  if (showContainer) {
    return (
      <div className={cn(config.containerClass, containerClassName)}>
        <Icon 
          size={size} 
          strokeWidth={config.strokeWidth}
          className={className}
        />
      </div>
    );
  }

  return (
    <Icon 
      size={size} 
      strokeWidth={config.strokeWidth}
      className={className}
    />
  );
}

export function getIconStyleConfig(iconStyle: IconStyle) {
  return ICON_STYLE_CONFIG[iconStyle];
}
