import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { AccountPage } from "./pages/AccountPage";
import { CartPage } from "./pages/CartPage";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ConfirmEmailPage } from "./pages/ConfirmEmailPage";
import { SignupPage } from "./pages/SignupPage";
import { RegisterSuccessPage } from "./pages/RegisterSuccessPage";
import { UserHomePage } from "./pages/UserHomePage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminVouchersPage } from "./pages/admin/AdminVouchersPage";

export default function App() {
  return (
    <Routes>
      {/* Auth pages (no layout) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/register-success" element={<RegisterSuccessPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/account/login" element={<Navigate to="/login" replace />} />
      <Route path="/account/register" element={<Navigate to="/signup" replace />} />
      <Route path="/account/register-success" element={<Navigate to="/register-success" replace />} />
      <Route path="/account/confirm-email" element={<Navigate to="/confirm-email" replace />} />

      {/* Public routes — accessible without login, but still use AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/home" element={<UserHomePage />} />
        <Route path="/products" element={<ProductsPage />} />

        {/* Protected routes — redirect to login if not authenticated */}
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute><RoleRoute allow={["Admin"]}><AdminDashboardPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute><RoleRoute allow={["Admin"]}><AdminOrdersPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute><RoleRoute allow={["Admin"]}><AdminProductsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/vouchers" element={<ProtectedRoute><RoleRoute allow={["Admin"]}><AdminVouchersPage /></RoleRoute></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
