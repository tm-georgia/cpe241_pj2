import React from "react";

export function Button({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  disabled = false, 
  className = "", 
  icon = null 
}) {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline: "border border-gray-200 hover:bg-gray-50 text-gray-700 focus:ring-gray-300"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export default Button;
