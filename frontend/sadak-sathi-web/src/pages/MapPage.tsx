import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchIcon, XIcon } from '../utils/icons';
import DashboardLayout from '../components/DashboardLayout';

const ShieldIconLocal = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ZapIconLocal = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

interface MapPageProps {
  onStopDriving?: (score: number) => void;
}

export default function MapPage({ onStopDriving }: MapPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<'direct' | 'safe' | null>('safe');
  const [isDriving, setIsDriving] = useState(false);
  const [showCameraPopup, setShowCameraPopup] = useState(false);

  const handleAllowCamera = useCallback(() => {
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: "START_CAMERA" })
      );
    }
    setShowCameraPopup(false);
    setIsDriving(true);
  }, []);

  const handleDenyCamera = useCallback(() => {
    setShowCameraPopup(false);
    setIsDriving(true);
  }, []);

  const handleStopClick = useCallback(() => {
    let score = 0;
    if (selectedRoute === 'safe') {
      score = 50;
    } else if (selectedRoute === 'direct') {
      score = 10;
    }
    setIsDriving(false);
    if (score > 0 && onStopDriving) {
      onStopDriving(score);
    }
  }, [selectedRoute, onStopDriving]);

  useEffect(() => {
    const handler = (event: any) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("📲 Message from native:", msg);

        if (msg.type === "CAMERA_STARTED") {
          console.log("📸 Camera started - location & sensors tracking");
        }
        if (msg.type === "CAMERA_STOPPED") {
          console.log("🛑 Camera stopped - all sensors stopped");
        }
        if (msg.type === "CAMERA_DONE") {
          console.log("📸 Camera finished");
        }
        if (msg.type === "LOCATION") {
          const { latitude, longitude, speed } = msg.data;
          const speedKmh = speed ? (speed * 3.6).toFixed(2) : "0";
          console.log(`📍 Location: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}] | Speed: ${speedKmh} km/h`);
        }
        if (msg.type === "ACCEL") {
          const { x, y, z } = msg.data;
          console.log(`⚡ Acceleration: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)} m/s²`);
          const harshBraking = x > 0.5;
          const harshAccel = y > 0.5;
          if (harshBraking || harshAccel) {
            console.warn("⚠️ Harsh driving detected!");
          }
        }
        if (msg.type === "PERMISSION_ERROR") {
          console.error("❌ Permission error:", msg.data);
        }
      } catch (e) {
        console.log("Invalid message:", e);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col w-full relative px-3 pt-2 pb-4"
      >
        {/* Search Bar */}
        <div className="w-full bg-white rounded-full h-[48px] flex items-center px-4 shadow-md border border-gray-200 mb-4 shrink-0">
          <SearchIcon className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Enter destination..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow bg-transparent border-none focus:outline-none px-3 text-sm text-gray-700 placeholder-gray-400 font-medium" 
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1">
              <XIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Map View Image */}
        <div className="w-full h-[280px] bg-gray-200 rounded-[24px] overflow-hidden shadow-sm shrink-0 relative">
          <img 
            src="https://picsum.photos/seed/mapview/600/400" 
            alt="Map View" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Route Cards */}
        <div className="mt-4 flex justify-between gap-[12px] shrink-0">
          {/* Direct Route Card */}
          <button 
            onClick={() => setSelectedRoute('direct')}
            className={`w-[48%] h-[100px] rounded-2xl p-[12px] flex flex-col justify-between transition-all border-2 ${
              selectedRoute === 'direct' ? 'border-[#cfec46] bg-[#cfec46]/10' : 'border-transparent bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <ZapIconLocal className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-[18px] font-bold text-black">23 mins</span>
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-gray-500">Direct Route</span>
              <div className="text-xs font-bold text-red-500 mt-0.5">Risk: 82%</div>
            </div>
          </button>

          {/* Safe Route Card */}
          <button 
            onClick={() => setSelectedRoute('safe')}
            className={`w-[48%] h-[100px] rounded-2xl p-[12px] flex flex-col justify-between transition-all border-2 ${
              selectedRoute === 'safe' ? 'border-[#cfec46] bg-[#cfec46]/10' : 'border-transparent bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldIconLocal className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-[18px] font-bold text-black">28 mins</span>
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-gray-500">Safe Route</span>
              <div className="text-xs font-bold text-green-500 mt-0.5">Risk: 12%</div>
            </div>
          </button>
        </div>

        {/* Start/Stop Button */}
        <div className="mt-6 shrink-0">
          {!isDriving ? (
            <button 
              onClick={() => setShowCameraPopup(true)}
              className="w-full py-4 rounded-full bg-[#cfec46] text-black font-bold text-base shadow-md hover:scale-[1.02] transition-transform"
            >
              Start
            </button>
          ) : (
            <button 
              onClick={handleStopClick}
              className="w-full py-4 rounded-full bg-red-500 text-white font-bold text-base shadow-md hover:scale-[1.02] transition-transform"
            >
              Stop
            </button>
          )}
        </div>

        {/* Extra Scroll Section */}
        <div className="mt-6 pb-4 flex flex-col gap-4">
          <div className="bg-white/50 rounded-2xl p-4 border border-gray-100">
            <h4 className="text-sm font-bold text-black mb-1">Safety Tip</h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Always keep your eyes on the road. Our AI will handle pothole detection in the background.
            </p>
          </div>
          <div className="bg-white/50 rounded-2xl p-4 border border-gray-100">
            <h4 className="text-sm font-bold text-black mb-1">Route Info</h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Safe routes are calculated based on real-time road condition data from other Saathis.
            </p>
          </div>
        </div>

        {/* Camera Permission Popup */}
        <AnimatePresence>
          {showCameraPopup && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center px-4">
              <div className="absolute -inset-[1000px] bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowCameraPopup(false)} />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative z-50 bg-white rounded-[24px] w-full max-w-[280px] overflow-hidden shadow-2xl p-6 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-[#cfec46]/20 rounded-full flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <circle cx="12" cy="13" r="3"></circle>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Camera Access</h3>
                <p className="text-sm text-gray-500 mb-4 font-medium">Allow Sadak Saathi to use your camera in the background to detect potholes while you drive?</p>

                <div className="flex w-full gap-3">
                  <button onClick={handleDenyCamera} className="flex-1 py-3 rounded-xl bg-gray-100 text-black font-bold text-sm hover:bg-gray-200 transition-colors">
                    No, thanks
                  </button>
                  <button onClick={handleAllowCamera} className="flex-1 py-3 rounded-xl bg-[#cfec46] text-black font-bold text-sm hover:bg-[#c4e03f] transition-colors">
                    Allow
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
