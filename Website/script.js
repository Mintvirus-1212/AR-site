console.log("✅ OpenCV & Three.js Script Loaded!");

// Ensure OpenCV is fully loaded before running any OpenCV functions
if (typeof cv === 'undefined') {
    console.log("⏳ Waiting for OpenCV to load...");
    document.addEventListener("opencv_ready", startApp);
} else {
    console.log("✅ OpenCV is already loaded!");
    startApp();
}

function startApp() {
    console.log("🚀 OpenCV is fully initialized!");
    startScanning(document.getElementById("camera-feed"));
}

// OpenCV Initialization (Wait for OpenCV to be ready)
cv['onRuntimeInitialized'] = function () {
    console.log("✅ OpenCV Ready!");
    document.dispatchEvent(new Event("opencv_ready"));
};

// **Initialize Camera & Start Scanning**
document.addEventListener("DOMContentLoaded", async function () {
    console.log("📷 Initializing camera...");

    const video = document.createElement("video");
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

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => startScanning(video));
    } catch (error) {
        console.error("❌ Camera access denied:", error);
        alert("Please enable camera access.");
    }
});

// **Image Detection with OpenCV.js**
async function startScanning(video) {
    console.log("🔍 OpenCV.js initialized!");

    try {
        let imgTarget = new Image();
        imgTarget.crossOrigin = "anonymous"; 
        imgTarget.src = "https://your-webflow-url.com/image.jpg"; // Replace with your actual image

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
