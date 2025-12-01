import React from "react";
import clsx from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    error?: string;
};

const Input: React.FC<InputProps> = ({
    type = "text",
    placeholder = "",
    value,
    onChange,
    error,
    className,
    ...rest
}) => {
    const isNativePicker = type === "date" || type === "time";

    return (
        <div className="w-full mb-4 overflow-x-hidden">
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={clsx(
                    "w-full px-4 py-2 bg-surfaceMuted border text-sm",
                    error ? "border-error" : "border-borderSoft",
                    "focus:outline-none focus:ring-2 focus:ring-primary/60",
                    isNativePicker &&
                        "rounded-full [appearance:none] [-webkit-appearance:none]",
                    !isNativePicker && "rounded-md",
                    className
                )}
                {...rest}
            />
            {error && <p className="text-sm text-error mt-1">{error}</p>}
        </div>
    );
};

export default Input;
