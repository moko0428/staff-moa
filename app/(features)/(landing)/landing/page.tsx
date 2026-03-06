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
import { HeroStats } from './components/molecules/HeroStats';

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
