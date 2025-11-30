"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BreathingExerciseProps {
  onComplete: () => void;
}

export function BreathingExercise({ onComplete }: BreathingExerciseProps) {
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-dark backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md mx-4 p-8 glass-elevated rounded-2xl text-center"
      >
        <h2 className="font-display font-bold text-2xl mb-4 gradient-text">
          Respire Comigo
        </h2>
        <p className="text-text-secondary mb-8">
          Antes de conversarmos, vamos acalmar a mente por 10 segundos
        </p>

        {/* Breathing Circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-hero"
            animate={{
              scale: count > 5 ? 1.3 : 1,
            }}
            transition={{
              duration: 1,
              ease: "easeInOut",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-text-primary">
              <motion.p
                className="text-lg font-semibold mb-2"
              >
                {count > 5 ? "Inspire profundamente" : "Solte o ar devagar"}
              </motion.p>
              <motion.p
                key={count}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-6xl font-black font-accent"
              >
                {count}
              </motion.p>
            </div>
          </div>
        </div>

        <p className="text-sm text-text-tertiary">
          Relaxe e respire...
        </p>
      </motion.div>
    </div>
  );
}
