import { Card, CardBody, Chip } from "@heroui/react";
import { CalendarDays, LogOut, Mail, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccount } from "../api";
import { AppButton as Button } from "../components/ui/AppButton";
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
    <section className="premium-section">
      <div className="premium-section-head">
        <div>
          <p className="premium-kicker">Customer Profile</p>
          <h2 className="section-title">My Account</h2>
        </div>
      </div>

      <Card className="premium-card">
        <CardBody className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-blue)]/15 text-2xl font-black text-[var(--theme-blue)]">
                {account.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-2xl font-black text-[var(--theme-text)]">{account.fullName}</p>
                <p className="mt-1 text-sm text-[var(--theme-muted)]">{account.email}</p>
              </div>
            </div>

            <Chip size="sm" variant="flat" color={account.isActive ? "success" : "danger"}>
              {account.isActive ? "Active" : "Inactive"}
            </Chip>
          </div>

          <div className="premium-account-grid">
            <div className="premium-detail-card">
              <Mail size={16} className="text-[var(--theme-blue)]" />
              <div>
                <p className="premium-stat-label">Email</p>
                <p className="text-sm font-semibold text-[var(--theme-text)]">{account.email}</p>
              </div>
            </div>

            <div className="premium-detail-card">
              <ShieldCheck size={16} className="text-[var(--theme-green)]" />
              <div>
                <p className="premium-stat-label">Verification</p>
                <p className={`text-sm font-semibold ${account.emailConfirmed ? "text-[var(--theme-green)]" : "text-[var(--theme-yellow)]"}`}>
                  {account.emailConfirmed ? "Verified" : "Not verified"}
                </p>
              </div>
            </div>

            <div className="premium-detail-card">
              <Phone size={16} className="text-[var(--theme-yellow)]" />
              <div>
                <p className="premium-stat-label">Phone</p>
                <p className="text-sm font-semibold text-[var(--theme-text)]">{account.phoneNumber ?? "No phone number on file"}</p>
              </div>
            </div>

            <div className="premium-detail-card">
              <CalendarDays size={16} className="text-[var(--theme-red)]" />
              <div>
                <p className="premium-stat-label">Joined</p>
                <p className="text-sm font-semibold text-[var(--theme-text)]">
                  {new Date(account.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--theme-border)] pt-4">
            <Button variant="flat" color="danger" radius="full" startContent={<LogOut size={14} />} onPress={onLogout}>
              Logout
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
