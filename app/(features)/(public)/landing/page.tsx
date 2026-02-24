'use client';

import { useLandingData } from './hooks/useLandingData';
import FloatingBackground from './components/organisms/FloatingBackground';
import HeroSection from './components/organisms/HeroSection';
import HowItWorksSection from './components/organisms/HowItWorksSection';
import FeaturesSection from './components/organisms/FeaturesSection';
import ReviewsSection from './components/organisms/ReviewsSection';
import CtaSection from './components/organisms/CtaSection';
import LandingFooter from './components/organisms/LandingFooter';
import LandingPopupModal from './components/LandingPopup';

const LandingPage = () => {
  const { stats, topReviews, activePopup, isLoading } = useLandingData();

  return (
    <div className="flex flex-col bg-gradient-to-b from-primary/90 to-background overflow-hidden">
      {activePopup && <LandingPopupModal popup={activePopup} />}
      <FloatingBackground />
      <HeroSection stats={stats} isLoading={isLoading} />
      <HowItWorksSection />
      <FeaturesSection />
      <ReviewsSection reviews={topReviews} isLoading={isLoading} />
      <CtaSection />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
