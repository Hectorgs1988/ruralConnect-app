import React from 'react';

interface TextareaProps {
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    error?: string;
    name?: string;
    id?: string;
    rows?: number;
    className?: string;
}

const Textarea: React.FC<TextareaProps> = ({
    placeholder = '',
    value,
    onChange,
    error,
    name,
    id,
    rows = 3,
    className,
}) => {
    return (
        <div className="w-full mb-4">
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                name={name}
                id={id}
                rows={rows}
                className={`w-full px-4 py-2 rounded-md bg-surfaceMuted border ${error ? 'border-error' : 'border-borderSoft'} focus:outline-none focus:ring-2 focus:ring-primary/60 resize-none text-sm ${className ?? ''}`}
            />
            {error && <p className="text-sm text-error mt-1">{error}</p>}
        </div>
    );
};

export default Textarea;
