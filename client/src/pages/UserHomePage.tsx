import { Card, CardBody, Chip } from "@heroui/react";
import { ArrowRight, Quote, ShoppingCart, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart, api, getErrorMessage, getProducts, getPublicReviews } from "../api";
import { AppButton as Button } from "../components/ui/AppButton";
import { useAuth } from "../context/AuthContext";
import type { PublicReview } from "../types";

type HomeData = {
  user: { id: string; fullName: string; email: string };
  cartCount: number;
  latestProducts: {
    id: number;
    title: string;
    shortDescription: string;
    price: number;
    subscriptions: { id: number; durationMonths: number; finalPrice: number; discountPercent: number }[];
  }[];
  featuredProducts: {
    id: number;
    title: string;
    shortDescription: string;
    price: number;
    subscriptions: { id: number; durationMonths: number; finalPrice: number; discountPercent: number }[];
  }[];
  maxVoucherDiscountPercent?: number;
  featuredVoucherCode?: string;
};

const HERO_SLIDES = [
  {
    tag: "AI Automation Store",
    headline: "Automate Everything.",
    sub: "Premium AI workflows, n8n pipelines, and scripts — built to save time and grow revenue.",
    accent: "#ef4444",
  },
  {
    tag: "n8n Workflows",
    headline: "No-Code Power.",
    sub: "Drag-and-drop automation workflows connected to 400+ apps. Ready in minutes.",
    accent: "#3b82f6",
  },
  {
    tag: "AI Integrations",
    headline: "Smarter Pipelines.",
    sub: "Connect GPT-4, Claude, and custom models to your business data seamlessly.",
    accent: "#a855f7",
  },
  {
    tag: "Scripts & Tools",
    headline: "Python on Autopilot.",
    sub: "Web scrapers, data cleaners, report generators — all packaged and ready to deploy.",
    accent: "#10b981",
  },
];

