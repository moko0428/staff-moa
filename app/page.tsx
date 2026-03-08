'use client';

import { useLandingData } from './(features)/(landing)/landing/hooks/useLandingData';
import { useMotionPreference } from './(features)/(landing)/landing/hooks/useMotionPreference';
import FloatingBackground from './(features)/(landing)/landing/components/organisms/FloatingBackground';
import HeroSection from './(features)/(landing)/landing/components/organisms/HeroSection';
import HowItWorksSection from './(features)/(landing)/landing/components/organisms/HowItWorksSection';
import FeaturesSection from './(features)/(landing)/landing/components/organisms/FeaturesSection';
import ReviewsSection from './(features)/(landing)/landing/components/organisms/ReviewsSection';
import CtaSection from './(features)/(landing)/landing/components/organisms/CtaSection';
import LandingPopupModal from './(features)/(landing)/landing/components/LandingPopup';
import { HeroStats } from './(features)/(landing)/landing/components/molecules/HeroStats';

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
