

const Hero = () => {
  return (
    <div className="mt-40 container ml-8 flex gap-32">
        <div className="mt-20 ml-6" style={{fontFamily: "Funnel Display"}}>
            <h1 className="text-4xl font-bold">One <span className="text-orange-400">Platform. </span>Two <span className="text-blue-900">Experiences</span></h1>
            <p className="mt-7"> Fleetly lets renters find reliable cars with quick reservations <br></br>and flexible payments, while giving owners a powerful dashboard to <br></br>manage fleets, track bookings, and grow revenue all in one seamless<br></br> platform.</p>
        </div>
        <div>
            <img src="/R.png" alt="image of a car" className="h-100 ml-20"/>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-gradient-to-r from-transparent via-black/30 to-transparent blur-lg rounded-full"></div>

        </div>
        
    </div>
  )
}

export default Hero