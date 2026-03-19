import { Avatar, Button, Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { LayoutDashboard, LogOut, Package, ReceiptText, ShieldCheck, ShoppingCart, UserCog } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const userLinks = [
  { to: "/home", label: "User Panel", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/account", label: "Account", icon: UserCog }
];

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: ShieldCheck },
  { to: "/admin/orders", label: "Admin Orders", icon: ReceiptText },
  { to: "/admin/products", label: "Admin Products", icon: Package },
  { to: "/admin/vouchers", label: "Admin Vouchers", icon: ShoppingCart }
];

export function AppLayout() {
  const { user, logoutAction } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = user?.role === "Admin" ? [...userLinks, ...adminLinks] : userLinks;

  const onLogout = async () => {
    await logoutAction();
    navigate("/login");
  };

  return (
    <div className="page-shell">
      <Navbar maxWidth="2xl" className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <div className="rounded-xl bg-blue-500/20 p-2 text-blue-300">
            <ShieldCheck size={16} />
          </div>
          <p className="font-semibold tracking-tight text-white">Linear Portal</p>
        </NavbarBrand>

        <NavbarContent justify="center" className="hidden gap-1 xl:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <NavbarItem key={to}>
              <Button
                size="sm"
                variant={location.pathname === to ? "solid" : "light"}
                color={location.pathname === to ? "primary" : "default"}
                startContent={<Icon size={14} />}
                onPress={() => navigate(to)}>
                {label}
              </Button>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-white">{user?.fullName}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <Avatar name={user?.fullName} size="sm" className="bg-blue-500/20 text-blue-200" />
              <Button variant="flat" color="danger" size="sm" startContent={<LogOut size={14} />} onPress={onLogout}>
                Logout
              </Button>
            </div>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
