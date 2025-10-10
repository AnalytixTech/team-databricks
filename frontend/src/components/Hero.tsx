import { Button } from "./ui/button"
import { ArrowRight} from "lucide-react"
import { Link } from "react-router"
import {motion} from "motion/react"

const Hero = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay:0.2}}
    
    
    className="mt-20 md:mt-40 container mx-auto px-8">
      <div className="flex flex-col md:flex-row gap-8 md:gap-32 items-center md:items-start">
        {/* Text Content */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left md:mt-20" style={{fontFamily: "Funnel Display"}}>
          <motion.h1
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay:0.3}}
          
          className="text-3xl md:text-4xl lg:text-5xl font-bold">
            One <span className="text-orange-400">Platform. </span><br />
            Two <span className="text-blue-900">Experiences.</span>
          </motion.h1>
          <p className="mt-7 max-w-xl"> 
            Fleetly lets renters find reliable cars with quick reservations 
            and flexible payments, while giving owners a powerful dashboard 
            to manage fleets, track bookings, and grow revenue all in one seamless platform.
          </p>
          <Link to="/login">
            <Button className="mt-4 h-12 w-36 cursor-pointer">
              Get Started <ArrowRight className="color-white" />
            </Button>
          </Link>
        </div>

        {/* Car Image */}
        <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay:0.4}}
        
        
        className="w-full md:w-auto flex justify-center md:justify-end">
          <img 
            src="/R.png" 
            alt="image of a car" 
            className="w-full max-w-sm md:max-w-md lg:max-w-2xl object-cover"
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Hero