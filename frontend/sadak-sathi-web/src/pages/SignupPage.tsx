import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    gender: ''
  });

  const getLocation = () => {
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: "GET_LOCATION" })
      );
    }
  };

  const handleSignupSubmit = () => {
    setShowLocationPopup(true);
  };

  const handleLocationAllow = () => {
    getLocation();
    setShowLocationPopup(false);
    navigate('/home');
  };

  const handleLocationDeny = () => {
    setShowLocationPopup(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden relative">
      <motion.div
        key="signup-screen"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute inset-0 bg-[#cfec46] z-40 flex flex-col"
      >
        {/* Top Section (Header Area) */}
        <div className="w-full px-8 pt-28 pb-6 flex flex-col items-center justify-center">
          {/* Logo Placeholder */}
          <div className="w-64 mb-2">
            <img src="/Logo.png" alt="Logo" className="w-full h-auto object-contain drop-shadow-md" />
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-t-[2.5rem] flex-grow px-8 pt-12 pb-6 flex flex-col z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-bold text-black mb-6">Sign Up</h2>
          
          <div className="flex flex-col gap-4">
            {/* Name Input */}
            <div className="relative flex items-center">
              <div className="absolute left-5 text-gray-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <input 
                type="text" 
                placeholder="Name" 
                value={userData.name}
                onChange={(e) => setUserData({...userData, name: e.target.value})}
                className="w-full pl-12 pr-5 py-4 rounded-full bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-[#cfec46] transition-all text-sm text-black placeholder-gray-500 font-semibold"
              />
            </div>

            {/* Phone Input */}
            <div className="relative flex items-center">
              <div className="absolute left-5 text-gray-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <input 
                type="tel" 
                placeholder="Phone Number" 
                value={userData.phone}
                onChange={(e) => setUserData({...userData, phone: e.target.value})}
                className="w-full pl-12 pr-5 py-4 rounded-full bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-[#cfec46] transition-all text-sm text-black placeholder-gray-500 font-semibold"
              />
            </div>

            {/* Gender Input */}
            <div className="relative flex items-center">
              <div className="absolute left-5 text-gray-500 z-10 pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-7l-2-2"></path><path d="M12 15l2-2"></path><circle cx="12" cy="6" r="4"></circle></svg>
              </div>
              
              {/* Custom Select Trigger */}
              <div 
                onClick={() => setIsGenderOpen(!isGenderOpen)}
                className="w-full pl-12 pr-10 py-4 rounded-full bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-[#cfec46] transition-all text-sm font-semibold cursor-pointer flex items-center justify-between"
                tabIndex={0}
              >
                <span className={userData.gender ? "text-black" : "text-gray-500"}>
                  {userData.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : "Gender"}
                </span>
              </div>

              <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-500 transition-transform duration-300 ${isGenderOpen ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>

              {/* Invisible overlay to close dropdown when clicking outside */}
              {isGenderOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsGenderOpen(false)} />
              )}

              {/* Custom Dropdown Menu */}
              <AnimatePresence>
                {isGenderOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-2/3 bg-white border-2 border-[#cfec46] rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    {['male', 'female', 'other'].map((option) => (
                      <div 
                        key={option}
                        onClick={() => {
                          setUserData({...userData, gender: option});
                          setIsGenderOpen(false);
                        }}
                        className="px-5 py-3 hover:bg-[#cfec46]/20 cursor-pointer text-sm text-black font-semibold transition-colors"
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sign Up Button (Bottom) */}
          <div className="mt-10 pb-10">
            <button 
              onClick={handleSignupSubmit}
              className="w-full py-4 rounded-full bg-[#cfec46] text-black font-bold text-base shadow-md hover:scale-[1.02] transition-transform"
            >
              Sign Up
            </button>
          </div>
        </div>
      </motion.div>

      {/* Location Access Popup */}
      <AnimatePresence>
        {showLocationPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleLocationDeny} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-[101] bg-white rounded-[24px] w-full max-w-[280px] p-6 flex flex-col items-center text-center shadow-2xl overflow-hidden"
            >
              <div className="w-16 h-16 bg-[#cfec46]/20 rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Enable Location</h3>
              <p className="text-sm text-gray-500 mb-4 font-medium leading-relaxed">
                Sadak Saathi needs your location to provide accurate navigation and detect potholes on your route.
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={handleLocationDeny}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  Not now
                </button>
                <button 
                  onClick={handleLocationAllow}
                  className="flex-1 py-3 rounded-xl bg-[#cfec46] text-black font-bold text-sm hover:bg-[#c4e03f] transition-colors"
                >
                  Allow
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
