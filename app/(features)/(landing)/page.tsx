'use client';

import { useLandingData } from './landing/hooks/useLandingData';
import { useMotionPreference } from './landing/hooks/useMotionPreference';
import FloatingBackground from './landing/components/organisms/FloatingBackground';
import HeroSection from './landing/components/organisms/HeroSection';
import HowItWorksSection from './landing/components/organisms/HowItWorksSection';
import FeaturesSection from './landing/components/organisms/FeaturesSection';
import ReviewsSection from './landing/components/organisms/ReviewsSection';
import CtaSection from './landing/components/organisms/CtaSection';
import LandingPopupModal from './landing/components/LandingPopup';
import { HeroStats } from './landing/components/molecules/HeroStats';

const LandingPage = () => {
  const { stats, topReviews, activePopup, isLoading } = useLandingData();
  const { shouldReduceMotion } = useMotionPreference();

  return (
    <>
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
    </>
  );
};

export default LandingPage;
