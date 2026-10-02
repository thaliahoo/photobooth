const TOTAL_PHOTOS = 4;
const COUNTDOWN_SECONDS = 3;

let photos = [];
let currentPhoto = 0;
let cameraStream = null;
let selectedCameraId = null;

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


/* =========================================================
   SCREEN CONTROL
========================================================= */

function showScreen(screen) {
    startScreen.classList.add("hidden");
    cameraScreen.classList.add("hidden");
    reviewScreen.classList.add("hidden");
    stripScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}


/* =========================================================
   GENERAL WAIT FUNCTION
========================================================= */

function wait(milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, milliseconds);
    });
}


/* =========================================================
   FIND FUJIFILM X-T50
========================================================= */

async function findFujifilmCamera() {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {
        alert(
            "This browser does not support camera access."
        );

        return null;
    }


    /*
        First request temporary camera access.

        Safari may not reveal camera names
        until permission has been granted.
    */

    let temporaryStream = null;

    try {

        temporaryStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });

    } catch (error) {

        console.error(
            "Initial camera permission error:",
            error
        );

        alert(
            "Please allow camera access for this website."
        );

        return null;
    }


    /*
        Stop the temporary camera.

        We will reopen the specific
        camera after finding it.
    */

    temporaryStream
        .getTracks()
        .forEach(function(track) {
            track.stop();
        });


    /*
        Ask Safari what cameras are available.
    */

    let devices;

    try {

        devices =
            await navigator.mediaDevices.enumerateDevices();

    } catch (error) {

        console.error(
            "Could not list cameras:",
            error
        );

        alert(
            "The iPad could not list the available cameras."
        );

        return null;
    }


    /*
        Only look at video cameras.
    */

    const videoDevices =
        devices.filter(function(device) {

            return device.kind === "videoinput";

        });


    console.log(
        "Available cameras:"
    );

    videoDevices.forEach(function(device) {

        console.log(
            device.label,
            device.deviceId
        );

    });


    /*
        Search for Fujifilm / X-T50.

        Different systems may expose
        slightly different names, so we
        check several possibilities.
    */

    const fujifilmCamera =
        videoDevices.find(function(device) {

            const label =
                (device.label || "").toLowerCase();

            return (
                label.includes("x-t50") ||
                label.includes("xt50") ||
                label.includes("fujifilm") ||
                label.includes("fuji")
            );

        });


    /*
        If X-T50 was found,
        remember its device ID.
    */

    if (fujifilmCamera) {

        selectedCameraId =
            fujifilmCamera.deviceId;

        console.log(
            "FUJIFILM CAMERA FOUND:",
            fujifilmCamera.label
        );

        return fujifilmCamera;
    }


    /*
        X-T50 was not found.
    */

    console.log(
        "FUJIFILM CAMERA NOT FOUND."
    );

    let cameraList = "";

    videoDevices.forEach(function(device, index) {

        cameraList +=
            (index + 1) +
            ". " +
            (device.label || "Unnamed camera") +
            "\n";

    });


    alert(
        "The Fujifilm X-T50 was not detected by Safari.\n\n" +
        "Cameras Safari currently sees:\n\n" +
        cameraList +
        "\n\n" +
        "Make sure the X-T50 is connected by USB-C and " +
        "set to USB WEBCAM mode."
    );


    return null;
}


/* =========================================================
   START FUJIFILM CAMERA
========================================================= */

async function startCamera() {

    try {

        /*
            Find the X-T50.
        */

        const fujifilmCamera =
            await findFujifilmCamera();


        if (!fujifilmCamera) {

            return false;

        }


        /*
            Make sure any previous
            camera stream is stopped.
        */

        stopCamera();


        /*
            Open specifically the
            X-T50 camera.

            We use deviceId instead of
            facingMode so Safari does
            not choose the iPad camera.
        */

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    deviceId: {
                        exact: selectedCameraId
                    }
                },

                audio: false

            });


        /*
            Show X-T50 live view.
        */

        camera.srcObject =
            cameraStream;


        await camera.play();


        /*
            Verify which camera
            Safari actually opened.
        */

        const videoTrack =
            cameraStream.getVideoTracks()[0];


        const settings =
            videoTrack.getSettings();


        console.log(
            "Active camera:",
            settings
        );


        readyMessage.textContent =
            "FUJIFILM X-T50 READY";


        return true;


    } catch (error) {

        console.error(
            "Fujifilm camera error:",
            error
        );


        alert(
            "The Fujifilm X-T50 was found, " +
            "but Safari could not open it.\n\n" +
            "Make sure the camera is turned on, " +
            "USB WEBCAM mode is selected, and the " +
            "USB-C cable supports data."
        );


        return false;
    }
}


/* =========================================================
   STOP CAMERA
========================================================= */

