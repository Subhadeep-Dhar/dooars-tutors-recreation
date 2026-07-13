"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { ChevronDown } from "lucide-react"

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

// Custom hook for click outside detection
function useClickAway(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

// Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline"
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "outline" && "border border-neutral-700 bg-transparent",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export interface DropdownOption {
  id: string
  label: string
  icon?: React.ElementType
  color?: string
}

// Icon wrapper with animation
const IconWrapper = ({
  icon: Icon,
  isHovered,
  color,
}: { icon?: React.ElementType; isHovered: boolean; color?: string }) => {
  if (!Icon) return null;
  return (
    <motion.div 
      className="w-4 h-4 mr-2 relative" 
      initial={false} 
      animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
    >
      <Icon className="w-4 h-4" />
      {isHovered && color && (
        <motion.div
          className="absolute inset-0"
          style={{ color }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Icon className="w-4 h-4" strokeWidth={2} />
        </motion.div>
      )}
    </motion.div>
  )
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.02,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
}

export interface FluidDropdownProps {
  options: DropdownOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  menuClassName?: string
}

export function FluidDropdown({ options, value, onChange, placeholder = "Select an option", className, menuClassName }: FluidDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Find the selected category based on the value prop
  const selectedCategory = options.find((opt) => opt.id === value) || null
  const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null)
  
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useClickAway(dropdownRef, () => setIsOpen(false))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  // Handle case where options might be empty
  if (!options || options.length === 0) {
    return <div className="text-sm text-neutral-500">No options available</div>
  }

  // Calculate the hover highlight position
  const activeHighlightId = hoveredCategory || (selectedCategory ? selectedCategory.id : null)
  const highlightIndex = activeHighlightId ? options.findIndex((c) => c.id === activeHighlightId) : -1

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn("w-full relative", className)}
        ref={dropdownRef}
      >
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full justify-between bg-[var(--bg-card)] text-[var(--text-primary)]",
              "hover:bg-[var(--bg-elevated)]",
              "focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0",
              "transition-all duration-200 ease-in-out",
              "border border-[var(--border)] focus:border-blue-500",
              "h-10 px-3",
              isOpen && "bg-[var(--bg-elevated)] border-blue-500",
            )}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <span className="flex items-center text-[14px]">
              {selectedCategory ? (
                <>
                  {selectedCategory.icon && (
                    <IconWrapper 
                      icon={selectedCategory.icon} 
                      isHovered={false} 
                      color={selectedCategory.color} 
                    />
                  )}
                  <span className="truncate max-w-[200px]">{selectedCategory.label}</span>
                </>
              ) : (
                <span className="text-[var(--text-muted)] opacity-80 font-normal truncate">{placeholder}</span>
              )}
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center w-5 h-5 text-[var(--text-secondary)] opacity-70 shrink-0"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </Button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 1, y: 0, height: 0 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: "auto",
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  },
                }}
                exit={{
                  opacity: 0,
                  y: 0,
                  height: 0,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  },
                }}
                className={cn("absolute left-0 right-0 top-full mt-1.5 z-50", menuClassName)}
                onKeyDown={handleKeyDown}
              >
                <motion.div
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1.5 shadow-xl max-h-[260px] overflow-y-auto custom-scrollbar"
                  initial={{ borderRadius: 8 }}
                  animate={{
                    borderRadius: 12,
                    transition: { duration: 0.2 },
                  }}
                  style={{ transformOrigin: "top" }}
                >
                  <motion.div 
                    className="relative flex flex-col gap-0.5" 
                    variants={containerVariants} 
                    initial="hidden" 
                    animate="visible"
                  >
                    {/* Hover Highlight Background */}
                    {highlightIndex !== -1 && (
                      <motion.div
                        layoutId="hover-highlight"
                        className="absolute inset-x-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-md"
                        initial={false}
                        animate={{
                          y: highlightIndex * 38, // 38px is the height of each item (36px + 2px gap)
                          height: 36,
                        }}
                        transition={{
                          type: "spring",
                          bounce: 0.15,
                          duration: 0.4,
                        }}
                      />
                    )}
                    
                    {options.map((category) => {
                      const isSelected = selectedCategory?.id === category.id;
                      const isHovered = hoveredCategory === category.id;
                      
                      return (
                        <motion.button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            onChange(category.id)
                            setIsOpen(false)
                          }}
                          onHoverStart={() => setHoveredCategory(category.id)}
                          onHoverEnd={() => setHoveredCategory(null)}
                          className={cn(
                            "relative flex w-full items-center px-3 h-[36px] text-sm rounded-md",
                            "transition-colors duration-150",
                            "focus:outline-none",
                            isSelected || isHovered
                              ? "text-blue-600 dark:text-blue-400 font-medium"
                              : "text-[var(--text-primary)]",
                          )}
                          whileTap={{ scale: 0.98 }}
                          variants={itemVariants}
                        >
                          {category.icon && (
                            <IconWrapper
                              icon={category.icon}
                              isHovered={isHovered}
                              color={category.color}
                            />
                          )}
                          <span className="truncate">{category.label}</span>
                          
                          {/* Selection indicator */}
                          {isSelected && !isHovered && (
                            <motion.div 
                              layoutId="active-indicator"
                              className="absolute left-0 w-0.5 h-4 bg-blue-500 rounded-r-full" 
                            />
                          )}
                        </motion.button>
                      )
                    })}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </MotionConfig>
  )
}
