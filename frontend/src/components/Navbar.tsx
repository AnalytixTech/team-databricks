import { Link } from "react-router"
import { Button } from "./ui/button"

const Navbar = () => {
  return (
    <div>
        <div className="flex container ml-8 mt-4 ">
            <img src="/logo.svg" alt="logo" className="h-8 mt-2" />
            <h1 className="mt-4 text-xl mr-52" style={{fontFamily: "Funnel Display"}}>Fleetly</h1>
              <div className="flex gap-6 mt-6 ml-80" style={{fontFamily: "Funnel Display"}}>
            <h1 className="cursor-pointer">How it works</h1>
            <h1 className="cursor-pointer">Why choose us?</h1>
        </div>
        <div className="mt-4 ml-96" style={{fontFamily: "Funnel Display"}}>
            <Link to="/login">
            <Button className="bg-gray-200 text-black cursor-pointer h-12 w-28 text-lg hover:bg-gray-200">Login</Button></Link>

            <Link to="/signup">
            <Button className="bg-black text-white ml-4 cursor-pointer h-12 w-28 text-lg hover:bg-gray-200 hover:text-black">Sign up</Button></Link>
        </div>
        </div>
        
      
        
    </div>
  )
}

export default Navbar