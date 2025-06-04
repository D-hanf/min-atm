import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// import ScrollToTop from "@/shared/lib/ScrollToTop";
import { DashboardRoutes } from "./routes";
// import { LoginPage } from "@/pages/auth";
// import { useAuth } from "./contexts/AuthContext";

const App = () => {
  // const { loading } = useAuth();
  // if (loading) return;

  return (
    <BrowserRouter>
      {/* <ScrollToTop /> */}
      <Routes>
        {/* {MainRoutes()} */}
        {DashboardRoutes()}
        {/* <Route path="/login" element={<LoginPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
