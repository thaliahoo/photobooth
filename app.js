// =========================
// PHOTO BOOTH SETTINGS
// =========================

const TOTAL_PHOTOS = 4;
const COUNTDOWN_SECONDS = 3;


// =========================
// PHOTO BOOTH STATE
// =========================

let photos = [];
let currentPhoto = 0;
let cameraStream = null;


// =========================
// GET HTML ELEMENTS
// =========================

const startScreen = document.getElementById("startScreen");
const cameraScreen = document.getElementById("cameraScreen");
const reviewScreen = document.getElementById("reviewScreen");
const stripScreen = document.getElementById("stripScreen");

const startButton = document.getElementById("startButton");

const camera = document.getElementById("camera");
const captureCanvas = document.getElementById("captureCanvas");

const photoNumber = document.getElementById("photoNumber");
const countdown = document.getElementById("countdown");
const readyMessage = document.getElementById("readyMessage");
const progressBar = document.getElementById("progressBar");
const flash = document.getElementById("flash");

const photoGrid = document.getElementById("photoGrid");

const retakeButton = document.getElementById("retakeButton");
const createStripButton = document.getElementById("createStripButton");

const stripCanvas = document.getElementById("stripCanvas");

const printButton = document.getElementById("printButton");
const nextSessionButton = document.getElementById("nextSessionButton");


// =========================
// SCREEN CONTROL
// =========================

function showScreen(screen) {

    startScreen.classList.add("hidden");
    cameraScreen.classList.add("hidden");
    reviewScreen.classList.add("hidden");
    stripScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}


// =========================
// WAIT FUNCTION
// =========================

function wait(milliseconds) {

    return new Promise(function(resolve) {
        setTimeout(resolve, milliseconds);
    });
}


// =========================
// START CAMERA
// =========================

async function startCamera() {

    try {

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user"
            },
            audio: false
        });

        camera.srcObject = cameraStream;

        await camera.play();

    } catch (error) {

        console.error("Camera error:", error);

        alert(
            "The camera could not be accessed. " +
            "Please allow camera access and try again."
        );
    }
}


// =========================
// STOP CAMERA
// =========================

function stopCamera() {

    if (cameraStream) {

        const tracks = cameraStream.getTracks();

        tracks.forEach(function(track) {
            track.stop();
        });

        cameraStream = null;
    }

    camera.srcObject = null;
}


// =========================
// COUNTDOWN
// =========================

async function runCountdown() {

    readyMessage.textContent = "Get ready!";

    for (
        let number = COUNTDOWN_SECONDS;
        number > 0;
        number--
    ) {

        countdown.textContent = number;

        await wait(1000);
    }

    countdown.textContent = "";

    readyMessage.textContent = "Smile!";
}


// =========================
// CAMERA FLASH
// =========================

async function triggerFlash() {

    flash.classList.add("active");

    await wait(150);

    flash.classList.remove("active");
}


// =========================
// TAKE PHOTO
// =========================

function takePhoto() {

    if (!camera.videoWidth || !camera.videoHeight) {

        console.error("Camera is not ready.");

        return;
    }

    captureCanvas.width = camera.videoWidth;
    captureCanvas.height = camera.videoHeight;

    const context = captureCanvas.getContext("2d");

    // Mirror the photo to match the camera preview
    context.save();

    context.translate(
        captureCanvas.width,
        0
    );

    context.scale(-1, 1);

    context.drawImage(
        camera,
        0,
        0,
        captureCanvas.width,
        captureCanvas.height
    );

    context.restore();

    const image =
        captureCanvas.toDataURL(
            "image/jpeg",
            0.92
        );

    photos.push(image);
}


// =========================
// UPDATE PROGRESS
// =========================

function updateProgress() {

    const percentage =
        (currentPhoto / TOTAL_PHOTOS) * 100;

    progressBar.style.width =
        percentage + "%";
}


