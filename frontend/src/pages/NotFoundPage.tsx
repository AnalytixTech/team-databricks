import { Link } from "react-router"

const NotFoundPage = () => {
  return (
    <div className="flex flex-col  items-center mt-60" style={{fontFamily: 'Funnel Display'}}>
        <h1>Page does not exist!</h1>
        <Link to="/">
        <button className="bg-black text-white p-4 rounded-2xl cursor-pointer mt-3">GO HOME</button>
        </Link>
    </div>
  )
}

export default NotFoundPage