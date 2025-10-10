import { motion } from "motion/react"


const Discover = () => {
  return (
    <motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, ease: "easeOut" }} >
        <div className="flex flex-col items-center mt-20" style={{fontFamily: "Funnel Display"}}>
            <h1 className="text-2xl  lg:text-4xl font-bold mb-7">Discover the right car. Anytime you need</h1>
            <p className="mb-7 text-center text-sm md:text-lg max-w-4xl px-4">Fleetly makes renting simple and flexible, search by location, compare options, and reserve your perfect ride in just a few taps.</p>

            <motion.img
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay:0.3, ease: "easeOut" }} src="/cars2.png" alt="" className="h-60  md:h-100 object-cover"/>
        </div>
    </motion.div>
  )
}

export default Discover