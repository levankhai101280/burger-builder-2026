import { Navigate, Outlet } from "react-router-dom";

export default function PublicRoute({user} : {user : any}){
    return user ? <Navigate to ="/" replace/> : <Outlet/>
}