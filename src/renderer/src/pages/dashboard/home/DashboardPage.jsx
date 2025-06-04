import React from "react";
// import { useArticleUserRecent } from "@/features/article/hooks";
import DashboardCard from "../../../features/dashboard/ui/DashboardCard";
// import DashboardGallery from "@/features/dashboard/ui/DashboardGallery";

const DashboardPage = () => {
  // const { data, isLoading } = useArticleUserRecent();

  const statistic = [
    {
      name: "Total article",
      value: 13,
    },
    {
      name: "Published",
      value: 10,
    },
    {
      name: "Drafted",
      value: 3,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statistic.map((stat, index) => (
          <DashboardCard key={index} {...stat} />
        ))}
      </div>
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">Recent Post</h2>
        {/* <DashboardGallery data={data} loading={isLoading} /> */}
      </div>
    </div>
  );
};

export default DashboardPage;
