// client/src/App.js
import React, { useState } from "react";
import axios from "axios";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // Step 1: Login, Step 2: OTP Verification
  const [token, setToken] = useState("");

  const handleLogin = async () => {
    try {
      await axios.post("http://localhost:5000/login", { email, password });
      setStep(2);
    } catch (error) {
      alert("Invalid credentials");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await axios.post("http://localhost:5000/verify-otp", { email, otp });
      setToken(response.data.token);
      alert("Logged in successfully!");
    } catch (error) {
      alert("Invalid or expired OTP");
    }
  };

  return (
    <div className="App">
      {step === 1 ? (
        <div class="login" style={{height: "100vh", display: "flex",
         justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "15px", background: "linear-gradient(to right, #6a1b9a, #1976d2)"}}>
          <h2 style={{color: "white"}}>Login</h2>
          <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div style={{height: "100vh", display: "flex",
          justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "15px", background: "linear-gradient(to right, #6a1b9a, #1976d2)"}}>
          <h2 style={{color: "white"}}>Enter OTP</h2>
          <input type="text" placeholder="OTP" onChange={(e) => setOtp(e.target.value)} />
          <button onClick={handleVerifyOtp}>Verify OTP</button>
        </div>
      )}
      {token && <p>Token: {token}</p>}
    </div>
  );
}

export default App;

