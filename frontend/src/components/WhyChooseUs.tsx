import {motion} from "motion/react"




const WhyChooseUs = () => {
  return (
    <motion.div 
     initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, ease: "easeOut" }} 
    
    
    
    className="flex justify-center mt-10 px-4">
        <div className="flex flex-col items-center w-full" style={{fontFamily: "Funnel Display"}}>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">Why Choose Us?</h1>
            <p className="mb-7 mt-6 text-center text-sm md:text-lg max-w-4xl px-4">
              We make car rentals effortless for renters and profitable for owners all in one seamless platform
            </p>
            <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay:0.3, ease: "easeOut" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl w-full px-4 gap-4 md:gap-6">
                <div className="bg-blue-950 text-white rounded-xl p-8 md:p-10 min-h-[120px] md:min-h-[350px] flex flex-col">
                    <div className="bg-orange-400 h-6 w-6 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-6">
                        <span className="text-sm md:text-xl font-bold">1</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Transparent & Competitive Pricing</h3>
                    <p className="text-sm text-gray-300">
                      With Fleetly, renters enjoy the best prices on quality vehicles, 
                      while owners set competitive rates that reflect true market value. No hidden fees, no last-minute surprises, just clear, upfront costs.
                    </p>
                </div>
                <div className="bg-blue-950 text-white rounded-xl p-8 md:p-10 min-h-[120px] md:min-h-[350px] flex flex-col">
                    <div className="bg-orange-400 h-6 w-6 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-6">
                        <span className="text-sm md:text-xl font-bold">2</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Seamless Dual Experience</h3>
                    <p className="text-sm text-gray-300 ">
                      Fleetly is built for both sides of the rental ecosystem. Renters get a mobile app that makes finding, reserving, and paying for cars quick and effortless.
                      Owners get a powerful web dashboard to manage fleets, track bookings, and monitor earnings in real time.
                    </p>
                </div>
                <div className="bg-blue-950 text-white rounded-xl p-8 md:p-10 min-h-[120px] md:min-h-[350px] flex flex-col">
                    <div className="bg-orange-400 h-6 w-6 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-6">
                        <span className="text-sm md:text-xl font-bold">3</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Secure & Reliable Platform</h3>
                    <p className="text-sm text-gray-300">
                      Trust and safety are at the heart of Fleetly. Every transaction is protected with secure payment gateways, while user verification helps prevent fraud and misuse.
                      Owners can confidently list vehicles knowing their earnings are protected, and renters can book with peace of mind.
                    </p>
                </div>
            </motion.div>
        </div>
    </motion.div>
  )
}

export default WhyChooseUs