// =========================
// START PHOTO SESSION
// =========================

async function startPhotoSession() {

    photos = [];
    currentPhoto = 0;

    photoGrid.innerHTML = "";

    progressBar.style.width = "0%";

    showScreen(cameraScreen);

    await startCamera();

    // Give the camera time to initialize
    await wait(1000);

    for (
        let i = 0;
        i < TOTAL_PHOTOS;
        i++
    ) {

        currentPhoto = i + 1;

        photoNumber.textContent =
            "PHOTO " +
            currentPhoto +
            " OF " +
            TOTAL_PHOTOS;

        updateProgress();

        await runCountdown();

        await triggerFlash();

        takePhoto();

        readyMessage.textContent =
            "Photo taken!";

        await wait(1000);
    }

    progressBar.style.width = "100%";

    readyMessage.textContent =
        "All photos taken!";

    await wait(800);

    stopCamera();

    showReview();
}


// =========================
// SHOW REVIEW
// =========================

function showReview() {

    photoGrid.innerHTML = "";

    photos.forEach(function(photo) {

        const image =
            document.createElement("img");

        image.src = photo;

        image.alt =
            "Photo booth picture";

        photoGrid.appendChild(image);
    });

    showScreen(reviewScreen);
}


// =========================
// RETAKE PHOTOS
// =========================

function retakePhotos() {

    photos = [];

    currentPhoto = 0;

    photoGrid.innerHTML = "";

    startPhotoSession();
}


// =========================
// CREATE 4x6 PHOTO STRIP
// =========================

function createPhotoStrip() {

    if (photos.length !== TOTAL_PHOTOS) {

        alert(
            "Please take all four photos first."
        );

        return;
    }


    // =========================
    // 4x6 PAPER
    // 300 DPI
    // =========================

    const canvasWidth = 1200;
    const canvasHeight = 1800;

    stripCanvas.width = canvasWidth;
    stripCanvas.height = canvasHeight;

    const context =
        stripCanvas.getContext("2d");


    // =========================
    // WHITE PAPER
    // =========================

    context.fillStyle = "#ffffff";

    context.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    // =========================
    // STRIP DIMENSIONS
    // =========================

    const stripWidth = 520;

    const stripHeight = 1680;

    const leftStripX = 50;

    const rightStripX = 630;

    const topMargin = 60;

    const textAreaHeight = 100;

    const photoAreaHeight =
        stripHeight -
        textAreaHeight;

    const photoHeight =
        photoAreaHeight /
        TOTAL_PHOTOS;


    // =========================
    // DRAW FOUR PHOTOS
    // ON BOTH STRIPS
    // =========================

    for (
        let i = 0;
        i < TOTAL_PHOTOS;
        i++
    ) {

        const y =
            topMargin +
            (i * photoHeight);


        // LEFT STRIP

        drawCoverImage(
            context,
            photos[i],
            leftStripX,
            y,
            stripWidth,
            photoHeight
        );


        // RIGHT STRIP

        drawCoverImage(
            context,
            photos[i],
            rightStripX,
            y,
            stripWidth,
            photoHeight
        );
    }


    // =========================
    // STRIP BORDERS
    // =========================

    context.strokeStyle = "#000000";

    context.lineWidth = 4;

    context.strokeRect(
        leftStripX,
        topMargin,
        stripWidth,
        stripHeight
    );

    context.strokeRect(
        rightStripX,
        topMargin,
        stripWidth,
        stripHeight
    );


    // =========================
    // CENTER CUT LINE
    // =========================

    context.strokeStyle = "#999999";

    context.lineWidth = 2;

    context.setLineDash([
        10,
        10
    ]);

    context.beginPath();

    context.moveTo(
        canvasWidth / 2,
        20
    );

    context.lineTo(
        canvasWidth / 2,
        canvasHeight - 20
    );

    context.stroke();

    context.setLineDash([]);


    // =========================
    // TEXT
    // =========================

    context.fillStyle = "#222222";

    context.font =
        "bold 32px Arial";

    context.textAlign =
        "center";


    // LEFT TEXT

    context.fillText(
        "MY PHOTO BOOTH",
        leftStripX +
        (stripWidth / 2),
        topMargin +
        stripHeight -
        35
    );


    // RIGHT TEXT

    context.fillText(
        "MY PHOTO BOOTH",
        rightStripX +
        (stripWidth / 2),
        topMargin +
        stripHeight -
        35
    );


    // =========================
    // SHOW PRINT PREVIEW
    // =========================

    showScreen(stripScreen);
}


