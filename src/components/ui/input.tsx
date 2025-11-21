import React from "react";
import clsx from "clsx"; // opcional, puedes quitarlo si no lo usas

// 👇 Heredamos todos los atributos nativos de <input>
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
    ...rest // 👈 aquí vienen min, max, step, etc.
}) => {
    return (
        <div className="w-full mb-4">
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={clsx(
                    "w-full px-4 py-2 rounded-md bg-surfaceMuted border text-sm",
                    error ? "border-error" : "border-borderSoft",
                    "focus:outline-none focus:ring-2 focus:ring-primary/60",
                    className
                )}
                {...rest} // 👈 aplica min, max, name, id, etc.
            />
            {error && <p className="text-sm text-error mt-1">{error}</p>}
        </div>
    );
};

export default Input;
