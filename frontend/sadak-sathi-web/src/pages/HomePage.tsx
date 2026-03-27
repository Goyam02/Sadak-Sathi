import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPinIcon } from '../utils/icons';
import DashboardLayout from '../components/DashboardLayout';

export default function HomePage() {
  const navigate = useNavigate();
  const [damageAmount, setDamageAmount] = useState(234891);

  useEffect(() => {
    const interval = setInterval(() => {
      setDamageAmount(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 180000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col"
      >
        {/* Greeting */}
        <div className="px-6 pb-4">
          <h1 className="text-[28px] font-bold text-black leading-[1.15] tracking-tight -ml-2">
            Safer Roads,<br/>Smarter Journeys
          </h1>
        </div>

        {/* Morning Brief */}
        <div className="px-6 pb-4">
          <div className="w-full bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 min-h-[180px] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-black text-lg">Morning Brief</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Pothole risk score in nearby areas</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 h-full">
              <button onClick={() => navigate('/map')} className="bg-[#cfec46] rounded-2xl p-2 flex flex-col items-center justify-center hover:bg-[#c4e03f] transition-colors">
                <span className="font-black text-lg text-black">87%</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPinIcon className="w-3 h-3 text-black/70" />
                  <span className="text-[10px] font-bold text-black/70 text-center leading-tight">Lajpat Nagar</span>
                </div>
              </button>
              <button onClick={() => navigate('/map')} className="bg-[#cfec46] rounded-2xl p-2 flex flex-col items-center justify-center hover:bg-[#c4e03f] transition-colors">
                <span className="font-black text-lg text-black">74%</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPinIcon className="w-3 h-3 text-black/70" />
                  <span className="text-[10px] font-bold text-black/70 text-center leading-tight">Rohini</span>
                </div>
              </button>
              <button onClick={() => navigate('/map')} className="bg-[#cfec46] rounded-2xl p-2 flex flex-col items-center justify-center hover:bg-[#c4e03f] transition-colors">
                <span className="font-black text-lg text-black">61%</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPinIcon className="w-3 h-3 text-black/70" />
                  <span className="text-[10px] font-bold text-black/70 text-center leading-tight">Dwarka</span>
                </div>
              </button>
              <button onClick={() => navigate('/map')} className="bg-[#cfec46] rounded-2xl p-2 flex flex-col items-center justify-center hover:bg-[#c4e03f] transition-colors">
                <span className="font-black text-lg text-black">45%</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPinIcon className="w-3 h-3 text-black/70" />
                  <span className="text-[10px] font-bold text-black/70 text-center leading-tight">Vasant Kunj</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* City Damage Today */}
        <div className="px-6 pb-6">
          <div className="w-full bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 relative overflow-hidden">
            <h3 className="font-bold text-black text-[15px] mb-2">City Damage Today</h3>
            <div className="flex items-end mt-2">
              <span className="font-bold text-4xl text-red-500 tracking-tight">
                ₹{damageAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 pb-6">
          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col justify-center items-center text-center">
              <span className="font-black text-4xl text-red-500">847</span>
              <span className="text-xs font-bold text-gray-500 mt-2">Potholes Detected</span>
            </div>
            <div className="flex-1 bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col justify-center items-center text-center">
              <span className="font-black text-4xl text-[#cfec46]">123</span>
              <span className="text-xs font-bold text-gray-500 mt-2">Fixed This Week</span>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="px-6 pb-6">
          <div className="w-full bg-[#cfec46]/20 rounded-[2rem] p-6 border border-[#cfec46]/50 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-black text-lg">Leaderboard</h3>
              <p className="text-sm text-gray-600 font-medium mb-4">Top Reporters This Week</p>
              
              <div className="flex flex-col gap-3">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 flex items-center border-l-4 border-[#cfec46]">
                  <span className="font-bold text-sm text-black flex-grow pl-2">Rahul Khanna</span>
                  <span className="text-xs font-bold text-gray-500">47 reported</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 flex items-center border-l-4 border-[#cfec46]">
                  <span className="font-bold text-sm text-black flex-grow pl-2">Priya Mehta</span>
                  <span className="text-xs font-bold text-gray-500">38 reported</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 flex items-center border-l-4 border-[#cfec46]">
                  <span className="font-bold text-sm text-black flex-grow pl-2">Amit Sharma</span>
                  <span className="text-xs font-bold text-gray-500">31 reported</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#cfec46]/30 rounded-tl-full z-0"></div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
