// NOTE: No imports here! We use window.Hands and window.Camera

export const setupGestureRecognition = (videoElement, canvasElement, onGesture) => {
  const ctx = canvasElement.getContext('2d');

  // Grab the globals from index.html
  const Hands = window.Hands;
  const Camera = window.Camera;

  if (!Hands || !Camera) {
      console.error("MediaPipe failed to load. Check index.html");
      return;
  }

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5,
  });

  hands.onResults((results) => {
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      drawSkeleton(ctx, landmarks, canvasElement.width, canvasElement.height);
      const gesture = detectGesture(landmarks);
      if (gesture) onGesture(gesture);
    }
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      if (videoElement.readyState >= 2) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        await hands.send({ image: videoElement });
      }
    },
    width: 640,
    height: 480,
  });

  camera.start();
  return camera;
};

// --- DRAWING ---
const drawSkeleton = (ctx, landmarks, width, height) => {
  ctx.strokeStyle = "#00FF00"; 
  ctx.lineWidth = 2;
  const getPoint = (index) => ({ x: landmarks[index].x * width, y: landmarks[index].y * height });

  const connections = [[0,1], [1,2], [2,3], [3,4], [0,5], [5,6], [6,7], [7,8], [0,9], [9,10], [10,11], [11,12], [0,13], [13,14], [14,15], [15,16], [0,17], [17,18], [18,19], [19,20]];

  connections.forEach(([start, end]) => {
    const p1 = getPoint(start);
    const p2 = getPoint(end);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  ctx.fillStyle = "#FF0000"; 
  for (let i = 0; i < 21; i++) {
    const p = getPoint(i);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI); 
    ctx.fill();
  }
};

// --- GESTURE LOGIC ---
const detectGesture = (landmarks) => {
  const thumbTip = landmarks[4];
  const thumbMCP = landmarks[2]; 
  const indexTip = landmarks[8];
  const indexMCP = landmarks[5]; 
  const middleTip = landmarks[12];
  const middleMCP = landmarks[9];
  const ringTip = landmarks[16];
  const ringMCP = landmarks[13];
  const pinkyTip = landmarks[20];
  const pinkyMCP = landmarks[17];
  const wrist = landmarks[0];

  const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const isIndexOpen = dist(indexTip, wrist) > dist(indexMCP, wrist);
  const isMiddleOpen = dist(middleTip, wrist) > dist(middleMCP, wrist);
  const isRingOpen = dist(ringTip, wrist) > dist(ringMCP, wrist);
  const isPinkyOpen = dist(pinkyTip, wrist) > dist(pinkyMCP, wrist);

  if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
      if (thumbTip.y < thumbMCP.y - 0.05) return "THUMBS_UP";
      if (thumbTip.y > thumbMCP.y + 0.05) return "THUMBS_DOWN";
      return "FIST"; 
  }
  if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) return "VICTORY";
  const distThumbIndex = dist(thumbTip, indexTip);
  if (distThumbIndex < 0.05 && isMiddleOpen && isRingOpen) return "OK";
  if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) return "OPEN";

  return null;
};