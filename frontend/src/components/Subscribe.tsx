import { useState } from "react"
import { Button } from "./ui/button"

const Subscribe = () => {
  return (
    <div>
        <div className="flex flex-col items-center" style={{fontFamily: "Funnel Display"}}>
            <h1 className="text-2xl font-bold mb-7">Newsletter</h1>
            <p>Subscribe to receive the latest car releases, pricing updates, and feature announcements from Fleetly.</p>

            <div className="bg-gray-200 py-3 mt-7 rounded-2xl">
                <div className="max-w-md mx-auto px-4">
                    <form action="">
                        <input type="email" className="flex-1 px-4 py-3 rounded-lg" placeholder="Enter your Email"/>
                        <Button className="bg-blue-950 ml-4 px-6 py-6 cursor-pointer hover:bg-blue-950 text-lg">Subscribe</Button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Subscribe