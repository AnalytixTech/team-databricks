
import { Button } from "./ui/button"
import { useState } from "react"
import {motion} from "motion/react"

const HowItWorks = () => {
    const [activeTab, setActiveTab] = useState<'renters' | 'owners'>('renters');

    const rentersStep = () => [
        {
            title: "Search",
            description: "Easily browse through a wide selection of vehicles based on your location, car type, or budget."
        },
        {
            title: "Reserve & Pay",
            description: "Once you've found the right car, select your preferred dates and instantly secure it with a safe and seamless payment process."
        },
        {
            title: "Pick Up & Return",
            description: "Collect your car from the designated pickup location and enjoy your trip with confidence and returning them in due time."
        }
    ]

    const ownersStep = () => [{
        title: "List Your Vehicles",
        description: "Create a listing for your vehicle with photos, pricing, and availability. Set your own rates and manage your calendar."
    },
    {
        title: "Review & Accept",
        description: "Receive booking requests from renters. Review their profiles and trip details, then accept or decline based on your preferences"
    },
    {
        title: "Earn & Track",
        description: "Get paid securely after each trip. Track your earnings, view booking history, and manage your fleet all from the app."
    }
]

 const currentSteps = activeTab === 'renters' ? rentersStep() : ownersStep()

 const toggleTabs = () => {
    setActiveTab(activeTab === 'renters' ? 'owners' : 'renters')
 }




return (
  <motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, ease: "easeOut" }} 
  
  
  style={{fontFamily: "Funnel Display"}} className="flex justify-center mt-20 md:mt-40 mb-20 px-4">
    <div className="flex flex-col items-center gap-4 w-full">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">How it works</h1>
      <p className="text-center text-sm md:text-lg px-4">Simple steps for both renters and owners to get started on Fleetly</p>

      <div className="inline-flex rounded-2xl bg-white border-2 border-gray-800 p-1 mb-8 md:mb-12">
        <button
          onClick={() => setActiveTab('renters')}
          className={`px-4 md:px-8 py-2 rounded-2xl font-semibold transition-all text-sm md:text-base ${
            activeTab === 'renters' 
              ? 'bg-blue-950 text-white' 
              : 'bg-transparent text-gray-800'
          }`}
        >
          Renters
        </button>
        <button
          onClick={() => setActiveTab('owners')}
          className={`px-4 md:px-8 py-2 rounded-2xl font-semibold transition-all text-sm md:text-base ${
            activeTab === 'owners' 
              ? 'bg-blue-950 text-white ' 
              : 'bg-transparent text-gray-800'
          }`}
        >
          Owners
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay:0.3, ease: "easeOut" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl px-4 gap-4 md:gap-6"
      >
        {currentSteps.map((step, index) => (
          <div key={index} className="bg-blue-950 text-white rounded-lg p-6 md:p-10 min-h-[120px] md:min-h-[300px] flex flex-col">
            <div className="bg-orange-400 h-6 w-6 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-sm md:text-xl font-bold">{index + 1}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-gray-300">{step.description}</p>
          </div>
        ))}
      </motion.div>
    </div>
  </motion.div>
)}

export default HowItWorks