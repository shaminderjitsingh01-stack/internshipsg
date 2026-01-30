"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

export default function PricingPage() {
  const { data: session } = useSession();
  const { isDarkTheme, toggleTheme } = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isYearly, setIsYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansRes = await fetch("/api/subscription/plans");
        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data.plans || []);
        }

        if (session?.user?.email) {
          const subRes = await fetch(`/api/subscription?email=${encodeURIComponent(session.user.email)}`);
          if (subRes.ok) {
            const data = await subRes.json();
            setCurrentPlan(data.plan?.name || "free");
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const getPlanPrice = (plan: Plan) => {
    if (isYearly) {
      return plan.price_yearly;
    }
    return plan.price_monthly;
  };

  const getYearlySavings = (plan: Plan) => {
    const monthlyTotal = plan.price_monthly * 12;
    const savings = monthlyTotal - plan.price_yearly;
    return savings > 0 ? Math.round(savings) : 0;
  };

  const getPlanFeatures = (plan: Plan): string[] => {
    if (Array.isArray(plan.features)) {
      return plan.features;
    }
    try {
      return JSON.parse(plan.features as unknown as string);
    } catch {
      return [];
    }
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${isDarkTheme ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-8 ${isDarkTheme ? "brightness-0 invert" : ""}`} />
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className={`p-2 rounded-lg ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}>
              {isDarkTheme ? "☀️" : "🌙"}
            </button>
            {session ? (
              <Link href="/home" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Go to Feed
              </Link>
            ) : (
              <Link href="/auth/signin" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className={`text-lg max-w-2xl mx-auto mb-8 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
          Unlock your full potential with premium features. Start free, upgrade anytime.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={!isYearly ? "font-semibold" : isDarkTheme ? "text-slate-400" : "text-slate-500"}>Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? "bg-red-600" : isDarkTheme ? "bg-slate-700" : "bg-slate-300"}`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isYearly ? "translate-x-8" : "translate-x-1"}`} />
          </button>
          <span className={isYearly ? "font-semibold" : isDarkTheme ? "text-slate-400" : "text-slate-500"}>
            Yearly <span className="text-green-500 text-sm">(Save up to 17%)</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan === plan.name;
              const isPro = plan.name === "pro";
              const features = getPlanFeatures(plan);

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 ${
                    isPro
                      ? "bg-red-600 text-white ring-4 ring-red-600 ring-offset-4 " + (isDarkTheme ? "ring-offset-slate-950" : "ring-offset-slate-50")
                      : isDarkTheme
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  {isPro && (
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                      Most Popular
                    </span>
                  )}

                  <h3 className={`text-xl font-bold capitalize ${!isPro && isDarkTheme ? "text-white" : ""}`}>
                    {plan.name}
                  </h3>

                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold">
                      ${getPlanPrice(plan)}
                    </span>
                    <span className={isPro ? "text-white/70" : isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                      /{isYearly ? "year" : "month"}
                    </span>
                    {isYearly && getYearlySavings(plan) > 0 && (
                      <p className={`text-sm mt-1 ${isPro ? "text-white/70" : "text-green-500"}`}>
                        Save ${getYearlySavings(plan)}/year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className={`w-5 h-5 flex-shrink-0 ${isPro ? "text-white" : "text-green-500"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className={isPro ? "" : isDarkTheme ? "text-slate-300" : "text-slate-600"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className={`w-full py-3 rounded-lg font-medium ${
                        isPro
                          ? "bg-white/20 text-white cursor-default"
                          : isDarkTheme
                          ? "bg-slate-800 text-slate-400 cursor-default"
                          : "bg-slate-100 text-slate-400 cursor-default"
                      }`}
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        isPro
                          ? "bg-white text-red-600 hover:bg-slate-100"
                          : plan.name === "free"
                          ? isDarkTheme
                            ? "bg-slate-800 text-white hover:bg-slate-700"
                            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {plan.name === "free" ? "Get Started" : "Upgrade Now"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className={`py-16 px-4 ${isDarkTheme ? "bg-slate-900" : "bg-white"}`}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayNow, and GrabPay. All payments are processed securely."
              },
              {
                q: "Is there a student discount?",
                a: "Yes! Students with a valid .edu email get 50% off Pro and Premium plans."
              },
              {
                q: "Can I switch plans?",
                a: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
            ].map((faq, i) => (
              <div key={i} className={`p-6 rounded-xl ${isDarkTheme ? "bg-slate-800" : "bg-slate-50"}`}>
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className={isDarkTheme ? "text-slate-400" : "text-slate-600"}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-4 border-t ${isDarkTheme ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>© 2026 Internship.sg. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
