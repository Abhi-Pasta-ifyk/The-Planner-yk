import React, { useState } from 'react';
import { Gift } from 'lucide-react';

const CheerUp = () => {
  const [isDancing, setIsDancing] = useState(false);

  const triggerDance = () => {
    if (isDancing) return;
    setIsDancing(true);
    
    // The animation takes 4 seconds, so we remove the chibi after 4.5 seconds
    setTimeout(() => {
      setIsDancing(false);
    }, 4500);
  };

  return (
    <>
      {/* Secret CSS for the bouncing across the screen animation */}
      <style>
        {`
          @keyframes run-across-screen {
            0% { transform: translateX(-20vw) translateY(0) scale(1) rotate(-10deg); }
            15% { transform: translateX(10vw) translateY(-120px) scale(1.1) rotate(15deg); }
            30% { transform: translateX(30vw) translateY(0) scale(1) rotate(-10deg); }
            45% { transform: translateX(50vw) translateY(-120px) scale(1.1) rotate(15deg); }
            60% { transform: translateX(70vw) translateY(0) scale(1) rotate(-10deg); }
            75% { transform: translateX(90vw) translateY(-120px) scale(1.1) rotate(15deg); }
            100% { transform: translateX(120vw) translateY(0) scale(1) rotate(-10deg); }
          }
          .chibi-animate {
            animation: run-across-screen 4s linear forwards;
          }
        `}
      </style>

      {/* The Floating Secret Button */}
      <button
        onClick={triggerDance}
        className="fixed bottom-8 right-8 z-50 p-4 bg-white text-pink-500 rounded-full shadow-xl border border-pink-100 hover:bg-pink-50 hover:scale-110 transition-all duration-300 group"
        title="Emergency Cheer Up"
      >
        <Gift size={28} className="group-hover:animate-bounce drop-shadow-sm" />
      </button>

      {/* The Full Screen Animation Overlay */}
      {isDancing && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex items-end pb-[30vh]">
          <div className="chibi-animate absolute left-0 flex items-center justify-center">
            
            {/* 
              WANT TO USE A REAL GIF INSTEAD?
              1. Find a transparent dancing chibi GIF.
              2. Save it in your 'public' folder as 'chibi.gif'.
              3. Delete the massive <div> below and uncomment the <img> line beneath this!
            */}
            {/* <img src="/chibi.gif" alt="dancing chibi" className="w-64 h-64 object-contain drop-shadow-2xl" /> */}

            {/* Default Text-based Chibi */}
            <div className="relative text-8xl md:text-9xl font-black drop-shadow-2xl select-none">
              <span className="inline-block animate-pulse text-pink-500 tracking-tighter">ᕕ( ᐛ )ᕗ</span>
              <div className="absolute -top-10 -right-10 text-5xl animate-bounce">✨</div>
              <div className="absolute -bottom-4 -left-10 text-6xl animate-spin">💖</div>
              <div className="absolute top-1/2 -right-24 text-4xl animate-ping">🎶</div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default CheerUp;