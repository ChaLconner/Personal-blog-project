import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Consistent UserAvatar component that can be used across the application
 * 
 * @param {Object} props
 * @param {string} props.src - Profile picture URL
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.name - User name for generating initials
 * @param {string} props.username - User username as fallback for initials
 * @param {string} props.email - User email as fallback for initials
 * @param {string} props.size - Size variant (sm, md, lg, xl, custom)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showBorder - Whether to show border
 * @param {string} props.fallbackClassName - Custom className for fallback
 */
export function UserAvatar({
  src,
  alt = "User Avatar",
  name,
  username,
  email,
  size = "md",
  className,
  showBorder = true,
  fallbackClassName,
}) {
  // Generate initials from name, username, or email
  const getInitials = () => {
    const source = name || username || email || "";
    if (!source) return "U";
    
    const initials = source
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return initials || "U";
  };

  // Size configurations - default to match bell size (w-12 h-12)
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12", // Changed to match bell size
    lg: "h-12 w-12",
    xl: "h-16 w-16",
    "2xl": "h-20 w-20",
    custom: ""
  };

  // Text size based on avatar size
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-sm",
    xl: "text-base",
    "2xl": "text-lg",
    custom: "text-sm"
  };

  const avatarSize = sizeClasses[size] || sizeClasses.md;
  const textSize = textSizes[size] || textSizes.md;

  return (
    <Avatar
      className={cn(
        avatarSize,
        showBorder && "border border-gray-300",
        className
      )}
    >
      <AvatarImage
        src={src}
        alt={alt}
        className="object-cover"
      />
      <AvatarFallback
        className={cn(
          "bg-gray-200 text-gray-700 font-medium",
          textSize,
          fallbackClassName
        )}
      >
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}

export default UserAvatar;