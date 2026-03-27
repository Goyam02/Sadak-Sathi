import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { HomeIcon, MapIcon, SearchIcon, UserIcon, BellIcon, XIcon } from '../utils/icons';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfilePopping, setIsProfilePopping] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [points, setPoints] = useState(1250);
  const [flyingScore, setFlyingScore] = useState<number | null>(null);

  // Determine active tab from current route
  const tabMap: Record<string, 'home' | 'map' | 'search' | 'profile'> = {
    '/home': 'home',
    '/map': 'map',
    '/search': 'search',
    '/profile': 'profile',
  };
  const activeTab = tabMap[location.pathname] || 'home';

  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden relative">
      {/* Top Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-b from-[#cfec46]/60 to-[#cfec46]/5 rounded-b-[3rem] pointer-events-none z-0" />

      {/* Main Scrollable Area */}
      <div className="relative z-10 flex-grow overflow-y-auto scroll-smooth flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-28">
        {/* Top Navigation Bar */}
        <div className="w-full px-6 pt-8 pb-0 flex items-center justify-between">
          <div className="w-24 h-20 -ml-2">
            <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <button onClick={() => setIsNotificationsOpen(true)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm relative">
            <BellIcon className="w-5 h-5 text-black" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-[2px] border-white" />
          </button>
        </div>

        {/* Page Content */}
        {children}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#cfec46] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="h-20 flex items-center justify-around relative px-2 pb-[env(safe-area-inset-bottom)]">
          {[
            { id: 'home', label: 'Home', icon: HomeIcon },
            { id: 'map', label: 'Map', icon: MapIcon },
            { id: 'search', label: 'Search', icon: SearchIcon },
            { id: 'profile', label: 'Profile', icon: UserIcon },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className="relative flex flex-col items-center justify-center w-16 h-full cursor-pointer"
                onClick={() => handleTabChange(item.id)}
              >
                {/* Floating Active Circle */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      key={`circle-${item.id}`}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute -top-6 w-14 h-14 bg-[#cfec46] rounded-full flex items-center justify-center border-[6px] border-white shadow-lg"
                    >
                      <item.icon className="w-5 h-5 text-black" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Inactive Icon & Label */}
                <motion.div
                  animate={item.id === 'profile' && isProfilePopping ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col items-center transition-all duration-300 ${
                    isActive ? 'translate-y-4' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {!isActive && <item.icon className="w-6 h-6 text-black mb-1" />}
                  <span className="text-[11px] font-bold tracking-wide text-black">{item.label}</span>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showCopyPopup && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-28 left-1/2 z-[100] bg-[#cfec46] text-black px-6 py-3 rounded-full font-bold text-sm shadow-xl border border-black/10"
          >
            Link Copied!
          </motion.div>
        )}
        {isNotificationsOpen && (
          <>
            <div className="absolute inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-20 right-4 w-[280px] z-50 bg-white rounded-[16px] overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-base text-black">Notifications</h2>
                <button onClick={() => setIsNotificationsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <XIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <div className="bg-gray-50 rounded-lg p-2 border-l-4 border-[#E53935] flex gap-2">
                  <span className="text-lg">🕳️</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-black leading-tight">New pothole reported 200m from you</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Mehrauli-Badarpur Road · 10 mins ago</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 border-l-4 border-orange-500 flex gap-2">
                  <span className="text-lg">🌧️</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-black leading-tight">Weather Alert: Heavy rain expected</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">High risk roads in Rohini · Today 3PM</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Flying Score Animation */}
      <AnimatePresence>
        {flyingScore !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/40 backdrop-blur-md z-[998]"
            />
            <motion.div
              key="flying-score-animation"
              initial={{ opacity: 0, scale: 0.5, x: '-50%', y: '-50%', left: '50%', top: '35%' }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.5, 2.2, 1.8, 0.5],
                left: ['50%', '50%', '50%', '88%'],
                top: ['35%', '30%', '30%', '92%'],
              }}
              transition={{ duration: 3, times: [0, 0.15, 0.75, 1], ease: "easeInOut" }}
              className="absolute z-[999] font-bold text-7xl text-green-500 drop-shadow-2xl"
              style={{ pointerEvents: 'none', textShadow: '0px 4px 20px rgba(0,0,0,0.4)' }}
            >
              +{flyingScore}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
