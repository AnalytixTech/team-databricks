import { Link } from "react-router"
import { Button } from "./ui/button"
import {AiOutlineClose, AiOutlineMenu} from 'react-icons/ai'
import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import {motion} from 'motion/react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="flex justify-between items-center h-24 max-w-[1465px] mx-auto px-0" style={{ fontFamily: "Funnel Display" }}>
        {/* Logo div */}
        <div className="flex">
              <img src="/logo.svg" alt="logo" className="h-8 mt-2" />
            <h1 className="mt-4 text-xl mr-0" >Fleetly</h1>
            </div>
             <ul className="hidden gap-7 md:flex">
              <li className="p-4">How it works</li>
              <li className="p-4">Why choose us?</li>
              <Link to="/login"><li className="p-4">Sign in</li>
              </Link>
                       <Link to="/signup">
            <Button className="bg-blue-950 text-white ml-4 cursor-pointer h-12 w-28 text-sm hover:bg-gray-200 hover:text-black">Get Started</Button></Link>
             </ul>
             <div className="block mr-4  md:hidden ">
              {!isOpen ? <AiOutlineMenu className="h-7 w-7" onClick={toggleMenu}/> : <AiOutlineClose className="h-7 w-7" onClick={toggleMenu}/>}
              
             </div>
             <div className={`fixed left-0 top-0 w-[60%] h-full border-r border-r-white bg-white text-black transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300`}>
              <div className="flex">
              <img src="/logo.svg" alt="logo" className="h-8 mt-4 ml-4" />
              <h1 className="mt-6 text-xl mr-0" >Fleetly</h1>
            </div>

              <ul style={{ listStyleType: "none" }} className="pt-12 uppercase">
                <li className="p-4 border-b border-b-blue-200">How it works</li>
                <li className="p-4 border-b border-b-blue-200">Why choose us?</li>
               <Link to="/login"> <li className="p-4 border-b border-b-blue-200">Sign in <ArrowUpRight className="inline ml-1 text-blue-200" /></li></Link>
                
              </ul>
              
             </div>
       
        </div>
        
      
        
    </motion.div>
  )
}

export default Navbar