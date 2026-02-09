import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ParticleSystem } from "./ParticleSystem";
import { setupGestureRecognition } from "./GestureHandler";

export default function App() {
  const [stage, setStage] = useState(0); 
  const [feedback, setFeedback] = useState("Make a FIST 👊"); 
  const [dialogue, setDialogue] = useState(""); 
  const [showDialogue, setShowDialogue] = useState(false);
  
  const colors = ["#ff007f", "#9900ff", "#00ccff", "#ffcc00", "#ff3333"];
  const [particleColor, setParticleColor] = useState(colors[0]);

  const rejectionMessages = [
    "Try again sweetheart 😉", 
    "Wrong answer 🚫", 
    "Your heart says yes ❤️", 
    "Don't be shy...", 
    "Access Denied: Try Thumbs Up 👍",
    "Are you sure? Look closer...",
    "Glitch in the matrix! Try again 🙃",
    "I'll wait... 🕒"
  ];

  const videoRef = useRef(null);
  const canvasRef = useRef(null); 
  const stageRef = useRef(0);
  const lastGesture = useRef(null);
  
  // --- SAFETY LOCK ---
  const inputLock = useRef(false);

  useEffect(() => { stageRef.current = stage; }, [stage]);

  const changeColor = (index) => {
      setParticleColor(colors[index % colors.length]);
  };

  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      setupGestureRecognition(videoRef.current, canvasRef.current, (gesture) => {
        const currentStage = stageRef.current;
        
        if (inputLock.current) return;

        // --- WORKFLOW ---
        
        // Stage 0: Heart -> FIST
        if (currentStage === 0 && gesture === "FIST") {
             setStage(4); 
             changeColor(1);
             setFeedback("Scattering...");
             setShowDialogue(false);

             setTimeout(() => {
                 setStage(5); 
                 changeColor(2);
                 setDialogue("Hey Baby!\nCan I ask you something? ❤️");
                 setShowDialogue(true);
                 setFeedback("Show me 'Perfect' 👌");
             }, 1500);
        }

        // Stage 5: Dialogue -> OK
        if (currentStage === 5 && gesture === "OK") {
            setStage(6);
            changeColor(3);
            setDialogue("Will you be my\nValentine\nthis year?");
            setFeedback("👍 Yes!   /   👎 No...");
        }

        // Stage 6: The Question
        if (currentStage === 6) {
            if (gesture === "THUMBS_UP") {
                // SUCCESS -> LOCK INPUT and Show Letter
                setStage(7); 
                changeColor(0); 
                setDialogue(""); 
                setFeedback("Reading... (Wait 5s)");
                
                // LOCK FOR 5 SECONDS
                inputLock.current = true;
                setTimeout(() => {
                    inputLock.current = false;
                    setFeedback("Flash 'Peace' ✌️ for a Poem");
                }, 5000);
            
            } else if (gesture === "THUMBS_DOWN") {
                // REJECTION LOOP
                if (lastGesture.current !== "THUMBS_DOWN") {
                    changeColor(4); 
                    const msg = rejectionMessages[Math.floor(Math.random() * rejectionMessages.length)];
                    setFeedback(msg);
                    setDialogue("Are you sure? 🥺\n(Try the other thumb)");
                }
            }
        }

        // Stage 7: The Letter -> Go to POEM
        if (currentStage === 7) {
            if (gesture === "VICTORY") {
                setStage(8);
                changeColor(1); 
                setFeedback("Happy Valentine's Day ❤️");
                
                // LOCK AGAIN briefly
                inputLock.current = true;
                setTimeout(() => { inputLock.current = false; }, 2000);
            }
        }
        
        lastGesture.current = gesture; 
      });
    }
  }, []);

  return (
    <div className="app-container" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: 'black' }}>
      
      <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <ParticleSystem 
            shape={stage < 4 ? "HEART" : stage === 4 ? "EXPLODE" : "TEXT"} 
            color={particleColor} 
        />
      </Canvas>

      {/* UI Top Right */}
      <div style={{
          position: 'absolute', top: '40px', right: '40px', width: '300px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', zIndex: 100
      }}>
          <div style={{
            width: '100%', height: '225px', 
            border: `3px solid ${stage === 0 ? '#ff007f' : particleColor}`, 
            borderRadius: '15px',
            boxShadow: `0 0 20px ${stage === 0 ? '#ff007f' : particleColor}90`, 
            overflow: 'hidden', background: '#000', position: 'relative',
            transition: 'border-color 0.5s, box-shadow 0.5s'
          }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} playsInline muted autoPlay />
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
          </div>

          <div style={{
              color: stage === 0 ? '#ff007f' : particleColor,
              fontFamily: 'Courier New, monospace', fontSize: '1.2rem', fontWeight: 'bold',
              textShadow: `0 0 10px ${stage === 0 ? '#ff007f' : particleColor}`, 
              textAlign: 'center', background: 'rgba(20, 0, 10, 0.9)',
              padding: '15px 20px', borderRadius: '12px', width: '100%', 
              border: `1px solid ${stage === 0 ? '#ff007f' : particleColor}`,
              transition: 'all 0.5s',
              boxSizing: 'border-box'
          }}>
            {feedback}
          </div>
      </div>

      {/* Center Dialogue (Stages 5 & 6) */}
      {showDialogue && stage < 7 && (
        <div style={{
            position: 'absolute', top: '50%', left: '35%', transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.85)', 
            border: `2px solid ${particleColor}`, 
            borderRadius: '20px', padding: '40px 60px',
            textAlign: 'center', zIndex: 50,
            boxShadow: `0 0 50px ${particleColor}60`,
            minWidth: '400px', animation: 'fadeIn 1s ease-in',
            transition: 'border-color 0.5s, box-shadow 0.5s'
        }}>
            <h1 style={{ 
                color: 'white', fontFamily: 'serif', fontSize: '2.5rem', whiteSpace: 'pre-line', lineHeight: '1.4', margin: 0,
                textShadow: '0 0 10px rgba(255,255,255,0.3)'
            }}>
                {dialogue}
            </h1>
        </div>
      )}

      {/* STAGE 7: THE LETTER (Optimized Size) */}
      {stage === 7 && (
        <div style={{
            position: 'absolute', top: '50%', left: '35%', transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.95)', border: '2px solid #ff007f', padding: '30px',
            borderRadius: '15px', textAlign: 'center', zIndex: 200, width: '500px',
            boxShadow: '0 0 50px rgba(255, 0, 127, 0.6)', animation: 'fadeIn 1.5s ease-out',
            maxHeight: '90vh', overflowY: 'auto'
        }}>
            <p style={{ color: '#ffadd6', fontFamily: 'serif', fontSize: '1.3rem', lineHeight: '1.5', margin: 0, fontStyle: 'italic' }}>
                "My Dearest Zoha,
                <br/><br/>
                From the moment our paths crossed, my world has revolved around you.
                <br/><br/>
                You are my perfect solution, my greatest joy, and my only love.
                <br/><br/>
                I Love You. ❤️"
            </p>
            <p style={{ marginTop: '20px', color: 'white', opacity: 0.6, fontSize: '0.9rem' }}>(Wait for the moment...)</p>
        </div>
      )}

      {/* STAGE 8: THE POEM (Optimized Size & Spacing) */}
      {stage === 8 && (
        <div style={{
            position: 'absolute', top: '50%', left: '35%', transform: 'translate(-50%, -50%)',
            background: 'rgba(10, 0, 20, 0.98)', border: '1px solid #9900ff', padding: '30px',
            borderRadius: '20px', textAlign: 'center', zIndex: 200, width: '500px',
            boxShadow: '0 0 60px rgba(153, 0, 255, 0.5)', animation: 'fadeIn 2s ease-out',
            maxHeight: '90vh', overflowY: 'auto'
        }}>
            <h2 style={{ color: '#fff', fontFamily: 'serif', marginBottom: '20px', fontSize: '1.8rem', textShadow: '0 0 10px #9900ff' }}>
                For My Zohuu
            </h2>
            
            <div style={{ color: '#e0c0ff', fontFamily: 'serif', fontSize: '1.1rem', lineHeight: '1.4' }}>
                <p style={{ marginBottom: '15px' }}>
                    My world stands still when you draw near,<br/>
                    A beauty matched by none, my dear.<br/>
                    Your eyes hold light that shames the star,<br/>
                    My heart beats fast, both near and far.
                </p>

                <p style={{ marginBottom: '15px' }}>
                    With every smile, you paint my skies,<br/>
                    A timeless love that never dies.<br/>
                    Your gentle touch, a whisper sweet,<br/>
                    You make my life and soul complete.
                </p>

                <p style={{ marginBottom: '15px' }}>
                    Through every season, year by year,<br/>
                    I promise to hold you close and near.<br/>
                    A bond that time can never break,<br/>
                    Every step is better for the path we take.
                </p>

                <p style={{ marginBottom: '0px' }}>
                    So be my Valentine, today and true,<br/>
                    My greatest joy is loving you.<br/>
                    Forever yours, through everything,<br/>
                    You are my heart, my life, my spring.
                </p>
            </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -45%); } to { opacity: 1; transform: translate(-50%, -50%); } }
        /* Hide scrollbar for clean look but allow scrolling */
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
}