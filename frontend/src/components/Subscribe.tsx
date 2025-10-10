import { useState } from "react"
import { Button } from "./ui/button"
import { motion } from "motion/react"

const Subscribe = () => {
  return (
    <motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, ease: "easeOut" }} >
        <div className="flex flex-col items-center" style={{fontFamily: "Funnel Display"}}>
            <h1 className="text-2xl  lg:text-4xl font-bold mb-7">Newsletter</h1>
            <p className="text-center text-sm md:text-lg px-4">Subscribe to receive the latest car releases, pricing updates, and feature announcements from Fleetly.</p>

            <motion.div 
             initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay:0.3, ease: "easeOut" }} 
            
            className="bg-gray-200 md:py-3 mt-7 rounded-2xl">
                <div className="max-w-md mx-auto px-4">
                    <form action="" className="py-2">
                        <input type="email" className="flex-1 md:px-4 md:py-3 rounded-sm md:rounded-lg" placeholder="Enter your Email"/>
                        <Button className="bg-blue-950 ml-4 md:px-6 md:py-6 cursor-pointer hover:bg-blue-950 md:text-lg">Subscribe</Button>
                    </form>
                </div>
            </motion.div>
        </div>
    </motion.div>
  )
}

export default Subscribe