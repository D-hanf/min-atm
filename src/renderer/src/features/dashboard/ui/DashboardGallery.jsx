import Loading from "@/shared/ui/Loading";
import React from "react";
import { useNavigate } from "react-router-dom";

const DashboardGallery = ({ data, loading }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-nowrap gap-x-4 overflow-auto">
      {loading ? (
        <Loading />
      ) : (
        data.map((article, index) => (
          <img
            onClick={() => navigate("/article/" + article.slug)}
            className="cursor-pointer aspect-video w-[250px] object-cover rounded-md"
            key={index}
            src={article.thumbnail}
            alt="thumbnail"
          />
        ))
      )}
    </div>
  );
};

export default DashboardGallery;