// =========================
// DRAW PHOTO INTO STRIP
// =========================

function drawCoverImage(
    context,
    imageSource,
    x,
    y,
    width,
    height
) {

    const image =
        new Image();


    image.onload = function() {

        const imageRatio =
            image.width /
            image.height;

        const boxRatio =
            width /
            height;


        let drawWidth;
        let drawHeight;
        let offsetX;
        let offsetY;


        // =========================
        // COVER IMAGE
        // =========================

        if (imageRatio > boxRatio) {

            drawHeight =
                height;

            drawWidth =
                height *
                imageRatio;

            offsetX =
                x +
                (width -
                drawWidth) / 2;

            offsetY =
                y;

        } else {

            drawWidth =
                width;

            drawHeight =
                width /
                imageRatio;

            offsetX =
                x;

            offsetY =
                y +
                (height -
                drawHeight) / 2;
        }


        // =========================
        // CLIP PHOTO
        // =========================

        context.save();

        context.beginPath();

        context.rect(
            x,
            y,
            width,
            height
        );

        context.clip();


        // =========================
        // DRAW PHOTO
        // =========================

        context.drawImage(
            image,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
        );


        context.restore();
    };


    image.src =
        imageSource;
}


// =========================
// PRINT PHOTO STRIP
// =========================

function printPhotoStrip() {

    const imageData =
        stripCanvas.toDataURL(
            "image/png"
        );


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups for this website so the photo can be printed."
        );

        return;
    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Photo Booth 4x6
            </title>


            <style>

                @page {
                    size: 4in 6in;
                    margin: 0;
                }


                html,
                body {

                    width: 4in;
                    height: 6in;

                    margin: 0;
                    padding: 0;

                    background: white;

                }


                body {

                    display: flex;

                    justify-content: center;

                    align-items: center;

                }


                img {

                    width: 4in;
                    height: 6in;

                    display: block;

                }

            </style>

        </head>


        <body>

            <img
                src="${imageData}"
                alt="Photo booth strip"
            >

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.onload =
        function() {

            printWindow.focus();

            printWindow.print();

        };
}


// =========================
// NEXT SESSION
// =========================

function nextSession() {

    // Stop camera if it is running
    stopCamera();


    // Clear all photos
    photos = [];

    currentPhoto = 0;


    // Clear review photos
    photoGrid.innerHTML = "";


    // Reset strip canvas
    stripCanvas.width = 1;
    stripCanvas.height = 1;


    // Reset progress
    progressBar.style.width = "0%";


    // Reset camera text
    countdown.textContent = "";

    photoNumber.textContent =
        "PHOTO 1 OF 4";

    readyMessage.textContent =
        "Get ready!";


    // Return to home
    showScreen(startScreen);
}


// =========================
// BUTTON CONNECTIONS
// =========================

startButton.addEventListener(
    "click",
    startPhotoSession
);


retakeButton.addEventListener(
    "click",
    retakePhotos
);


createStripButton.addEventListener(
    "click",
    createPhotoStrip
);


printButton.addEventListener(
    "click",
    printPhotoStrip
);


nextSessionButton.addEventListener(
    "click",
    nextSession
);


// =========================
// INITIAL SCREEN
// =========================

showScreen(startScreen);