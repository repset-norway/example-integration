import type { ButtonHTMLAttributes } from "react";

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
}

export const Button = (props: IButtonProps) => {
    const variants = {
        primary: "bg-[#3d9aa1] text-white hover:bg-[#255c60]",
        secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
        ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100",
        outline: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
        destructive: "border border-red-600 text-red-600 hover:bg-red-600 hover:text-white",
    };

    return (
        <button
            {...props}
            className={[
                "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
                "transition-colors duration-150",
                "cursor-pointer",
                "disabled:pointer-events-none disabled:opacity-50",
                "focus:outline-none focus:ring-2 focus:ring-zinc-400",
                variants[props.variant ?? "primary"],
                props.className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {props.children}
        </button>
    );
};
