

import { lazy } from "react";
import { BrowserRouter, Routes, Route} from "react-router";

const Home = lazy(() => import('./Home/components/main'));

import "./App.css";
function App() {
  return (
    <div className="container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>}/>
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
