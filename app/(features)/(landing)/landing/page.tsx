'use client';

import { useLandingData } from './hooks/useLandingData';
import { useMotionPreference } from './hooks/useMotionPreference';
import FloatingBackground from './components/organisms/FloatingBackground';
import HeroSection from './components/organisms/HeroSection';
import HowItWorksSection from './components/organisms/HowItWorksSection';
import FeaturesSection from './components/organisms/FeaturesSection';
import ReviewsSection from './components/organisms/ReviewsSection';
import CtaSection from './components/organisms/CtaSection';
import LandingPopupModal from './components/LandingPopup';

const LandingPage = () => {
  const { stats, topReviews, activePopup, isLoading } = useLandingData();
  const { shouldReduceMotion } = useMotionPreference();

  return (
    <>
      {activePopup && <LandingPopupModal popup={activePopup} />}
      <FloatingBackground />
      <div className="h-[calc(100dvh-4rem)]">
        <HeroSection stats={stats} isLoading={isLoading} shouldReduceMotion={shouldReduceMotion} />
      </div>
      <div className="h-[calc(100dvh-4rem)]">
        <HowItWorksSection />
      </div>
      <div className="h-[calc(100dvh-4rem)]">
        <FeaturesSection />
      </div>
      <div className="h-[calc(100dvh-4rem)]">
        <ReviewsSection reviews={topReviews} isLoading={isLoading} />
      </div>
      <div className="h-[calc(100dvh-4rem)]">
        <CtaSection />
      </div>
    </>
  );
};

export default LandingPage;
