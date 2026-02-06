import React, { useState } from 'react';

interface AutocompleteInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    options: string[];
    className?: string;
}

export const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(({ value, onChange, placeholder, options, className }, ref) => {
    const [show, setShow] = useState(false);

    // Filter options based on input
    const filtered = options.filter(opt =>
        opt.toLowerCase().includes(value.toLowerCase()) && opt.toLowerCase() !== value.toLowerCase()
    );

    return (
        <div className="relative">
            <input
                ref={ref}
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setShow(true);
                }}
                onFocus={() => setShow(true)}
                // Delay blur to allow clicking the item
                onBlur={() => setTimeout(() => setShow(false), 200)}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />
            {show && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {filtered.map(opt => (
                        <div
                            key={opt}
                            className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium border-b last:border-0 border-slate-100 dark:border-slate-800/50"
                            onClick={() => {
                                onChange(opt);
                                setShow(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

AutocompleteInput.displayName = 'AutocompleteInput';
