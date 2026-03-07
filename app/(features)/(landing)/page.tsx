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
      <div className="h-[60vh]">
        <HeroSection shouldReduceMotion={shouldReduceMotion} />
      </div>
      <div className="h-[50vh]">
        <HeroStats stats={stats} isLoading={isLoading} />
      </div>
      <div className="h-[100vh]">
        <FeaturesSection />
      </div>
      <div className="lg:h-[80dvh] h-[120dvh]">
        <HowItWorksSection />
      </div>
      <div className="h-[50vh]">
        <ReviewsSection reviews={topReviews} isLoading={isLoading} />
      </div>
      <div className="h-[45vh]">
        <CtaSection />
      </div>
    </>
  );
};

export default LandingPage;
