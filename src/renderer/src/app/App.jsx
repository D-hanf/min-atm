import { HashRouter, Route, Routes } from "react-router-dom";

import { DashboardRoutes } from "./routes";
import React from "react";

// import ScrollToTop from "@/shared/lib/ScrollToTop";

// import { LoginPage } from "@/pages/auth";
// import { useAuth } from "./contexts/AuthContext";

const App = () => {
  // const { loading } = useAuth();
  // if (loading) return;

  return (
    <HashRouter>
      {/* <ScrollToTop /> */}
      <Routes>
        {/* {MainRoutes()} */}
        {DashboardRoutes()}
        {/* <Route path="/login" element={<LoginPage />} /> */}
      </Routes>
    </HashRouter>
  );
};

export default App;
