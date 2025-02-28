console.log("✅ OpenCV & Three.js Script Loaded! V.1.0");

// **Function to Dynamically Load OpenCV.js**
function loadOpenCV(callback) {
    console.log("⏳ Loading OpenCV...");

    let script = document.createElement("script");
    script.src = "https://docs.opencv.org/4.5.5/opencv.js";
    script.onload = function () {
        console.log("✅ OpenCV.js Loaded!");

        let checkOpenCV = setInterval(() => {
            if (typeof cv !== 'undefined' && cv.getBuildInformation) {
                clearInterval(checkOpenCV);
                console.log("🚀 OpenCV is fully initialized!");
                document.dispatchEvent(new Event("opencv_ready"));
                callback();
            }
        }, 100);
    };
    document.head.appendChild(script);
}

// **Event Listener for OpenCV Initialization**
document.addEventListener("opencv_ready", startApp);

// **Function to Start the Application**
async function startApp() {
    console.log("📷 Initializing camera...");
    
    let video = await requestCameraAccess();
    if (!video) {
        console.error("❌ Camera initialization failed. Exiting.");
        return;
    }

    startScanning(video);
}

// **Function to Request Camera Access**
async function requestCameraAccess() {
    try {
        console.log("📷 Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });

        let video = document.getElementById("camera-feed");
        if (!video) {
            video = document.createElement("video");
            video.setAttribute("id", "camera-feed");
            video.setAttribute("autoplay", true);
            video.setAttribute("playsinline", true);
            video.style.position = "fixed";
            video.style.top = "0";
            video.style.left = "0";
            video.style.width = "100vw";
            video.style.height = "100vh";
            video.style.objectFit = "cover";
            video.style.zIndex = "999";
            document.body.appendChild(video);
        }
        video.srcObject = stream;
        console.log("✅ Camera access granted!");
        return video;
    } catch (error) {
        console.error("❌ Camera access denied:", error);
        alert("Please enable camera access.");
        return null;
    }
}

// **Function for Image Recognition Using OpenCV.js**
async function startScanning(video) {
    console.log("🔍 OpenCV.js initialized! Starting image detection...");

    try {
        let imgTarget = new Image();
        imgTarget.crossOrigin = "anonymous";
        imgTarget.src = "https://your-webflow-url.com/image.jpg"; // Replace with your actual image URL

        imgTarget.onload = function () {
            console.log("🎯 Reference image loaded!");

            let targetMat = cv.imread(imgTarget);
            cv.cvtColor(targetMat, targetMat, cv.COLOR_RGBA2GRAY);

            let orb = new cv.ORB(1000);
            let keypoints1 = new cv.KeyPointVector();
            let descriptors1 = new cv.Mat();
            orb.detect(targetMat, keypoints1);
            orb.compute(targetMat, keypoints1, descriptors1);

            console.log("🧠 Keypoints extracted from reference image!");

            let matchInterval = setInterval(() => {
                let frame = captureFrame(video);
                if (!frame) return;

                let keypoints2 = new cv.KeyPointVector();
                let descriptors2 = new cv.Mat();
                let matches = new cv.DMatchVector();

                orb.detect(frame, keypoints2);
                orb.compute(frame, keypoints2, descriptors2);

                let bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
                bf.match(descriptors1, descriptors2, matches);

                if (matches.size() > 20) {
                    console.log("✅ High-confidence Target Detected!");
                    clearInterval(matchInterval);
                    startAROverlay();
                }

                frame.delete();
                keypoints2.delete();
                descriptors2.delete();
                matches.delete();
            }, 1000);
        };

    } catch (error) {
        console.error("❌ Error in startScanning():", error);
    }
}

// **Function to Capture a Frame from Camera for Processing**
function captureFrame(video) {
    console.log("📷 Capturing frame...");
    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    let mat = cv.imread(canvas);
    cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
    return mat;
}

// **Initialize OpenCV and Start the App**
loadOpenCV(startApp);
