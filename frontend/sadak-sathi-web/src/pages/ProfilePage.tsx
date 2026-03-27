import { useState } from 'react';
import { motion } from 'motion/react';
import DashboardLayout from '../components/DashboardLayout';

export default function ProfilePage() {
  const [points] = useState(1250);

  const offers = [
    { title: "₹50 Amazon Gift Card", points: 500, icon: "🎁", color: "bg-orange-50" },
    { title: "₹100 Swiggy Voucher", points: 1000, icon: "🍔", color: "bg-red-50" },
    { title: "₹200 Zomato Pro", points: 1500, icon: "🍕", color: "bg-pink-50" },
    { title: "₹500 Fuel Coupon", points: 4000, icon: "⛽", color: "bg-blue-50" },
    { title: "₹1000 Insurance Discount", points: 8000, icon: "🛡️", color: "bg-green-50" },
    { title: "Saathi Premium Badge", points: 2000, icon: "⭐", color: "bg-purple-50" },
  ];

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col px-6 pt-4 pb-24"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-[#cfec46] overflow-hidden mb-4">
            <img src="/photo.png" alt="Profile" className="w-full h-full object-cover translate-y-0" />
          </div>
          <h2 className="text-2xl font-bold text-black">Rahul Khanna</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Points</span>
            <span className="text-3xl font-black text-[#cfec46]">{points.toLocaleString()}</span>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Potholes Detected</span>
            <span className="text-3xl font-black text-black">47</span>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-black text-lg">Redeem Points</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            {offers.map((offer, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-gray-200 hover:border-[#cfec46] transition-colors group">
                <div className={`w-12 h-12 rounded-xl ${offer.color} flex items-center justify-center text-xl shrink-0`}>
                  {offer.icon}
                </div>
                <div className="flex flex-col flex-grow">
                  <span className="text-sm font-bold text-black leading-tight">{offer.title}</span>
                  <span className="text-[11px] font-bold text-gray-400">{offer.points} Points</span>
                </div>
                <button 
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    points >= offer.points 
                      ? "bg-[#cfec46] text-black shadow-sm active:scale-95" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Redeem
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
