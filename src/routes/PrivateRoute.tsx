import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute({user} : {user : any}){
    return user ? <Outlet/> : <Navigate to='/auth' replace/>
}