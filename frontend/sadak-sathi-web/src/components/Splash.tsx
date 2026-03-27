import { motion } from 'motion/react';

export default function Splash() {
  return (
    <motion.div
      key="splash"
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {/* Animated Organic Blob */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 100 }}
        transition={{
          duration: 1.8,
          ease: "easeInOut",
          delay: 1.5,
        }}
        className="relative z-10 w-48 h-48"
        style={{
          backgroundColor: '#cfec46',
          borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%',
        }}
      />

      {/* Logo that appears after the screen turns green */}
      <motion.img
        src="/Logo.png"
        alt="Logo"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 3.3,
          duration: 0.6,
          ease: "easeOut",
        }}
        className="absolute z-20 w-64 h-auto drop-shadow-lg"
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
}