function stopCamera() {

    if (cameraStream) {

        const tracks =
            cameraStream.getTracks();

        tracks.forEach(function(track) {

            track.stop();

        });

        cameraStream = null;
    }

    camera.srcObject = null;

    selectedCameraId = null;
}


/* =========================================================
   COUNTDOWN
========================================================= */

async function runCountdown() {

    readyMessage.textContent =
        "Get ready!";


    for (
        let number = COUNTDOWN_SECONDS;
        number > 0;
        number--
    ) {

        countdown.textContent =
            number;

        await wait(1000);

    }


    countdown.textContent =
        "";

    readyMessage.textContent =
        "Smile!";
}


/* =========================================================
   FLASH EFFECT
========================================================= */

async function triggerFlash() {

    flash.classList.add(
        "active"
    );

    await wait(150);

    flash.classList.remove(
        "active"
    );
}


/* =========================================================
   TAKE PHOTO FROM X-T50 VIDEO STREAM
========================================================= */

function takePhoto() {

    if (
        !camera.videoWidth ||
        !camera.videoHeight
    ) {

        console.error(
            "Camera is not ready."
        );

        return false;
    }


    /*
        Use the full resolution
        available from the video stream.
    */

    captureCanvas.width =
        camera.videoWidth;

    captureCanvas.height =
        camera.videoHeight;


    const context =
        captureCanvas.getContext("2d");


    /*
        Mirror the preview so
        the captured image matches
        the current booth behavior.
    */

    context.save();


    context.translate(
        captureCanvas.width,
        0
    );


    context.scale(
        -1,
        1
    );


    context.drawImage(
        camera,
        0,
        0,
        captureCanvas.width,
        captureCanvas.height
    );


    context.restore();


    /*
        Save with high JPEG quality.
    */

    const image =
        captureCanvas.toDataURL(
            "image/jpeg",
            0.95
        );


    photos.push(
        image
    );


    return true;
}


/* =========================================================
   PROGRESS BAR
========================================================= */

function updateProgress() {

    const percentage =
        (currentPhoto / TOTAL_PHOTOS) * 100;


    progressBar.style.width =
        percentage + "%";
}


/* =========================================================
   START PHOTO SESSION
========================================================= */

async function startPhotoSession() {

    photos = [];

    currentPhoto = 0;

    photoGrid.innerHTML = "";

    progressBar.style.width =
        "0%";


    showScreen(
        cameraScreen
    );


    /*
        Start the X-T50.
    */

    const cameraStarted =
        await startCamera();


    /*
        Stop if the X-T50
        could not be connected.
    */

    if (!cameraStarted) {

        showScreen(
            startScreen
        );

        return;
    }


    /*
        Give the camera a moment
        to stabilize.
    */

    await wait(1500);


    /*
        TAKE FOUR PHOTOS
    */

    for (
        let i = 0;
        i < TOTAL_PHOTOS;
        i++
    ) {

        currentPhoto =
            i + 1;


        photoNumber.textContent =
            "PHOTO " +
            currentPhoto +
            " OF " +
            TOTAL_PHOTOS;


        updateProgress();


        /*
            Countdown
        */

        await runCountdown();


        /*
            Flash effect
        */

        await triggerFlash();


        /*
            Capture image from
            X-T50 video stream
        */

        const photoTaken =
            takePhoto();


        if (!photoTaken) {

            alert(
                "The X-T50 was not ready to take the photo."
            );

            stopCamera();

            showScreen(
                startScreen
            );

            return;
        }


        readyMessage.textContent =
            "Photo taken!";


        await wait(1000);
    }


    /*
        Complete progress bar.
    */

    progressBar.style.width =
        "100%";


    readyMessage.textContent =
        "All photos taken!";


    await wait(800);


    /*
        Stop X-T50 connection.
    */

    stopCamera();


    /*
        Show review.
    */

    showReview();
}


/* =========================================================
   REVIEW PHOTOS
========================================================= */

function showReview() {

    photoGrid.innerHTML =
        "";


    photos.forEach(function(photo) {

        const image =
            document.createElement("img");


        image.src =
            photo;


        image.alt =
            "Photo booth picture";


        photoGrid.appendChild(
            image
        );

    });


    showScreen(
        reviewScreen
    );
}


/* =========================================================
   RETAKE PHOTOS
========================================================= */

function retakePhotos() {

    stopCamera();

    photos = [];

    currentPhoto = 0;

    photoGrid.innerHTML =
        "";


    startPhotoSession();
}


/* =========================================================
   CREATE PHOTO STRIP
========================================================= */

