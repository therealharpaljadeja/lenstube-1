import clsx from "clsx";
import { FC, InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id?: string;
  type?: string;
  className?: string;
  validationError?: string;
}

export const Input: FC<Props> = ({
  label,
  type = "text",
  validationError,
  className = "",
  id,
  ...props
}) => {
  return (
    <label className="w-full" htmlFor={id}>
      {label && (
        <div className="flex items-center mb-1 space-x-1.5">
          <div className="text-[11px] font-semibold uppercase opacity-70">
            {label}
          </div>
        </div>
      )}
      <div className="flex">
        <input
          id={id}
          className={clsx(
            { "!border-red-500": validationError?.length },
            "bg-white text-sm px-2.5 py-1 rounded-md dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-60 disabled:bg-gray-500 disabled:bg-opacity-20 outline-none w-full",
            className
          )}
          type={type}
          {...props}
        />
      </div>
      {validationError && (
        <div className="mx-1 mt-1 text-sm text-red-500">{validationError}</div>
      )}
    </label>
  );
};
