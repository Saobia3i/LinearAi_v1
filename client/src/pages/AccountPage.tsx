import { Card, CardBody, Chip } from "@heroui/react";
import { CalendarDays, LogOut, Mail, MessageSquare, Phone, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccount, getErrorMessage, submitFeedback } from "../api";
import { AppButton as Button } from "../components/ui/AppButton";
import { useAuth } from "../context/AuthContext";
import type { AccountInfo } from "../types";

export function AccountPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { logoutAction } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"feedback" | "contact">("feedback");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSubject, setFbSubject] = useState("");
  const [fbMsg, setFbMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbErrors, setFbErrors] = useState<{ message?: string; subject?: string }>({});

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

  const onSubmit = async () => {
    const errors: { message?: string; subject?: string } = {};
    if (!fbMessage.trim()) errors.message = "Message is required.";
    else if (fbMessage.trim().length < 10) errors.message = "Message must be at least 10 characters.";
    if (activeTab === "contact" && !fbSubject.trim()) errors.subject = "Subject is required for contact messages.";
    setFbErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFbLoading(true);
    setFbMsg(null);
    try {
      const res = await submitFeedback({
        message: fbMessage.trim(),
        type: activeTab,
        subject: activeTab === "contact" ? fbSubject.trim() || undefined : undefined,
      });
      setFbMsg({ text: res.message ?? "Submitted!", type: "success" });
      setFbMessage("");
      setFbSubject("");
      setFbErrors({});
    } catch (e) {
      setFbMsg({ text: getErrorMessage(e, "Failed to submit."), type: "error" });
    } finally {
      setFbLoading(false);
    }
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

      {/* Profile Card */}
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
            <Chip size="sm" variant="flat" color={account.isActive ? "success" : "danger"} className="premium-badge">
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
                  {new Date(account.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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

      {/* Feedback / Contact Card */}
      <Card className="premium-card">
        <CardBody className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="premium-icon-badge premium-icon-blue">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--theme-text)]">Feedback & Contact</h3>
              <p className="text-xs text-[var(--theme-muted)]">We read every message</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2">
            {(["feedback", "contact"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setFbMsg(null); setFbErrors({}); }}
                className="rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200"
                style={activeTab === tab
                  ? { background: "var(--theme-blue)", color: "#fff", boxShadow: "0 2px 8px color-mix(in srgb, var(--theme-blue) 30%, transparent)" }
                  : { background: "var(--theme-surface-soft)", color: "var(--theme-muted)", border: "1.5px solid var(--theme-border)" }
                }
              >
                {tab === "feedback" ? "Leave Feedback" : "Contact Us"}
              </button>
            ))}
          </div>

          {activeTab === "contact" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--theme-muted)] uppercase tracking-wide">Subject *</label>
              <input
                type="text"
                placeholder="e.g. Issue with my order"
                value={fbSubject}
                onChange={(e) => { setFbSubject(e.target.value); setFbErrors((p) => ({ ...p, subject: undefined })); }}
                maxLength={200}
                className={`account-form-input ${fbErrors.subject ? "account-form-input-error" : ""}`}
              />
              {fbErrors.subject && <p className="text-xs text-[var(--theme-red)] font-medium">{fbErrors.subject}</p>}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--theme-muted)] uppercase tracking-wide">
              {activeTab === "feedback" ? "Your Feedback *" : "Message *"}
            </label>
            <textarea
              placeholder={activeTab === "feedback" ? "Share your experience or suggestions... (min 10 characters)" : "Describe your issue or question in detail..."}
              value={fbMessage}
              onChange={(e) => { setFbMessage(e.target.value); setFbErrors((p) => ({ ...p, message: undefined })); }}
              rows={5}
              maxLength={1000}
              className={`account-form-input account-form-textarea ${fbErrors.message ? "account-form-input-error" : ""}`}
            />
            <div className="flex items-center justify-between">
              {fbErrors.message
                ? <p className="text-xs text-[var(--theme-red)] font-medium">{fbErrors.message}</p>
                : <span />
              }
              <p className="text-xs text-[var(--theme-muted)]">{fbMessage.length}/1000</p>
            </div>
          </div>

          {fbMsg && (
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-3"
              style={{
                borderColor: fbMsg.type === "success" ? "color-mix(in srgb, var(--theme-green) 40%, transparent)" : "color-mix(in srgb, var(--theme-red) 40%, transparent)",
                background: fbMsg.type === "success" ? "color-mix(in srgb, var(--theme-green) 8%, var(--theme-surface))" : "color-mix(in srgb, var(--theme-red) 8%, var(--theme-surface))",
              }}
            >
              <p className={`text-sm font-medium ${fbMsg.type === "success" ? "text-[var(--theme-green)]" : "text-[var(--theme-red)]"}`}>
                {fbMsg.text}
              </p>
            </div>
          )}

          <Button
            radius="full"
            color="primary"
            isLoading={fbLoading}
            isDisabled={!fbMessage.trim() || fbLoading}
            startContent={!fbLoading ? <Send size={14} /> : undefined}
            onPress={onSubmit}
            className="font-bold"
          >
            Send {activeTab === "feedback" ? "Feedback" : "Message"}
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
