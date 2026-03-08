'use client';

import { useLandingData } from './(landing)/landing/hooks/useLandingData';
import { useMotionPreference } from './(landing)/landing/hooks/useMotionPreference';
import FloatingBackground from './(landing)/landing/components/organisms/FloatingBackground';
import HeroSection from './(landing)/landing/components/organisms/HeroSection';
import HowItWorksSection from './(landing)/landing/components/organisms/HowItWorksSection';
import FeaturesSection from './(landing)/landing/components/organisms/FeaturesSection';
import ReviewsSection from './(landing)/landing/components/organisms/ReviewsSection';
import CtaSection from './(landing)/landing/components/organisms/CtaSection';
import LandingPopupModal from './(landing)/landing/components/LandingPopup';
import { HeroStats } from './(landing)/landing/components/molecules/HeroStats';

const LandingPage = () => {
  const { stats, topReviews, activePopup, isLoading } = useLandingData();
  const { shouldReduceMotion } = useMotionPreference();

  return (
    <div className="bg-gradient-to-b from-primary/60 to-background">
      {activePopup && <LandingPopupModal popup={activePopup} />}
      <FloatingBackground />
      <HeroSection shouldReduceMotion={shouldReduceMotion} />
      <section className="bg-background border-t border-border">
        <HeroStats stats={stats} isLoading={isLoading} />
      </section>
      <FeaturesSection />
      <HowItWorksSection />
      <ReviewsSection reviews={topReviews} isLoading={isLoading} />
      <CtaSection />
    </div>
  );
};

export default LandingPage;
