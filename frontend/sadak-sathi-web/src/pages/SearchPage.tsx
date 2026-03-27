import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { SearchIcon, MapIcon } from '../utils/icons';
import DashboardLayout from '../components/DashboardLayout';

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchTabQuery, setSearchTabQuery] = useState('');
  const [showCopyPopup, setShowCopyPopup] = useState(false);

  const locations = [
    { id: 1, location: "Mehrauli-Badarpur Road, Saket", contractor: "L&T Construction", complaints: 156, detections: 240 },
    { id: 2, location: "Outer Ring Road, Rohini", contractor: "Dilip Buildcon", complaints: 142, detections: 198 },
    { id: 3, location: "MG Road, Gurgaon", contractor: "Afcons Infrastructure", complaints: 128, detections: 165 },
    { id: 4, location: "NH-44, Panipat Highway", contractor: "NHAI / IRB Infra", complaints: 115, detections: 180 },
    { id: 5, location: "Ring Road, Lajpat Nagar", contractor: "Tata Projects", complaints: 98, detections: 145 },
    { id: 6, location: "Golf Course Road, Gurgaon", contractor: "DLF Construction", complaints: 87, detections: 110 },
    { id: 7, location: "Vikas Marg, Laxmi Nagar", contractor: "PWD Delhi", complaints: 76, detections: 95 },
    { id: 8, location: "DND Flyway, Noida", contractor: "Noida Toll Bridge Co.", complaints: 65, detections: 82 },
    { id: 9, location: "Dwarka Expressway, Sector 21", contractor: "L&T Construction", complaints: 54, detections: 70 },
    { id: 10, location: "Mathura Road, Faridabad", contractor: "GMR Group", complaints: 48, detections: 62 },
    { id: 11, location: "Aurobindo Marg, Hauz Khas", contractor: "HCC Ltd.", complaints: 42, detections: 55 },
    { id: 12, location: "Palam Vihar Main Road", contractor: "Ansal API", complaints: 35, detections: 48 },
    { id: 13, location: "Janpath, Connaught Place", contractor: "NDMC", complaints: 28, detections: 35 },
    { id: 14, location: "Siri Fort Road", contractor: "Shapoorji Pallonji", complaints: 22, detections: 30 },
    { id: 15, location: "Lodhi Road, Central Delhi", contractor: "CPWD", complaints: 15, detections: 20 },
  ];

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col px-4 pt-2 pb-12"
      >
        <div className="w-full bg-white/80 backdrop-blur-md rounded-full h-[64px] flex items-center px-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-200 sticky top-0 z-10">
          <SearchIcon className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search location or contractor..." 
            value={searchTabQuery}
            onChange={(e) => setSearchTabQuery(e.target.value)}
            className="flex-grow bg-transparent border-none focus:outline-none px-4 text-base text-gray-600 placeholder-gray-400 font-medium" 
          />
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {locations
            .filter(item => 
              item.location.toLowerCase().includes(searchTabQuery.toLowerCase()) || 
              item.contractor.toLowerCase().includes(searchTabQuery.toLowerCase())
            )
            .sort((a, b) => b.complaints - a.complaints)
            .map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate('/map')}
                className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <MapIcon className="w-4 h-4 text-[#cfec46]" />
                      <span className="text-sm font-bold text-black">{item.location}</span>
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Contractor: <span className="text-gray-600">{item.contractor}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCopyPopup(true);
                      setTimeout(() => setShowCopyPopup(false), 2000);
                    }}
                    className="p-2 bg-gray-50 rounded-full hover:bg-[#cfec46]/20 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex gap-4 pt-2 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Detections</span>
                    <span className="text-lg font-black text-red-500">{item.complaints}</span>
                  </div>
                  <div className="flex-grow" />
                </div>
              </motion.div>
            ))}
        </div>

        {/* Copy Popup */}
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
      </motion.div>
    </DashboardLayout>
  );
}
