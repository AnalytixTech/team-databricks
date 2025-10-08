import {Separator} from "./ui/separator"
import { Mail } from "lucide-react"
import { Phone } from "lucide-react"

const Footer = () => {
  return (
    <div className="container bg-blue-950 flex m-auto h-64 mt-20 rounded-2xl" style={{fontFamily: "Funnel Display"}}>
        <div className="flex flex-col  " >
            <div className="flex ml-8 mt-7">
                <img src="/logo.svg" alt="" className="h-8" />
                <h1 className="text-white text-xl mt-2">Fleetly</h1>
            </div>
            <div className="">
                <p className="text-white ml-8 mt-4">The ultimate two-sided car rental platform connecting<br /> renters with reliable vehicles and empowering fleet <br />owners with powerful management tools.</p>
            </div>
            <Separator className="ml-7 mt-6" style={{width: '400px'}}/>
            <div className="ml-8 mt-4">
                <p className="text-white text-sm">© Copyright 2025 Fleetly.</p>
                
            </div>
            
        </div>
        <div className="flex flex-col ml-auto mr-7 mt-7">
            <h1 className="text-white mr-7">Get In Touch</h1>
            <div className="flex mt-4 mr-10">
                <Mail className="text-orange-400 " />
                <p className="text-white ml-2 text-sm">fleetlyrentals@gmail.com</p>

                
            </div>
            <div className="flex mt-4 mr-10">
                <Phone className="text-orange-400" />
                <p className="text-white ml-2 text-sm">+1 (234) 567-8901</p>
            </div>
            <div className="mt-14 flex">
                <p className="text-white text-sm mr-4 cursor-pointer hover:text-gray-200">Terms</p>
                <p className="text-white text-sm cursor-pointer hover:text-gray-200">Privacy Policy</p>
            </div>
            
        </div>
    </div>
  )
}

export default Footer