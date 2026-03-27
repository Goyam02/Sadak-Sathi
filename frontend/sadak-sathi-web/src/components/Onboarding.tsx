import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingScreens = [
    {
      image: "/welcome.png",
      title: "Welcome to Sadak Saathi",
    },
    {
      image: "/fix.png",
      title: "You drive, we detect potholes and help \n get them fixed.",
    },
    {
      image: "/background.png",
      title: "Just allow background access,we'll take care \nof the rest.",
    }
  ];

  const currentScreen = onboardingScreens[currentStep] || onboardingScreens[0];

  const handleNext = () => {
    if (currentStep === 2) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <motion.div
      key="onboarding-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="absolute inset-0 bg-white z-30 flex flex-col pt-12"
    >
      {/* Content Area with Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex flex-col w-full"
        >
          {/* Image Section (Top Area) */}
          <div className="w-full">
            <img
              src={currentScreen.image}
              alt="Onboarding"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Text Section */}
          <div className="px-6 mt-12">
            <h1 className="text-3xl font-bold text-left text-black leading-tight whitespace-pre-line">
              {currentScreen.title}
            </h1>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Spacer to push navigation to the bottom */}
      <div className="flex-grow" />

      {/* Navigation Section */}
      <div className="w-full px-6 pb-12 flex flex-col gap-8">
        {/* Pagination Dots */}
        <div className="flex justify-start gap-2">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep === index ? 'w-8 bg-[#cfec46]' : 'w-2 bg-gray-200'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Skip and Next Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onComplete}
            className="text-gray-400 font-semibold text-lg hover:text-black transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="w-14 h-14 rounded-full bg-[#cfec46] flex items-center justify-center shadow-md hover:scale-105 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
