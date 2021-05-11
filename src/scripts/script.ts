let videoElem: HTMLVideoElement = document.querySelector("#video");

let fullscreenButton: HTMLButtonElement = document.querySelector("#fullscreen");
let videoModeSelect: HTMLSelectElement =
  document.querySelector("#videoMode select");
let snapshotButton: HTMLInputElement = document.querySelector("#snapshot");
let recordButton: HTMLInputElement = document.querySelector("#record");
let volumeInput: HTMLInputElement = document.querySelector("#volume input");
let resetSettingsButton: HTMLLinkElement = document.querySelector("#reset");

/* Video recording data */
let mediaRecorder: MediaRecorder;
let recordedBlobs = [];

/* Constraints to test devices for */
let testResolutions = [
  { width: { exact: 1920 }, height: { exact: 1080 } },
  { width: { exact: 1280 }, height: { exact: 720 } },
  { width: { exact: 640 }, height: { exact: 480 } },
];
let testFramerates = [{ exact: 60 }, { exact: 30 }, { exact: 25 }];

/* Store selected devices and supported constraints */
let videoDeviceId: string;
let audioDeviceId: string;
let supportedConstraints: MediaStreamConstraints[] = [];

/* The stream */
let stream: MediaStream;

/* Selected video settings */
let selectedModeIndex = 0;

/**
 * Ask the user to select devices for both audio and video input,
 * and store the devices' IDs for later use.
 */
async function askForDevices() {
  return navigator.mediaDevices
    .getUserMedia({ audio: true, video: true })
    .then((stream) => {
      let videoTrack = stream.getVideoTracks()[0];
      videoDeviceId = videoTrack.getSettings().deviceId;

      let audioTrack = stream.getAudioTracks()[0];
      audioDeviceId = audioTrack.getSettings().deviceId;
    });
}

/**
 * Test the user selected devices with all combinations of constraints
 * defined above (resolutions, framerates etc).
 * If getUserMedia resolves, then the constraint is supported -
 * it will then be added to the supportedConstraints array.
 */
async function findSupportedConstraints() {
  for (let resolutionConstraint of testResolutions) {
    for (let framerateConstraint of testFramerates) {
      const constraints: MediaStreamConstraints = {
        video: {
          ...resolutionConstraint,
          frameRate: framerateConstraint,
          deviceId: { exact: videoDeviceId },
        },
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          deviceId: { exact: audioDeviceId },
        },
      };

      await navigator.mediaDevices
        .getUserMedia(constraints)
        .then(() => {
          supportedConstraints.push(constraints);
        })
        .catch((e) => {
          console.log(
            `Device doesnt support ${constraints.video.width.exact}x${constraints.video.height.exact}@${constraints.video.frameRate.exact}`
          );
        });
    }
  }
}

/**
 * Store the device IDs, as well as the supported constraints in local storage
 */
async function storeDeviceSettings() {
  window.localStorage.setItem(
    "settings",
    JSON.stringify({ audioDeviceId, videoDeviceId, supportedConstraints })
  );
}

/**
 * Load the device IDs, as well as the supported constraints from local storage
 */
async function loadDeviceSettings() {
  let settingsString = window.localStorage.getItem("settings");

  if (settingsString) {
    ({ audioDeviceId, videoDeviceId, supportedConstraints } =
      JSON.parse(settingsString));
  }
}

/**
 * Request a stream from the selected devices, and show it in the video element.
 * Also sets up a new MediaRecorder to be able to record the stream if desired.
 */
async function loadStream() {
  return navigator.mediaDevices
    .getUserMedia(supportedConstraints[selectedModeIndex])
    .then((stream) => {
      stream = stream;
      videoElem.srcObject = stream;

      setupMediaRecorder(stream);
    })
    .catch((e) => alert(e.message));
}

/**
 * Handy method to restart the stream, e.g. when selecting a new video mode.
 * Will stop all stream tracks and recall loadStream().
 */
async function restartStream() {
  videoElem.srcObject = null;
  if (!!stream) stream.getTracks().map((t) => t.stop());

  await loadStream();
}

/**
 * Load the supported constraints into the inputs, so that the user can choose
 * a mode to their liking.
 */
async function fillInputs() {
  supportedConstraints.forEach((constraint, i) => {
    const modeText = `${constraint.video.width.exact}x${constraint.video.height.exact}@${constraint.video.frameRate.exact}`;

    videoModeSelect.options[i] = new Option(modeText, i);
  });
}

(async () => {
  // on first load ask for devices to use, test their capabilities,
  // and store the info in local storage
  const firstTimeSetup = () =>
    askForDevices()
      .then(() => findSupportedConstraints())
      .then(() => storeDeviceSettings());

  // on every other load, load the settings from local storage, load the stream
  // with the stored devices and settings, and fill up the inputs with the supported modes.
  const streamSetup = () =>
    loadDeviceSettings()
      .then(() => loadStream())
      .then(() => fillInputs());

  // only do first time setup if no settings are stored.
  if (!window.localStorage.getItem("settings")) {
    return firstTimeSetup().then(() => streamSetup());
  } else {
    return streamSetup();
  }
})();

/**
 * Create a screenshot from the currently playing stream
 * and download it.
 */
function createScreenshot() {
  const canvas = document.createElement("canvas");
  canvas.width = videoElem.videoWidth;
  canvas.height = videoElem.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoElem, 0, 0);

  download(canvas.toDataURL("image/png"), `screenshot_${+new Date()}.png`);
}

/**
 * Convenience function to download a given data or blob URL with a given file name.
 * @param url the data/blob URL to download
 * @param fileName the filename to give to the downloaded file
 */
function download(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Sets up a new MediaRecorder for the given stream,
 * and defines it's data handler.
 * @param stream
 */
function setupMediaRecorder(stream) {
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm",
    videoBitsPerSecond: 8000000,
  });

  mediaRecorder.ondataavailable = (evt) => {
    if (evt.data.size > 0) {
      recordedBlobs.push(evt.data);
    }
  };
}

/**
 * Starts the media recorder with a fresh stream
 */
function startRecording() {
  recordedBlobs = [];
  mediaRecorder.start(500);
}

/**
 * Stops the media recorder and downloads the file
 */
function stopRecording() {
  mediaRecorder.stop();

  var blob = new Blob(recordedBlobs, {
    type: "video/webm",
  });

  download(URL.createObjectURL(blob), `recording_${+new Date()}.png`);
}

// On changing the video mode, update selectedModeIndex and restart the stream
videoModeSelect.addEventListener("change", (event) => {
  selectedModeIndex = (event.target as HTMLSelectElement).selectedIndex;
  restartStream();
});

// On fullscreen button click, go fullscreen ;)
fullscreenButton.addEventListener("click", () => {
  videoElem.requestFullscreen();
});

// Also enter and leave fullscreen when double clicking the video
videoElem.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) {
    videoElem.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Take a screenshot when clicking the screenshot button
snapshotButton.addEventListener("click", createScreenshot);

// Start and stop the recording using the record button.
recordButton.addEventListener("click", () => {
  if (mediaRecorder?.state !== "recording") {
    startRecording();
    recordButton.classList.add("recording");
  } else {
    stopRecording();
    recordButton.classList.remove("recording");
  }
});

// Adjust the video volume when the volume slider value changes
volumeInput.addEventListener("input", (event) => {
  videoElem.volume = parseFloat((event.target as HTMLInputElement).value);
});

// Allow resetting settings
resetSettingsButton.addEventListener("click", () => {
  window.localStorage.clear();
  window.location.reload();
});
