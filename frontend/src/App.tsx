import Hero from "./components/Hero"
import Navbar from "./components/Navbar"
import HowItWorks from "./components/HowItWorks"
import WhyChooseUs from "./components/WhyChooseUs"
import Discover from "./components/Discover"
import Subscribe from "./components/Subscribe"
import Footer from "./components/Footer"


const App = () => {
  return (
    <div>
        <Navbar />
        <Hero />
        <HowItWorks />
        <WhyChooseUs />
        <Discover />
        <Subscribe />
        <Footer />
    </div>
  )
}

export default App