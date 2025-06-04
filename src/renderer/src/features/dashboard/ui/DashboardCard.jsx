import React from "react";

const DashboardCard = ({ name, value }) => {
  return (
    <div className="border border-slate-300 rounded-md">
      <div className="container px-6 py-8">
        <h2 className="text-xl font-bold">{value}</h2>
        <p className="text-sm text-slate-400">{name}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