function createPhotoStrip() {

    if (
        photos.length !== TOTAL_PHOTOS
    ) {

        alert(
            "Please take all four photos first."
        );

        return;
    }


    /*
        4x6 inch paper at 300 DPI

        4 inches = 1200 pixels
        6 inches = 1800 pixels
    */

    const canvasWidth =
        1200;

    const canvasHeight =
        1800;


    stripCanvas.width =
        canvasWidth;

    stripCanvas.height =
        canvasHeight;


    const context =
        stripCanvas.getContext("2d");


    /*
        WHITE PAPER
    */

    context.fillStyle =
        "#ffffff";


    context.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    /*
        STRIP SETTINGS

        Each strip:
        Width = 520 px
        Height = 1680 px

        Side border:
        10 px

        Top border:
        20 px

        Bottom white space:
        300 px = 1 inch

        Photo gap:
        15 px
    */

    const stripWidth =
        520;

    const stripHeight =
        1680;

    const leftStripX =
        50;

    const rightStripX =
        630;

    const topMargin =
        60;

    const sideBorder =
        10;

    const topBorder =
        20;

    const bottomWhiteSpace =
        300;

    const photoGap =
        15;


    /*
        PHOTO WIDTH
    */

    const photoAreaX =
        leftStripX +
        sideBorder;


    const photoAreaWidth =
        stripWidth -
        (sideBorder * 2);


    /*
        PHOTO HEIGHT
    */

    const photoAreaHeight =
        stripHeight -
        topBorder -
        bottomWhiteSpace;


    const totalGapHeight =
        photoGap *
        (TOTAL_PHOTOS - 1);


    const totalPhotoHeight =
        photoAreaHeight -
        totalGapHeight;


    const photoHeight =
        totalPhotoHeight /
        TOTAL_PHOTOS;


    /*
        LEFT STRIP
    */

    for (
        let i = 0;
        i < TOTAL_PHOTOS;
        i++
    ) {

        const y =
            topMargin +
            topBorder +
            (i * (
                photoHeight +
                photoGap
            ));


        drawCoverImage(
            context,
            photos[i],
            photoAreaX,
            y,
            photoAreaWidth,
            photoHeight
        );
    }


    /*
        RIGHT STRIP
    */

    const rightPhotoAreaX =
        rightStripX +
        sideBorder;


    for (
        let i = 0;
        i < TOTAL_PHOTOS;
        i++
    ) {

        const y =
            topMargin +
            topBorder +
            (i * (
                photoHeight +
                photoGap
            ));


        drawCoverImage(
            context,
            photos[i],
            rightPhotoAreaX,
            y,
            photoAreaWidth,
            photoHeight
        );
    }


    /*
        DASHED CENTER
        CUTTING LINE
    */

    context.strokeStyle =
        "#999999";

    context.lineWidth =
        2;

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


    /*
        SHOW STRIP
    */

    showScreen(
        stripScreen
    );
}


/* =========================================================
   DRAW PHOTO WITHOUT DISTORTION
========================================================= */

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


    image.onload =
        function() {

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


            if (
                imageRatio >
                boxRatio
            ) {

                drawHeight =
                    height;


                drawWidth =
                    height *
                    imageRatio;


                offsetX =
                    x +
                    (width - drawWidth) / 2;


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
                    (height - drawHeight) / 2;
            }


            context.save();


            context.beginPath();


            context.rect(
                x,
                y,
                width,
                height
            );


            context.clip();


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


/* =========================================================
   PRINT
========================================================= */

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

            <meta charset="UTF-8">

            <title>
                4x6 Photo Booth Print
            </title>

            <style>

                @page {
                    size: 4in 6in;
                    margin: 0;
                }

                * {
                    box-sizing: border-box;
                }

                html,
                body {
                    width: 4in;
                    height: 6in;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    background: white;
                }

                body {
                    display: block;
                }

                img {
                    display: block;
                    width: 4in;
                    height: 6in;
                    margin: 0;
                    padding: 0;
                    object-fit: fill;
                }

            </style>

        </head>

        <body>

            <img
                src="${imageData}"
                alt="Photo Booth Print"
            >

            <script>

                window.onload = function() {

                    setTimeout(
                        function() {

                            window.focus();

                            window.print();

                        },
                        500
                    );

                };

            <\/script>

        </body>

        </html>
    `);


    printWindow.document.close();
}


/* =========================================================
   NEXT SESSION
========================================================= */

function nextSession() {

    stopCamera();


    photos = [];

    currentPhoto = 0;


    photoGrid.innerHTML =
        "";


    stripCanvas.width =
        1;

    stripCanvas.height =
        1;


    progressBar.style.width =
        "0%";


    countdown.textContent =
        "";


    photoNumber.textContent =
        "PHOTO 1 OF 4";


    readyMessage.textContent =
        "Get ready!";


    showScreen(
        startScreen
    );
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

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


/* =========================================================
   START ON HOME SCREEN
========================================================= */

showScreen(
    startScreen
);
