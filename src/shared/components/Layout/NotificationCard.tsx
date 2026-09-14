import React from "react";

interface NotificationCardProps {
  title: string;
  message: string;
  indicatorColor?: string;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  message,
  indicatorColor = "bg-blue-500",
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-1 gap-2">
        <span className="font-semibold text-sm text-gray-800 leading-tight">
          {title}
        </span>
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${indicatorColor}`}
        ></span>
      </div>
      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
        {message}
      </p>
    </div>
  );
};

export default NotificationCard;