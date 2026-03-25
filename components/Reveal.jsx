"use client"
import { motion } from "framer-motion"

export default function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.96 }}
      whileInView={{ y: 0, opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}
