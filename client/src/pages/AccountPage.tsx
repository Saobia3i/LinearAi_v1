import { Button, Card, CardBody, Chip } from "@heroui/react";
import { CalendarDays, LogOut, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccount } from "../api";
import { useAuth } from "../context/AuthContext";
import type { AccountInfo } from "../types";

export function AccountPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { logoutAction } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getAccount()
      .then((res) => setAccount(res.data))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, []);

  const onLogout = async () => {
    await logoutAction();
    navigate("/login");
  };

  if (loading) return <p className="section-subtitle">Loading account...</p>;
  if (!account) return <p className="section-subtitle">Failed to load account.</p>;

  return (
    <section className="space-y-4">
      <h2 className="section-title">My Account</h2>

      <Card className="border border-slate-800 bg-slate-900/70">
        <CardBody className="space-y-5">
          {/* Avatar + name + role */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20 text-2xl font-bold text-blue-300">
              {account.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{account.fullName}</p>
              <div className="flex gap-2 mt-1">
                <Chip size="sm" variant="flat" color={account.isActive ? "success" : "danger"}>
                  {account.isActive ? "Active" : "Inactive"}
                </Chip>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Mail size={14} className="text-slate-400" />
              <span>{account.email}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck size={14} className="text-slate-400" />
              <span>Email: {account.emailConfirmed ? (
                <span className="text-emerald-400">Verified</span>
              ) : (
                <span className="text-yellow-400">Not verified</span>
              )}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Phone size={14} className="text-slate-400" />
              <span>{account.phoneNumber ?? "No phone number on file"}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CalendarDays size={14} className="text-slate-400" />
              <span>Joined {new Date(account.createdAt).toLocaleString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit"
              })}</span>
            </div>
          </div>

          {/* Logout */}
          <div className="pt-2 border-t border-slate-800">
            <Button
              variant="flat"
              color="danger"
              size="sm"
              startContent={<LogOut size={14} />}
              onPress={onLogout}>
              Logout
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
