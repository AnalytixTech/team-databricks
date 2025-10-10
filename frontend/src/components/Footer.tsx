import { Separator } from "./ui/separator";
import { Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <div
      className="container bg-blue-950 flex flex-col md:flex-row m-auto mt-20 md:rounded-2xl p-6 md:p-10 lg:p-14"
      style={{ fontFamily: "Funnel Display" }}
    >
      {/* Left Section */}
      <div className="flex flex-col w-full md:w-2/3">
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/logo.svg" alt="Fleetly logo" className="h-8 md:h-10" />
          <h1 className="text-white text-lg md:text-xl font-semibold">Fleetly</h1>
        </div>

        <p className="text-white mt-4 text-sm md:text-base leading-relaxed">
          The ultimate two-sided car rental platform connecting renters with reliable vehicles and
          empowering fleet owners with powerful management tools.
        </p>

        <div className="mt-6 hidden md:block">
          <Separator className="bg-gray-700" />
        </div>

        <p className="text-white text-xs md:text-sm mt-4">
          © 2025 Fleetly. All rights reserved.
        </p>
      </div>

      
      <div className="flex flex-col w-full md:w-1/3 mt-10 md:mt-0 md:ml-44 ">
        <h1 className="text-white text-lg font-semibold">Get In Touch</h1>

        <div className="flex items-center mt-4">
          <Mail className="text-orange-400 h-5 w-5" />
          <p className="text-white ml-2 text-sm md:text-base">
            fleetlyrentals@gmail.com
          </p>
        </div>

        <div className="flex items-center mt-4">
          <Phone className="text-orange-400 h-5 w-5" />
          <p className="text-white ml-2 text-sm md:text-base">
            +1 (234) 567-8901
          </p>
        </div>

        <div className="flex mt-8 md:mt-14 gap-4">
          <p className="text-white text-sm cursor-pointer hover:text-gray-300 transition-colors">
            Terms
          </p>
          <p className="text-white text-sm cursor-pointer hover:text-gray-300 transition-colors">
            Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Footer;
