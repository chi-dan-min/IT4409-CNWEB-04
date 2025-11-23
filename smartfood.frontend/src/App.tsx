import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import ShoppingList from "./pages/ShoppingList";
import Fridge from "./pages/Fridge";
import MealPlan from "./pages/MealPlan";
import Recipes from "./pages/Recipes";
import Reports from "./pages/Reports";
import Family from "./pages/Family";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import UserManagementPage from "./pages/UserManagementPage"; // <-- Import trang quản lý người dùng
import './app.css';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes - without Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Main App Routes - with Layout */}
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/shopping-list" element={<Layout><ShoppingList /></Layout>} />
          <Route path="/fridge" element={<Layout><Fridge /></Layout>} />
          <Route path="/meal-plan" element={<Layout><MealPlan /></Layout>} />
          <Route path="/recipes" element={<Layout><Recipes /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/family" element={<Layout><Family /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          {/* Cập nhật route /users để sử dụng UserManagementPage */}
          <Route path="/users" element={<Layout><UserManagementPage /></Layout>} /> 
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;