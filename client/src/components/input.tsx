import clsx from "clsx";
import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = "", type = "text", ...props }, ref) => {
    return (
        <input
            ref={ref}
            type={type}
            className={clsx(
                "flex h-10 w-full rounded-md border border-zinc-300 bg-white",
                "px-3 py-2 text-sm text-zinc-900",
                "placeholder:text-zinc-400",
                "transition-colors",
                "focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                className
            )}
            {...props}
        />
    );
});

Input.displayName = "Input";
