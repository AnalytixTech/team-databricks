import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import Footer from "@/components/Footer"
import {Link} from 'react-router'

const SignUpPage = () => {
  return (
    <div style={{fontFamily: 'Funnel Display'}} className="flex flex-col min-h-screen mt-8">
      <div className="flex flex-col items-center w-full px-4 py-8 m-auto max-w-sm md:max-w-md lg:max-w-2xl gap-6 md:gap-8">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="logo" className="h-8" />
          <h1 className="text-xl font-semibold">Fleetly</h1>
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl text-blue-900 font-semibold text-center leading-tight">
          Rent your perfect ride in minutes!
        </h1>
        
        <img src="/R.png" alt="car" className="w-full max-w-md md:max-w-lg object-contain" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
          <Link to='/signup/create' className="w-full">
            <Button className="cursor-pointer w-full py-6 text-base md:text-lg">
              Create an account
            </Button>
          </Link>
          <Link to="/rides" className="w-full">
            <Button className="bg-white text-black hover:bg-gray-100 cursor-pointer w-full py-6 text-base md:text-lg border-2 border-gray-200">
              Continue as Guest <ArrowUpRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default SignUpPage