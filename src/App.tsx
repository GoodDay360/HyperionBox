

import { lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route} from "react-router";
import { info, error } from '@tauri-apps/plugin-log';

const Home = lazy(() => import('./home/components/main'));
const Splash_Screen = lazy(() => import('./splash_screen/components/main'));

// Style import
import 'bootstrap/dist/css/bootstrap-reboot.min.css';
import "./App.css";

function App() {

  useEffect(()=>{
    (async () => {
      try{
      }catch{(e:unknown)=>{
        if (e instanceof Error) {
            // Log the error message if it's an instance of Error
            error(e.message);
        } else {
            // Handle other types of errors (if necessary)
            error('An unknown error occurred');
        }
      }}
      
    });
    
  },[])

  return (
    <div className="container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash_Screen/>}/>
          <Route path="/happy" 
            element={
                <h1>Hyperion is happy</h1> 
            } 
          />
        </Routes>
    </BrowserRouter>
  </div>
  );
}

export default App;
