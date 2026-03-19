import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle
} from "@heroui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  TicketPercent,
  UserCog
} from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";

const userLinks = [
  { to: "/home", label: "Home", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/account", label: "Account", icon: UserCog }
];

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: ShieldCheck },
  { to: "/admin/orders", label: "Admin Orders", icon: ReceiptText },
  { to: "/admin/products", label: "Admin Products", icon: Package },
  { to: "/admin/vouchers", label: "Admin Vouchers", icon: TicketPercent }
];

export function AppLayout() {
  const { user, logoutAction } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        setIsMenuOpen(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onNavigate = (to: string) => {
    setIsMenuOpen(false);
    navigate(to);
  };

  const onLogout = async () => {
    await logoutAction();
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="page-shell">
      <Navbar
        isBordered={false}
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="2xl"
        className={`premium-navbar premium-navbar-floating ${showNavbar ? "navbar-visible" : "navbar-hidden"}`}>
        <NavbarContent justify="start" className="basis-0 grow gap-2">
          <NavbarMenuToggle className="mr-1 xl:hidden" srOnlyText="Toggle navigation menu">
            {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </NavbarMenuToggle>

          <NavbarBrand className="gap-3 cursor-pointer navbar-brand-wrap" onClick={() => onNavigate("/home")}>
            <motion.div 
              className="brand-mark"
              whileHover={{ rotate: 5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src="https://ik.imagekit.io/ekb0d0it0/avif%20favicon.avif" alt="Linear AI logo" />
            </motion.div>
            <div className="flex flex-col">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--theme-red)]">Linear AI</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-text)] opacity-50">Automation Store</p>
            </div>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent justify="center" className="navbar-center-toggle hidden xl:flex">
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
        </NavbarContent>

        <NavbarContent justify="end" className="navbar-desktop-actions hidden grow basis-0 xl:flex">
          <div className="flex items-center gap-1">
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

          <NavbarItem className="ml-2">
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

        <NavbarContent justify="end" className="gap-2 xl:hidden">
          <NavbarItem>
            <Button
              isIconOnly
              radius="full"
              variant="light"
              className="theme-toggle"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              onPress={toggleTheme}>
              {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu className="premium-menu pt-24">
          <motion.div 
            className="menu-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="mb-4 rounded-[2rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--theme-red)]">Navigation</p>
              <p className="mt-2 text-xl font-bold text-[var(--theme-text)]">{user?.fullName}</p>
              <p className="text-sm text-[var(--theme-muted)]">{user?.email}</p>
            </div>

            <div className="grid gap-2">
              {links.map(({ to, label, icon: Icon }, idx) => {
                const active = location.pathname === to;

                return (
                  <NavbarMenuItem key={to}>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`mobile-nav-item ${active ? "mobile-nav-item-active" : ""}`}
                      onClick={() => onNavigate(to)}>
                      <span className="mobile-nav-icon">
                        <Icon size={18} />
                      </span>
                      <span className="text-sm font-bold">{label}</span>
                    </motion.button>
                  </NavbarMenuItem>
                );
              })}
            </div>

            <NavbarMenuItem className="mt-6">
              <Button
                radius="full"
                variant="flat"
                className="logout-pill h-14 w-full font-bold"
                startContent={<LogOut size={18} />}
                onPress={onLogout}>
                Sign Out
              </Button>
            </NavbarMenuItem>
          </motion.div>
        </NavbarMenu>
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
    </div>
  );
}
