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
          type === "danger" ? "bg-red-900" : "bg-blue-900"
        } p-2 text-white leading-none lg:rounded-full flex lg:inline-flex items-center`}
        role="alert"
        aria-atomic="true"
      >
        <span
          className={`${
            type === "danger" ? "bg-red-600" : "bg-blue-600"
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
