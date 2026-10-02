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


function showScreen(screen) {
    startScreen.classList.add("hidden");
    cameraScreen.classList.add("hidden");
    reviewScreen.classList.add("hidden");
    stripScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}


function wait(milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, milliseconds);
    });
}


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


async function triggerFlash() {
    flash.classList.add("active");

    await wait(150);

    flash.classList.remove("active");
}


function takePhoto() {
    if (!camera.videoWidth || !camera.videoHeight) {
        console.error("Camera is not ready.");
        return;
    }

    captureCanvas.width = camera.videoWidth;
    captureCanvas.height = camera.videoHeight;

    const context =
        captureCanvas.getContext("2d");

    context.save();

    /*
        Normal 1.00 camera view.
        No digital cropping.
        The full iPad camera image
        is captured.
    */

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
            0.95
        );

    photos.push(image);
}


function updateProgress() {
    const percentage =
        (currentPhoto / TOTAL_PHOTOS) * 100;

    progressBar.style.width =
        percentage + "%";
}


async function startPhotoSession() {
    photos = [];
    currentPhoto = 0;

    photoGrid.innerHTML = "";

    progressBar.style.width = "0%";

    showScreen(cameraScreen);

    await startCamera();

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


function retakePhotos() {
    photos = [];

    currentPhoto = 0;

    photoGrid.innerHTML = "";

    startPhotoSession();
}


function createPhotoStrip() {
    if (photos.length !== TOTAL_PHOTOS) {
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

    const canvasWidth = 1200;
    const canvasHeight = 1800;

    stripCanvas.width = canvasWidth;
    stripCanvas.height = canvasHeight;

    const context =
        stripCanvas.getContext("2d");


    /*
        WHITE PAPER BACKGROUND
    */

    context.fillStyle = "#ffffff";

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

        White outside border:
        10 px left
        10 px right
        20 px top

        Bottom white space:
        300 px = 1 inch

        Gap between photos:
        15 px

        The photos are made
        slightly larger by
        reducing the side border.
    */

    const stripWidth = 520;

    const stripHeight = 1680;

    const leftStripX = 50;

    const rightStripX = 630;

    const topMargin = 60;

    const sideBorder = 10;

    const topBorder = 20;

    const bottomWhiteSpace = 300;

    const photoGap = 15;


    /*
        PHOTO AREA
    */

    const photoAreaX =
        leftStripX +
        sideBorder;

    const photoAreaWidth =
        stripWidth -
        (sideBorder * 2);


    /*
        PHOTO HEIGHT

        Keep a full 1-inch
        white section at
        the bottom.
    */

    const photoAreaHeight =
        stripHeight -
        topBorder -
        bottomWhiteSpace;


    /*
        Calculate the total
        space used by the
        three photo gaps.
    */

    const totalGapHeight =
        photoGap *
        (TOTAL_PHOTOS - 1);


    /*
        Calculate the space
        available for the
        actual photos.
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
            (i * (photoHeight + photoGap));


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
            (i * (photoHeight + photoGap));


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


    /*
        SHOW FINISHED STRIP
    */

    showScreen(stripScreen);
}


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


        if (imageRatio > boxRatio) {

            drawHeight = height;

            drawWidth =
                height *
                imageRatio;

            offsetX =
                x +
                (width - drawWidth) / 2;

            offsetY = y;

        } else {

            drawWidth = width;

            drawHeight =
                width /
                imageRatio;

            offsetX = x;

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


    image.src = imageSource;
}


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


function nextSession() {

    stopCamera();

    photos = [];

    currentPhoto = 0;

    photoGrid.innerHTML = "";


    stripCanvas.width = 1;

    stripCanvas.height = 1;


    progressBar.style.width = "0%";

    countdown.textContent = "";

    photoNumber.textContent =
        "PHOTO 1 OF 4";

    readyMessage.textContent =
        "Get ready!";


    showScreen(startScreen);
}


/*
    BUTTON EVENTS
*/

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


/*
    START ON HOME SCREEN
*/

showScreen(startScreen);
