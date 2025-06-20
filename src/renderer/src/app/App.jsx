import { HashRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { DashboardRoutes } from "./routes";
import React from "react";

// import ScrollToTop from "@/shared/lib/ScrollToTop";
// import { useAuth } from "./contexts/AuthContext";

const App = () => {
  // const { loading } = useAuth();
  // if (loading) return;

  return (
    <ThemeProvider>
      <HashRouter>
        {/* <ScrollToTop /> */}
        <Routes>
          {/* {MainRoutes()} */}
          {DashboardRoutes()}
          {/* <Route path="/login" element={<LoginPage />} /> */}
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
