'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  CreditCard,
  Globe,
  Layers,
  MessageCircle,
  Rocket,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Video,
  Wand2,
  Zap,
  Box,
  Mail,
  Users,
} from 'lucide-react';
import ChatBot from '@/components/ChatBot';

/* ─── Data ─────────────────────────────────────────────────── */

const heroStats = [
  { value: '17 min', label: 'Avg launch time' },
  { value: '13', label: 'AI steps automated' },
  { value: '99%', label: 'Automation rate' },
];

const steps = [
  { icon: Search, title: 'Pick Your Niche', desc: 'Tell us what you want to sell. Our AI finds winning products with high profit margins from CJ Dropshipping.' },
  { icon: Wand2, title: 'AI Builds Everything', desc: 'Product photos, 3D models, ad copy, video ads, and a high-converting store page — generated in minutes.' },
  { icon: TrendingUp, title: 'AI Runs Your Ads', desc: 'AI influencer content, Facebook & TikTok campaigns, email flows, and upsells — all on autopilot.' },
  { icon: CreditCard, title: 'You Collect Profits', desc: 'Orders get fulfilled automatically. Track performance, optimize, and scale what works.' },
];

const features = [
  { icon: ShoppingBag, title: 'Product Sourcing', desc: 'CJ Dropshipping integration. Find, import, and source products with AI-scored profit potential.' },
  { icon: Box, title: '3D Product Models', desc: 'TripoSR converts product photos into interactive 3D models for your store. Rotatable, zoomable.' },
  { icon: Users, title: 'AI Influencer', desc: 'ComfyUI generates AI girl influencers promoting your products. UGC-style content at scale.' },
  { icon: Video, title: 'Video Ads', desc: 'Higgsfield & Creatify produce scroll-stopping video ads with 50+ cinematic effects.' },
  { icon: Layers, title: 'Store Builder', desc: 'PagePilot-style page generator. Urgency bars, social proof, 3D viewer, and conversion-optimized CTAs.' },
  { icon: Mail, title: 'Email Marketing', desc: 'Mailchimp automation: welcome series, abandoned cart, post-purchase upsells — prebuilt templates.' },
  { icon: Bot, title: 'Campaign AI Agent', desc: 'Manus AI analyzes campaigns, optimizes bids, researches audiences, and generates reports autonomously.' },
  { icon: Sparkles, title: 'AI Copywriting', desc: 'DeepSeek writes product descriptions, ad copy, and SEO content. Persuasive, converting, multilingual.' },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 49,
    period: '/mo',
    desc: 'Perfect for testing your first products',
    features: [
      '5 product launches / month',
      'AI product descriptions',
      'AI product photos',
      'Basic store page builder',
      'Email templates',
      'Support chatbot',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Growth',
    price: 149,
    period: '/mo',
    desc: 'For serious dropshippers scaling fast',
    features: [
      '20 product launches / month',
      'Everything in Starter +',
      '3D product models',
      'AI influencer content',
      'Video ad generation',
      'Campaign AI agent',
      'Upsell configs',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 349,
    period: '/mo',
    desc: 'Unlimited stores, unlimited scale',
    features: [
      'Unlimited launches',
      'Everything in Growth +',
      'Full autopilot pipeline',
      'White-label reports',
      'API access',
      'Dedicated account manager',
      'Custom templates',
      'Volume discounts',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const faqs = [
  {
    q: 'What do I need to get started?',
    a: 'You need a Shopify store ($39/mo, your expense), a custom domain (~$12/yr), and a Stripe account for payments. ConversionCraft handles all the AI automation — product sourcing, content creation, ads, email, and fulfillment.',
  },
  {
    q: 'Do I need to pay for Shopify separately?',
    a: 'Yes. Shopify is your storefront and you pay Shopify directly ($39/mo for Basic). ConversionCraft creates the content and automates the marketing, but the store itself lives on your Shopify account.',
  },
  {
    q: 'How much should I budget for ads?',
    a: 'We recommend starting with $20-50/day on Facebook or TikTok ads. You pay the ad platforms directly. Our AI optimizes your campaigns to get the best ROAS.',
  },
  {
    q: 'How does the AI influencer work?',
    a: 'We use ComfyUI with custom AI models to generate realistic influencer photos and UGC-style videos of an AI girl promoting your products. The content looks like real user-generated content.',
  },
  {
    q: 'Can I really launch a store in 17 minutes?',
    a: 'Yes. Our autopilot pipeline runs 13 AI steps: find product → write copy → generate photos → create 3D model → build page → create animations → generate influencer content → make video ads → plan campaigns → set up emails → configure upsells → write ad copy. All automated.',
  },
  {
    q: 'What if I don\'t have any API keys?',
    a: 'ConversionCraft works out of the box. All AI services run through our infrastructure. You don\'t need any API keys — we handle the AI services for you.',
  },
];

const testimonials = [
  { name: 'Sarah M.', role: 'Dropshipper', text: 'Launched 3 stores in a single afternoon. The AI influencer content alone is worth the subscription.', stars: 5 },
  { name: 'Marcus T.', role: 'E-commerce Founder', text: 'The autopilot pipeline is insane. I just pick a niche and everything else is handled.', stars: 5 },
  { name: 'Aisha K.', role: 'Shopify Seller', text: 'Cut my product launch time from 2 days to 17 minutes. The 3D models are a game changer for conversions.', stars: 5 },
];

/* ─── FAQ Accordion ────────────────────────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item" onClick={() => setOpen(!open)}>
      <div className="faq-q">
        <span>{q}</span>
        <ChevronDown className={`faq-chevron ${open ? 'faq-open' : ''}`} />
      </div>
      {open && <p className="faq-a">{a}</p>}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function Home() {
  return (
    <main className="site-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="topbar">
        <Link href="/" className="brand-wrap">
          <span className="brand-mark"><Sparkles className="h-4 w-4" /></span>
          <span className="brand-name">ConversionCraft</span>
        </Link>
        <div className="top-links">
          <a href="#how" className="top-link">How It Works</a>
          <a href="#features" className="top-link">Features</a>
          <a href="#pricing" className="top-link">Pricing</a>
          <a href="#faq" className="top-link">FAQ</a>
        </div>
        <Link href="/onboarding" className="btn-solid">
          Start Free Trial <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="hero-block">
        <div>
          <motion.p className="chip"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Zap className="h-4 w-4" /> AI-Powered Dropshipping Automation
          </motion.p>

          <motion.h1 className="hero-title"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            Launch a <span>profitable store</span> in 17 minutes.
          </motion.h1>

          <motion.p className="hero-subtitle"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            ConversionCraft finds winning products, builds your store, creates AI influencer content, runs your ads, and fulfills orders — all on autopilot.
          </motion.p>

          <motion.div className="hero-actions"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
          >
            <Link href="/onboarding" className="btn-solid btn-lg">
              Start Free Trial <Rocket className="h-4 w-4" />
            </Link>
            <a href="#how" className="btn-ghost">See How It Works</a>
          </motion.div>

          <div className="stat-grid">
            {heroStats.map((stat) => (
              <motion.article key={stat.label} className="stat-tile"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3 }}
              >
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.aside className="hero-panel"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="panel-kicker">Autopilot Pipeline</div>
          <h2>13 AI steps, one click</h2>
          <div className="pipeline-list">
            {[
              'Find winning product',
              'Generate copy & photos',
              'Create 3D model & animations',
              'Build high-converting page',
              'Generate AI influencer UGC',
              'Create video ads',
              'Launch Meta & TikTok campaigns',
              'Set up email flows & upsells',
            ].map((item, idx) => (
              <motion.div key={item} className="pipeline-row"
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + idx * 0.07 }}
              >
                <span className="pipeline-dot" />
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.aside>
      </section>

      {/* ── Marquee ─────────────────────────────────────────── */}
      <section className="ticker-wrap" aria-label="highlights">
        <div className="ticker-track">
          {[
            '3D Product Models', 'AI Girl Influencer', 'Video Ad Generator', 'Email Automation',
            'One-Click Autopilot', 'Campaign AI Agent', 'Upsell Optimizer', 'High-Converting Pages',
            '3D Product Models', 'AI Girl Influencer', 'Video Ad Generator', 'Email Automation',
            'One-Click Autopilot', 'Campaign AI Agent', 'Upsell Optimizer', 'High-Converting Pages',
          ].map((word, idx) => (
            <span key={`${word}-${idx}`} className="ticker-item">{word}</span>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section id="how" className="section-block">
        <div className="section-head center">
          <p className="section-kicker">How It Works</p>
          <h2>From niche idea to revenue in 4 simple steps</h2>
        </div>
        <div className="steps-grid">
          {steps.map((step, idx) => (
            <motion.article key={step.title} className="step-card"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
            >
              <div className="step-number">{idx + 1}</div>
              <div className="step-icon"><step.icon className="h-5 w-5" /></div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="section-block">
        <div className="section-head center">
          <p className="section-kicker">Features</p>
          <h2>Everything you need to run a dropshipping empire</h2>
        </div>
        <div className="features-grid">
          {features.map((feat, idx) => (
            <motion.article key={feat.title} className="feature-card"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
            >
              <div className="feature-icon"><feat.icon className="h-5 w-5" /></div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────── */}
      <section className="section-block">
        <div className="section-head center">
          <p className="section-kicker">What Users Say</p>
          <h2>Trusted by dropshippers worldwide</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <motion.article key={t.name} className="testimonial-card"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.45, delay: idx * 0.08 }}
            >
              <div className="stars">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 star-filled" />
                ))}
              </div>
              <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.name[0]}</div>
                <div>
                  <p className="author-name">{t.name}</p>
                  <p className="author-role">{t.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <section id="pricing" className="section-block">
        <div className="section-head center">
          <p className="section-kicker">Pricing</p>
          <h2>Simple pricing, no hidden fees</h2>
          <p className="pricing-note">You pay separately for: Shopify ($39/mo) · Domain (~$12/yr) · Ad spend (your budget)</p>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan, idx) => (
            <motion.article key={plan.name}
              className={`pricing-card ${plan.popular ? 'pricing-popular' : ''}`}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.45, delay: idx * 0.1 }}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="pricing-amount">
                <span className="price">${plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              <p className="pricing-desc">{plan.desc}</p>
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}><Check className="h-4 w-4 check-icon" /> {f}</li>
                ))}
              </ul>
              <Link href="/onboarding" className={plan.popular ? 'btn-solid btn-full' : 'btn-ghost btn-full'}>
                {plan.cta}
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── What You Need ──────────────────────────────────── */}
      <section className="section-block">
        <div className="section-head center">
          <p className="section-kicker">What You Need</p>
          <h2>Your responsibilities vs. what we automate</h2>
        </div>
        <div className="responsibility-grid">
          <div className="resp-card resp-you">
            <h3>You Handle</h3>
            <ul>
              <li><Globe className="h-4 w-4" /> Shopify store — $39/mo (Basic plan)</li>
              <li><Globe className="h-4 w-4" /> Custom domain — ~$12/year</li>
              <li><CreditCard className="h-4 w-4" /> Stripe for payments — free to set up (2.9% per sale)</li>
              <li><TrendingUp className="h-4 w-4" /> Ad spend — your budget ($20-50/day recommended)</li>
            </ul>
          </div>
          <div className="resp-card resp-us">
            <h3>We Automate</h3>
            <ul>
              <li><Check className="h-4 w-4" /> Product sourcing & supplier management</li>
              <li><Check className="h-4 w-4" /> AI copywriting & product descriptions</li>
              <li><Check className="h-4 w-4" /> Product photos, 3D models & animations</li>
              <li><Check className="h-4 w-4" /> AI influencer content & video ads</li>
              <li><Check className="h-4 w-4" /> Store page builder & email flows</li>
              <li><Check className="h-4 w-4" /> Campaign management & optimization</li>
              <li><Check className="h-4 w-4" /> Order fulfillment & tracking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="section-block">
        <div className="section-head center">
          <p className="section-kicker">FAQ</p>
          <h2>Common questions</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="cta-block">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="cta-card"
        >
          <p className="section-kicker">Ready to start?</p>
          <h2>Launch your first store today. 7-day free trial, no credit card required.</h2>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link href="/onboarding" className="btn-solid btn-lg">
              Start Free Trial <Rocket className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="footer-section">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="brand-name">ConversionCraft</span>
            <p>AI-powered dropshipping automation platform. Find products, build stores, create content, and run ads — all on autopilot.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#how">How It Works</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link href="/onboarding">Get Started</Link>
            <Link href="/os">Growth OS</Link>
            <Link href="/studio">Studio</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Refund Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 ConversionCraft. All rights reserved.</span>
        </div>
      </footer>

      {/* ── Chatbot ─────────────────────────────────────────── */}
      <ChatBot />
    </main>
  );
}
