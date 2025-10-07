

const WhyChooseUs = () => {
  return (
    <div className="flex justify-center  mt-10">
        <div className="flex flex-col items-center" style={{fontFamily: "Funnel Display"}}>
            <h1 className="text-2xl font-bold">Why Choose Us?</h1>
            <p className="mb-7 mt-6">We make car rentals effortless for renters and profitable for owners all in one seamless platform</p>
              <div className="grid grid-cols-3 max-w-6xl px-4 gap-4">
                    <div className="bg-blue-950 text-white rounded-lg p-6">
                        <div className="bg-orange-400 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <span className="text-xl font-bold">1</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Transparent & Competitive Pricing</h3>
                        <p className="text-sm text-gray-300">With Fleetly, renters enjoy the best prices on quality vehicles, 
                            while owners set competitive rates that reflect true market value. No hidden fees, no last-minute surprises, just clear, upfront costs.</p>
                    </div>
                    <div className="bg-blue-950 text-white rounded-lg p-6">
                        <div className="bg-orange-400 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <span className="text-xl font-bold">1</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Seamless Dual Experience</h3>
                        <p className="text-sm text-gray-300">Fleetly is built for both sides of the rental ecosystem. Renters get a mobile app that makes finding, reserving, and paying for cars quick and effortless. 
                            Owners get a powerful web dashboard to manage fleets, track bookings, and monitor earnings in real time..</p>
                    </div>
                    <div className="bg-blue-950 text-white rounded-lg p-6">
                        <div className="bg-orange-400 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <span className="text-xl font-bold">1</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Secure & Reliable Platform</h3>
                        <p className="text-sm text-gray-300">Trust and safety are at the heart of Fleetly. Every transaction is protected with secure payment gateways, while user verification helps prevent fraud and misuse.
                             Owners can confidently list vehicles knowing their earnings are protected, and renters can book with peace of mind..</p>
                    </div>
            
            </div>
        </div>
    </div>
  )
}

export default WhyChooseUs