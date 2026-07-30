import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export function BannerCarousel(_a) {
    var banners = _a.banners;
    var _b = useState(0), currentIndex = _b[0], setCurrentIndex = _b[1];
    useEffect(function () {
        if (!banners || banners.length <= 1)
            return;
        var interval = setInterval(function () {
            setCurrentIndex(function (prev) { return (prev + 1) % banners.length; });
        }, 5000);
        return function () { return clearInterval(interval); };
    }, [banners]);
    if (!banners || banners.length === 0)
        return null;
    return (<div className="relative w-full aspect-[21/9] md:h-96 bg-gray-100 overflow-hidden shadow-sm group mt-16">
       <AnimatePresence mode='wait'>
         <motion.img key={currentIndex} src={banners[currentIndex]} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 w-full h-full object-cover" alt={"Banner ".concat(currentIndex + 1)}/>
       </AnimatePresence>
       
       {banners.length > 1 && (<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 p-2 bg-black/20 backdrop-blur-md rounded-full">
            {banners.map(function (_, idx) { return (<button key={idx} onClick={function () { return setCurrentIndex(idx); }} className={"h-1.5 rounded-full transition-all duration-300 ".concat(idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5')}/>); })}
         </div>)}
    </div>);
}
