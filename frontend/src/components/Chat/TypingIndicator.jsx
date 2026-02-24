import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
    return (
        <div className="flex items-center gap-1.5 px-4 py-3 bg-transparent w-fit">
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-(--button-primary)"
                        animate={{ 
                            opacity: [0.3, 1, 0.3],
                            scale: [0.9, 1.1, 0.9]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default TypingIndicator;
