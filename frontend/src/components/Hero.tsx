import { Button } from "./ui/button"
import { ArrowRight} from "lucide-react"
import { Link } from "react-router"

const Hero = () => {
  return (
    <div className="mt-40 container ml-8 flex gap-32">
        <div className="mt-20 ml-10" style={{fontFamily: "Funnel Display"}}>
            <h1 className="text-4xl font-bold">One <span className="text-orange-400">Platform. </span><br />Two <span className="text-blue-900">Experiences.</span></h1>
            <p className="mt-7"> Fleetly lets renters find reliable cars with quick reservations <br />and flexible payments, while giving owners a powerful dashboard to <br />manage fleets, track bookings, and grow revenue all in one seamless<br /> platform.</p>
            <Link to="/login"><Button className="mt-4 h-12 w-36 cursor-pointer">Get Started <ArrowRight className="color-white" /></Button></Link>
        </div>
        <div>
            <img src="/R.png" alt="image of a car" className="h-100 ml-20"/>
           

        </div>
        
    </div>
  )
}

export default Hero