import React from "react";

interface PageHeaderProps {
  header: string;
  sub?: string; 
}

const PageHeader: React.FC<PageHeaderProps> = ({ header, sub }) => {
  return (
    <div className="mb-6 flex flex-col gap-1 text-left">
      <h1 className="text-2xl font-bold text-[#304a6d]">{header}</h1>
      {sub ? (
        <p className="text-sm text-gray-500">{sub}</p>
      ) : null}
    </div>
  );
};

export default PageHeader;