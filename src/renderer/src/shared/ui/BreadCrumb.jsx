import React from "react";
import { Link, useLocation } from "react-router-dom";

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="text-sm text-zinc-600 mb-12" aria-label="Breadcrumb">
      <ol className="flex space-x-2">
        {pathnames.map((name, index) => {
          const routeTo = "/" + pathnames.slice(0, index + 1).join("/");
          const isLast = index === pathnames.length - 1;

          return (
            <li key={routeTo} className="flex items-center space-x-2">
              <span className="mx-1">/</span>
              {isLast ? (
                <span className="text-zinc-800 font-semibold capitalize">
                  {decodeURIComponent(name)}
                </span>
              ) : (
                <Link to={routeTo} className="hover:underline capitalize">
                  {decodeURIComponent(name)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
