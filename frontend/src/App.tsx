import Hero from "./components/Hero"
import Navbar from "./components/Navbar"
import HowItWorks from "./components/HowItWorks"
import WhyChooseUs from "./components/WhyChooseUs"
import Discover from "./components/Discover"

const App = () => {
  return (
    <div>
        <Navbar />
        <Hero />
        <HowItWorks />
        <WhyChooseUs />
        <Discover />
    </div>
  )
}

export default App