export function UserHomePage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Record<number, number>>({});
  const [heroIndex, setHeroIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const reviewTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Guest: load public products to show on home page
      getProducts()
        .then((res) => {
          const defaults: Record<number, number> = {};
          res.data.forEach((p) => {
            if (p.subscriptions.length > 0) defaults[p.id] = p.subscriptions[0].durationMonths;
          });
          setData({
            user: { id: "", fullName: "", email: "" },
            cartCount: 0,
            latestProducts: res.data,
            featuredProducts: res.data.slice(0, 4),
          });
          setSelectedPlans(defaults);
        })
        .catch(() => setData(null))
        .finally(() => setLoading(false));
      return;
    }
    api
      .get<{ success: boolean; data: HomeData }>("api/user/home")
      .then((res) => {
        setData(res.data.data);
        const defaults: Record<number, number> = {};
        res.data.data.featuredProducts.forEach((p) => {
          if (p.subscriptions.length > 0) defaults[p.id] = p.subscriptions[0].durationMonths;
        });
        setSelectedPlans(defaults);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  // Fetch public reviews
  useEffect(() => {
    getPublicReviews().then((res) => setReviews(res.data)).catch(() => setReviews([]));
  }, []);

  // Reviews auto-advance
  useEffect(() => {
    if (reviews.length <= 1) return;
    reviewTimer.current = setInterval(() => {
      setReviewIndex((i) => (i + 1) % reviews.length);
    }, 4000);
    return () => { if (reviewTimer.current) clearInterval(reviewTimer.current); };
  }, [reviews]);

  // Hero slide auto-advance
  useEffect(() => {
    heroTimer.current = setInterval(() => {
      setAnimating(true);
      if (heroTransitionTimer.current) clearTimeout(heroTransitionTimer.current);
      heroTransitionTimer.current = setTimeout(() => {
        setHeroIndex((i) => (i + 1) % HERO_SLIDES.length);
        setAnimating(false);
      }, 350);
    }, 3600);
    return () => {
      if (heroTimer.current) clearInterval(heroTimer.current);
      if (heroTransitionTimer.current) clearTimeout(heroTransitionTimer.current);
    };
  }, []);

  // Banner slide auto-advance
  useEffect(() => {
    if (!data?.featuredProducts.length) return;
    bannerTimer.current = setInterval(() => {
      setBannerIndex((i) => (i + 1) % data.featuredProducts.length);
    }, 4200);
    return () => { if (bannerTimer.current) clearInterval(bannerTimer.current); };
  }, [data]);

  const goHero = (idx: number) => {
    if (heroTimer.current) clearInterval(heroTimer.current);
    if (heroTransitionTimer.current) clearTimeout(heroTransitionTimer.current);
    setAnimating(true);
    heroTransitionTimer.current = setTimeout(() => {
      setHeroIndex(idx);
      setAnimating(false);
    }, 300);
  };

  const goBanner = (idx: number) => {
    if (bannerTimer.current) clearInterval(bannerTimer.current);
    setBannerIndex(idx);
  };

  const onAdd = async (productId: number, durationMonths: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setCartMsg(null);
    try {
      const res = await addToCart(productId, durationMonths);
      setCartMsg({ text: res.message ?? "Added to cart!", type: "success" });
    } catch (e) {
      setCartMsg({ text: getErrorMessage(e, "Failed to add"), type: "error" });
    }
  };

  if (loading || authLoading) return <p className="section-subtitle">Loading...</p>;

  const slide = HERO_SLIDES[heroIndex];
  const featured = data?.featuredProducts ?? [];
  const banner = featured[bannerIndex];

  return (
    <section className="premium-section">

      {/* ── HERO — Animated Slides ── */}
      <Card className="premium-hero overflow-hidden">
        <CardBody className="p-0">
          <div
            className="premium-hero-stage relative"
            style={{
              background: `linear-gradient(135deg, var(--theme-surface-strong) 0%, color-mix(in srgb, ${slide.accent} 10%, var(--theme-surface-strong)) 100%)`,
              transition: "background 0.5s ease",
            }}
          >
            {/* Slide content */}
            <div
              className="premium-hero-copy"
              style={{
                opacity: animating ? 0 : 1,
                transform: animating ? "translateY(14px)" : "translateY(0)",
                transition: "opacity 0.35s ease, transform 0.35s ease",
              }}
            >
              <Chip
                size="sm"
                variant="flat"
                className="premium-badge"
                style={{
                  background: `color-mix(in srgb, ${slide.accent} 15%, transparent)`,
                  color: slide.accent,
                  border: `1px solid color-mix(in srgb, ${slide.accent} 35%, transparent)`,
                }}
              >
                {slide.tag}
              </Chip>

              <h1 className="premium-display">
                {slide.headline}{" "}
                <span style={{ color: slide.accent }}>Built for you.</span>
              </h1>
              <p className="premium-card-desc text-base max-w-xl">{slide.sub}</p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  radius="full"
                  size="lg"
                  className="font-bold"
                  style={{ background: slide.accent, color: "#fff" }}
                  onPress={() => navigate("/products")}
                  startContent={<Zap size={16} />}
                >
                  Explore Products
                </Button>
              </div>
            </div>

            {/* Dots */}
            <div className="flex min-h-[8px] items-center gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goHero(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === heroIndex ? "28px" : "8px",
                    height: "8px",
                    background: i === heroIndex ? slide.accent : "var(--theme-border)",
                  }}
                />
              ))}
            </div>

            {/* Decorative glow */}
            <div
              className="pointer-events-none absolute right-[-80px] top-[-80px] rounded-full opacity-[0.08] blur-3xl"
              style={{ width: "350px", height: "350px", background: slide.accent, transition: "background 0.5s ease" }}
            />
          </div>
        </CardBody>
      </Card>

      {/* ── VOUCHER STRIP ── */}
      {data?.featuredVoucherCode && (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl border px-5 py-3"
          style={{
            background: "color-mix(in srgb, var(--theme-green) 8%, var(--theme-surface))",
            borderColor: "color-mix(in srgb, var(--theme-green) 30%, transparent)",
          }}
        >
          <p className="text-sm font-medium text-[var(--theme-text)]">
            🎟 Use{" "}
            <span className="font-mono font-bold" style={{ color: 'var(--theme-green)', fontWeight: 700 }}>{data?.featuredVoucherCode}</span>
            {data?.maxVoucherDiscountPercent
              ? <span style={{ color: 'var(--theme-green)', fontWeight: 700 }}> — save up to {data.maxVoucherDiscountPercent}%</span>
              : " at checkout"}
          </p>
          <Button variant="flat" radius="full" color="success" size="sm" className="font-bold" onPress={() => navigate("/cart")}>
            Checkout
          </Button>
        </div>
      )}

      {cartMsg && (
        <p className={`text-sm ${cartMsg.type === "success" ? "premium-success" : "premium-danger"}`}>
          {cartMsg.text}
        </p>
      )}

      {/* ── FEATURED PRODUCTS — Banner Slide ── */}
      {featured.length > 0 && (
        <div className="space-y-4">
          <div className="premium-section-head">
            <div>
              <p className="premium-kicker">Featured Drop</p>
              <h2 className="section-title">High-converting product picks</h2>
            </div>
            <Button variant="light" radius="full" className="font-bold" endContent={<ArrowRight size={14} />} onPress={() => navigate("/products")}>
              View All
            </Button>
          </div>

          {/* Banner card — fixed height, one product at a time */}
          {banner && (() => {
            const selectedDuration = selectedPlans[banner.id];
            const selectedPlan =
              banner.subscriptions.find((s) => s.durationMonths === selectedDuration) ?? banner.subscriptions[0];

            return (
              <div
                className="home-feature-banner relative overflow-hidden rounded-2xl border"
                style={{
                  background: "var(--theme-surface-strong)",
                  borderColor: "var(--theme-border)",
                }}
              >
                {/* Accent glow */}
                <div
                  className="pointer-events-none absolute left-[-60px] top-[-60px] rounded-full opacity-[0.07] blur-2xl"
                  style={{ width: "280px", height: "280px", background: "var(--theme-red)" }}
                />

                <div className="relative flex h-full flex-col gap-5 p-6 sm:grid sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
                  {/* Left */}
                  <div className="flex-1 space-y-3">
                    <Chip size="sm" variant="flat" className="premium-badge premium-chip-red">Featured</Chip>
                    <h3 className="text-2xl font-black text-[var(--theme-text)]">{banner.title}</h3>
                    <p className="premium-card-desc max-w-md">{banner.shortDescription}</p>

                    {/* Plan pills */}
                    <div className="home-feature-plan-strip pt-1">
                      {banner.subscriptions.map((plan) => {
                        const active = selectedDuration === plan.durationMonths;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() =>
                              setSelectedPlans((prev) => ({ ...prev, [banner.id]: plan.durationMonths }))
                            }
                            className={active ? "home-feature-plan home-feature-plan-active" : "home-feature-plan"}
                          >
                            <span
                              className="home-feature-plan-duration"
                              style={{ color: 'var(--theme-yellow)', WebkitTextStroke: '0.5px var(--theme-border)' }}
                            >
                              {plan.durationMonths}m
                            </span>
                            <span
                              className="home-feature-plan-price"
                              style={{ color: 'var(--theme-price)' }}
                            >
                              ৳{plan.finalPrice}
                            </span>
                            {plan.discountPercent > 0 && (
                              <span className="premium-offer" style={{ color: 'var(--theme-green)', fontWeight: 700 }}>
                                -{plan.discountPercent}% save
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right — price + CTA */}
                  <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                    <div className="text-left sm:text-right">
                      <p className="premium-stat-label">Selected Plan</p>
                      <p
                        className="text-3xl font-black"
                        style={{ color: 'var(--theme-price)' }}
                      >
                        ৳{selectedPlan?.finalPrice ?? banner.price}
                      </p>
                      {selectedPlan?.discountPercent && selectedPlan.discountPercent > 0 && (
                        <p className="premium-offer text-sm" style={{ color: 'var(--theme-green)', fontWeight: 700 }}>
                          {selectedPlan.discountPercent}% save
                        </p>
                      )}
                    </div>
                    <Button
                      radius="full"
                      color="danger"
                      size="lg"
                      className="w-full font-bold sm:w-auto sm:min-w-[170px]"
                      startContent={<ShoppingCart size={15} />}
                      onPress={() => selectedPlan && onAdd(banner.id, selectedPlan.durationMonths)}
                      isDisabled={!selectedPlan}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>

                {/* Dots */}
                {featured.length > 1 && (
                  <div className="flex items-center justify-center gap-2 pb-4">
                    {featured.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goBanner(i)}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === bannerIndex ? "24px" : "7px",
                          height: "7px",
                          background: i === bannerIndex ? "var(--theme-red)" : "var(--theme-border)",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── REVIEWS CAROUSEL ── */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <div className="premium-section-head">
            <div>
              <p className="premium-kicker">Testimonials</p>
              <h2 className="section-title">What People Say About Us</h2>
            </div>
          </div>

          <div className="reviews-carousel-wrap">
            {/* Track — slides 3 at a time on desktop, 1 on mobile */}
            <div className="reviews-carousel-track">
              {reviews.map((review, i) => {
                const total = reviews.length;
                const offset = ((i - reviewIndex + total) % total);
                const visible = offset < 3;
                return (
                  <div
                    key={review.id}
                    className="reviews-carousel-card"
                    style={{
                      transform: `translateX(calc(${offset * 100}% + ${offset * 1.5}rem))`,
                      opacity: visible ? 1 : 0,
                      pointerEvents: visible ? "auto" : "none",
                      transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1), opacity 0.4s ease",
                    }}
                  >
                    <Quote size={22} style={{ color: "var(--theme-red)", opacity: 0.7, marginBottom: "0.75rem" }} />
                    <p className="text-sm leading-relaxed text-[var(--theme-text)] flex-1">{review.message}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--theme-blue)]/15 text-xs font-black text-[var(--theme-blue)]">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--theme-text)]">{review.userName}</p>
                        <p className="text-[10px] text-[var(--theme-muted)]">
                          {new Date(review.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dots */}
            {reviews.length > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (reviewTimer.current) clearInterval(reviewTimer.current);
                      setReviewIndex(i);
                    }}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === reviewIndex ? "24px" : "7px",
                      height: "7px",
                      background: i === reviewIndex ? "var(--theme-red)" : "var(--theme-border)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
