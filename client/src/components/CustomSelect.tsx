import React from 'react';

interface CustomSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  label?: string;
  containerClassName?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  label,
  className = '',
  containerClassName = '',
  ...props
}) => (
  <div className={`w-64 ${containerClassName}`}>
    {label && (
      <label className="block mb-2 text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        className={`block w-64 px-4 py-2.5 pr-10 rounded-lg border border-gray-300 bg-white text-gray-900 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
          appearance-none shadow-sm hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
        <svg
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  </div>
);

export default CustomSelect;
