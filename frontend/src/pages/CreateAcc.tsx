import Footer from "@/components/Footer"

const CreateAcc = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen gap-4 mt-8" style={{fontFamily: 'Funnel Display'}}>
        <div className="flex">
              <img src="/logo.svg" alt="logo" className="h-8 mt-2" />
            <h1 className="mt-4 text-xl mr-0" >Fleetly</h1>
        </div>
        <div className="bg-blue-900 w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl flex flex-col p-8 md:p-12 lg:p-16 rounded-lg items-center gap-4">
            <h1 className="text-white text-2xl font-semibold">Create an account</h1>
            <div className="grid gap-4 w-full">
                <input type="text" placeholder="Full Name" className="text-white bg-transparent border-2 border-white p-4 rounded-md placeholder:text-gray-300" required/>
                <input type="email" placeholder="Email" className="text-white bg-transparent border-2 border-white p-4 rounded-md placeholder:text-gray-300" required/>
                <input type="password" placeholder="Password" className="text-white bg-transparent border-2 border-white p-4 rounded-md placeholder:text-gray-300" required />
                <input type="password" placeholder="Confirm Password" className="text-white bg-transparent border-2 border-white p-4 rounded-md placeholder:text-gray-300" required />
              <button className='bg-white flex w-full items-center justify-center text-black py-4 rounded-sm font-semibold cursor-pointer hover:bg-gray-100 transition-colors'>
            Create account
          </button>
                <div className='flex items-center gap-4 my-2'>
            <div className='flex-1 h-px bg-white'></div>
            <span className='text-white text-sm'>OR</span>
            <div className='flex-1 h-px bg-white'></div>
          </div>
          <button className='bg-white flex w-full items-center justify-center text-black py-4 rounded-sm hover:bg-gray-100 transition-colors'>
            <img
              src='/ggo.svg'
              alt='google logo'
              className='h-6 w-6 mr-3' 
            />
            Continue with Google
          </button>
            </div>
        </div>
        <Footer />
    </div>
  )
}

export default CreateAcc