import React from 'react';

interface TextareaProps {
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    error?: string;
    name?: string;
    id?: string;
    rows?: number;
}

const Textarea: React.FC<TextareaProps> = ({
    placeholder = '',
    value,
    onChange,
    error,
    name,
    id,
    rows = 3,
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
                className={`w-full px-4 py-2 rounded-md bg-[#FAFAF0] border ${error ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none`}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
    );
};

export default Textarea;
