const TOTAL_PHOTOS = 4;
const COUNTDOWN_SECONDS = 3;

let photos = [];
let currentPhoto = 0;
let cameraStream = null;

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
   SCREEN MANAGEMENT
========================================================= */

function showScreen(screen) {
    startScreen.classList.add("hidden");
    cameraScreen.classList.add("hidden");
    reviewScreen.classList.add("hidden");
    stripScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}


/* =========================================================
   WAIT
========================================================= */

function wait(milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, milliseconds);
    });
}


/* =========================================================
   CAMERA
========================================================= */

async function startCamera() {

    try {

        /*
            First request camera permission.

            We intentionally do not specify
            facingMode here because we want to
            inspect the cameras available to Safari.
        */

        let permissionStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });


        /*
            Stop the temporary stream.
            We only needed it to unlock the
            camera device information.
        */

        permissionStream
            .getTracks()
            .forEach(function(track) {
                track.stop();
            });


        /*
            Get all cameras available to
            the browser.
        */

        const devices =
            await navigator.mediaDevices.enumerateDevices();


        const videoDevices =
            devices.filter(function(device) {
                return device.kind === "videoinput";
            });


        console.log(
            "Available cameras:",
            videoDevices
        );


        /*
            Try to find a normal front-facing
            camera instead of a wide-angle camera.

            Safari/iPad does not always provide
            useful camera labels, so we use the
            available device information when possible.
        */

        let selectedCamera = null;


        /*
            Look for a camera whose label suggests
            it is the normal/front camera.

            Avoid labels containing:
            - Ultra Wide
            - Wide
            - 0.5x
            - Ultrawide
        */

        selectedCamera =
            videoDevices.find(function(device) {

                const label =
                    device.label.toLowerCase();

                const isWide =
                    label.includes("ultra wide") ||
                    label.includes("ultrawide") ||
                    label.includes("wide") ||
                    label.includes("0.5");

                const isFront =
                    label.includes("front") ||
                    label.includes("facetime") ||
                    label.includes("user");

                return isFront && !isWide;
            });


        /*
            If no clearly labeled normal front
            camera was found, look for any camera
            that does not appear to be wide-angle.
        */

        if (!selectedCamera) {

            selectedCamera =
                videoDevices.find(function(device) {

                    const label =
                        device.label.toLowerCase();

                    return !(
                        label.includes("ultra wide") ||
                        label.includes("ultrawide") ||
                        label.includes("wide") ||
                        label.includes("0.5")
                    );
                });
        }


        /*
            If Safari only exposes one camera,
            use that camera.
        */

        if (!selectedCamera && videoDevices.length > 0) {

            selectedCamera =
                videoDevices[0];
        }


        /*
            Build the camera settings.
        */

        let cameraSettings = {

            width: {
                ideal: 1920
            },

            height: {
                ideal: 1080
            }
        };


        /*
            If we found a specific camera,
            use its deviceId.
        */

        if (
            selectedCamera &&
            selectedCamera.deviceId
        ) {

            cameraSettings.deviceId = {
                exact: selectedCamera.deviceId
            };
        }


        /*
            Start the selected camera.
        */

        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: cameraSettings,
                audio: false
            });


        camera.srcObject =
            cameraStream;


        await camera.play();


        /*
            Get the actual video track.
        */

        const videoTrack =
            cameraStream.getVideoTracks()[0];


        console.log(
            "Selected camera:",
            videoTrack.getSettings()
        );


        /*
            Try to force the camera to
            normal 1× zoom.

            This only runs if the iPad/Safari
            exposes zoom controls.
        */

        if (
            videoTrack &&
            typeof videoTrack.getCapabilities === "function"
        ) {

            const capabilities =
                videoTrack.getCapabilities();


            if (capabilities.zoom) {

                console.log(
                    "Camera zoom capabilities:",
                    capabilities.zoom
                );


                /*
                    1.0 means normal zoom.
                */

                let normalZoom = 1.0;


                /*
                    Make sure 1× is within the
                    camera's available range.
                */

                if (
                    normalZoom >= capabilities.zoom.min &&
                    normalZoom <= capabilities.zoom.max
                ) {

                    try {

                        await videoTrack.applyConstraints({
                            advanced: [
                                {
                                    zoom: normalZoom
                                }
                            ]
                        });

                        console.log(
                            "Camera set to normal 1× zoom."
                        );

                    } catch (zoomError) {

                        console.log(
                            "Could not manually set zoom:",
                            zoomError
                        );
                    }
                }
            }
        }

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        alert(
            "The camera could not be accessed. " +
            "Please allow camera access and try again."
        );
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
   FLASH
========================================================= */

async function triggerFlash() {

    flash.classList.add("active");


    await wait(150);


    flash.classList.remove("active");
}


/* =========================================================
   TAKE PHOTO
========================================================= */

function takePhoto() {

    if (
        !camera.videoWidth ||
        !camera.videoHeight
    ) {

        console.error(
            "Camera is not ready."
        );

        return;
    }


    /*
        Use the complete camera image.

        No digital crop.
        No artificial zoom.
        Normal 1.00 image.
    */

    captureCanvas.width =
        camera.videoWidth;

    captureCanvas.height =
        camera.videoHeight;


    const context =
        captureCanvas.getContext("2d");


    context.save();


    /*
        Mirror the photo so it matches
        the front-facing preview.
    */

    context.translate(
        captureCanvas.width,
        0
    );


    context.scale(
        -1,
        1
    );


    /*
        Draw the entire camera image.
    */

    context.drawImage(
        camera,
        0,
        0,
        captureCanvas.width,
        captureCanvas.height
    );


    context.restore();


    /*
        High-quality JPEG.
    */

    const image =
        captureCanvas.toDataURL(
            "image/jpeg",
            0.95
        );


    photos.push(image);
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
   PHOTO SESSION
========================================================= */

async function startPhotoSession() {

    photos = [];

    currentPhoto = 0;


    photoGrid.innerHTML =
        "";


    progressBar.style.width =
        "0%";


    showScreen(
        cameraScreen
    );


    await startCamera();


    await wait(1000);


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


        await runCountdown();


        await triggerFlash();


        takePhoto();


        readyMessage.textContent =
            "Photo taken!";


        await wait(1000);
    }


    progressBar.style.width =
        "100%";


    readyMessage.textContent =
        "All photos taken!";


    await wait(800);


    stopCamera();


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
   RETAKE
========================================================= */

function retakePhotos() {

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
        WHITE PAPER BACKGROUND
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

        Two identical strips.

        Each strip:
        Width = 520 px
        Height = 1680 px

        White side border:
        10 px

        White top border:
        20 px

        Bottom white space:
        300 px = exactly 1 inch

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


    /*
        THREE GAPS BETWEEN
        FOUR PHOTOS
    */

    const totalGapHeight =
        photoGap *
        (TOTAL_PHOTOS - 1);


    /*
        TOTAL SPACE AVAILABLE
        FOR FOUR PHOTOS
    */

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
            (
                i *
                (
                    photoHeight +
                    photoGap
                )
            );


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
            (
                i *
                (
                    photoHeight +
                    photoGap
                )
            );


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
        DASHED CENTER CUTTING LINE
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
   DRAW PHOTO
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
                    (
                        width -
                        drawWidth
                    ) / 2;


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
                    (
                        height -
                        drawHeight
                    ) / 2;
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

                window.onload =
                    function() {

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
