import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Splash from '../components/Splash';
import Onboarding from '../components/Onboarding';

export default function LandingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'splash' | 'blank' | 'onboarding'>('splash');

  useEffect(() => {
    // 3.3s (blob) + 0.6s (logo) + 1.1s (hold) = 5.0s
    const timer1 = setTimeout(() => {
      setPhase('blank');
    }, 5000);

    // 5.0s + 1.2s (fade out) + 0.0s (blank hold) = 6.2s
    const timer2 = setTimeout(() => {
      setPhase('onboarding');
    }, 6200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleOnboardingComplete = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden relative">
      <AnimatePresence mode="wait">
        {phase === 'splash' && (
          <Splash />
        )}
      </AnimatePresence>

      {phase === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}
