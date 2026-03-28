import React from "react";

const Alert = ({ type, text }) => {
  const alertType = type === "danger" ? "error" : "success";
  
  return (
    <div 
      className="absolute top-10 left-0 right-0 flex justify-center items-center"
      role="status"
      aria-live="polite"
    >
      <div
        className={`${
          type === "danger"
            ? "border border-red-200 bg-red-50 text-red-800"
            : "border border-blue-200 bg-blue-50 text-blue-800"
        } p-2 leading-none shadow-sm lg:rounded-full flex lg:inline-flex items-center`}
        role="alert"
        aria-atomic="true"
      >
        <span
          className={`${
            type === "danger"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          } flex rounded-full uppercase px-2 py-1 font-semibold mr-3`}
          aria-label={`Alert type: ${alertType}`}
        >
          {type === "danger" ? "Failed" : "Success"}
        </span>

        <span className="mr-2 text-left">{text}</span>
      </div>
    </div>
  );
};

export default Alert;
