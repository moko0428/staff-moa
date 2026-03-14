'use client';

import dynamic from 'next/dynamic';
import { useLandingData } from './(landing)/landing/hooks/useLandingData';
import { useMotionPreference } from './(landing)/landing/hooks/useMotionPreference';
import FloatingBackground from './(landing)/landing/components/organisms/FloatingBackground';
import HeroSection from './(landing)/landing/components/organisms/HeroSection';
import { HeroStats } from './(landing)/landing/components/molecules/HeroStats';
import Footer from './components/Footer';

const FeaturesSection = dynamic(
  () => import('./(landing)/landing/components/organisms/FeaturesSection'),
);
const HowItWorksSection = dynamic(
  () => import('./(landing)/landing/components/organisms/HowItWorksSection'),
);
const ReviewsSection = dynamic(
  () => import('./(landing)/landing/components/organisms/ReviewsSection'),
);
const CtaSection = dynamic(
  () => import('./(landing)/landing/components/organisms/CtaSection'),
);
const LandingPopupModal = dynamic(
  () => import('./(landing)/landing/components/LandingPopup'),
);

const LandingPage = () => {
  const { stats, topReviews, activePopup, isLoading } = useLandingData();
  const { shouldReduceMotion } = useMotionPreference();

  return (
    <div className="bg-gradient-to-b from-primary/60 to-background">
      {activePopup && <LandingPopupModal popup={activePopup} />}
      {!shouldReduceMotion && <FloatingBackground />}
      <HeroSection shouldReduceMotion={shouldReduceMotion} />
      <section className="bg-background border-t border-border">
        <HeroStats stats={stats} isLoading={isLoading} />
      </section>
      <FeaturesSection />
      <HowItWorksSection />
      <ReviewsSection reviews={topReviews} isLoading={isLoading} />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
