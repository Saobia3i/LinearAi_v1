import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  TicketPercent,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import { AppButton as Button } from "./ui/AppButton";

const userLinks = [
  { to: "/home", label: "Home", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/account", label: "Account", icon: UserCog }
];

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: ShieldCheck },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/vouchers", label: "Vouchers", icon: TicketPercent }
];

export function AppLayout() {
  const { user, logoutAction } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNavbar, setShowNavbar] = useState(true);

  const isAdmin = user?.role === "Admin";
  const links = isAdmin ? adminLinks : userLinks;
  const desktopLinks = links.filter((link) => link.to !== "/account");

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 24) {
        setShowNavbar(true);
      } else if (currentScrollY > lastScrollY) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onNavigate = (to: string) => {
    navigate(to);
  };

  const onLogout = async () => {
    await logoutAction();
    navigate("/login");
  };

  return (
    <div className="page-shell">
      <Navbar
        isBordered={false}
        maxWidth="2xl"
        className={`premium-navbar premium-navbar-floating ${showNavbar ? "navbar-visible" : "navbar-hidden"}`}>
        {/* Desktop Navbar: only show on lg+ */}
        <NavbarContent justify="start" className="basis-0 grow gap-2 hidden lg:flex">
          <NavbarBrand className="gap-3 cursor-pointer navbar-brand-wrap" onClick={() => onNavigate("/home")}> 
            <motion.div 
              className="brand-mark"
              whileHover={{ rotate: 5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={import.meta.env.VITE_LOGO_URL ?? "https://ik.imagekit.io/ekb0d0it0/avif%20favicon.avif"} alt="Linear AI logo" />
            </motion.div>
            <div className="flex flex-col">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--theme-red)]">Linear AI</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-text)] opacity-50">Automation Store</p>
            </div>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent justify="center" className="hidden lg:flex">
          <div className="flex items-center gap-1">
            <NavbarItem>
              <Button
                isIconOnly
                radius="full"
                variant="light"
                className="theme-toggle"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                onPress={toggleTheme}>
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === "dark" ? 0 : 180, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </motion.div>
              </Button>
            </NavbarItem>

            {desktopLinks.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <NavbarItem key={to}>
                  <Button
                    size="sm"
                    radius="full"
                    variant="light"
                    className={active ? "nav-pill-active nav-pill-compact" : "nav-pill nav-pill-compact"}
                    onPress={() => onNavigate(to)}>
                    {label}
                  </Button>
                </NavbarItem>
              );
            })}
          </div>
        </NavbarContent>

        <NavbarContent justify="end" className="hidden basis-0 lg:flex">
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <motion.button 
                  type="button" 
                  className="premium-user-name"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {user?.fullName}
                </motion.button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="User actions" 
                className="premium-user-menu" 
                itemClasses={{ base: "premium-user-menu-item" }}
              >
                <DropdownItem key="account" startContent={<UserCog size={16} />} onPress={() => onNavigate("/account")}>
                  Account
                </DropdownItem>
                <DropdownItem key="logout" color="danger" className="text-red-500" startContent={<LogOut size={16} />} onPress={onLogout}>
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        </NavbarContent>

        {/* Mobile/Tablet Navbar: only show on mobile/tablet (lg and below) */}
        <div className="flex w-full items-center justify-between gap-2 px-2 py-1 lg:hidden">
          {/* Left: Logo and name */}
          <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => onNavigate("/home")}>
            <motion.div
              className="brand-mark"
              whileHover={{ rotate: 5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src="https://ik.imagekit.io/ekb0d0it0/avif%20favicon.avif" alt="Linear AI logo" className="h-10 w-10 object-cover rounded-[1.1rem]" />
            </motion.div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--theme-red)] truncate">Linear AI</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-text)] opacity-50 truncate">Automation Store</p>
            </div>
          </div>
          {/* Right: Theme toggle */}
          <Button
            isIconOnly
            radius="full"
            variant="light"
            className="theme-toggle ml-auto"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onPress={toggleTheme}
          >
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
        </div>
      </Navbar>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="page-container"
          initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-tab-bar lg:hidden">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <motion.button
              key={to}
              type="button"
              className={`mobile-tab-item ${active ? "mobile-tab-item-active" : ""}`}
              onClick={() => onNavigate(to)}
              whileTap={{ scale: 0.88 }}
            >
              <span className="mobile-tab-icon">
                <Icon size={20} />
              </span>
              <span className="mobile-tab-label">{label}</span>
            </motion.button>
          );
        })}
        <motion.button
          type="button"
          className="mobile-tab-item mobile-tab-logout"
          onClick={onLogout}
          whileTap={{ scale: 0.88 }}
        >
          <span className="mobile-tab-icon">
            <LogOut size={20} />
          </span>
          <span className="mobile-tab-label">Logout</span>
        </motion.button>
      </nav>
    </div>
  );
}
