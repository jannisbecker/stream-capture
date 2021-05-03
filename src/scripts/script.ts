let videoElem: HTMLVideoElement = document.querySelector("#video");
let fullscreenButton: HTMLButtonElement = document.querySelector("#fullscreen");
let videoModeInput: HTMLSelectElement = document.querySelector("#videoMode");
let volumeInput: HTMLInputElement = document.querySelector("#volume");

let testResolutions = [
  { width: { exact: 1920 }, height: { exact: 1080 } },
  { width: { exact: 1280 }, height: { exact: 720 } },
  { width: { exact: 640 }, height: { exact: 480 } },
];
let testFramerates = [{ exact: 60 }, { exact: 30 }, { exact: 25 }];

let videoDeviceId: string;
let audioDeviceId: string;
let supportedConstraints: MediaStreamConstraints[] = [];

let stream: MediaStream;
let selectedModeIndex = 0;

/*
  if device ids and constraints not in localstorage
  - ask for any device with minimal constraints
  - grab device ids
  - search for capabilities of these devices
  - push device ids and capabilities to localstorage

  get constraints and device ids from localstorage
  fill inputs with supported constraints
  ask for devices by ids and first supported constraint

  // have single select that shows framerate@fps
  // have button to enter fullscreen, volume slider, screenshot and change device (clears localstorage and reloads)
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

async function storeDeviceSettings() {
  window.localStorage.setItem(
    "settings",
    JSON.stringify({ audioDeviceId, videoDeviceId, supportedConstraints })
  );
}

async function loadDeviceSettings() {
  let settingsString = window.localStorage.getItem("settings");

  if (settingsString) {
    ({ audioDeviceId, videoDeviceId, supportedConstraints } = JSON.parse(
      settingsString
    ));
  }
}

async function loadStream() {
  return navigator.mediaDevices
    .getUserMedia(supportedConstraints[selectedModeIndex])
    .then((stream) => {
      stream = stream;
      videoElem.srcObject = stream;
    })
    .catch(console.log);
}

async function restartStream() {
  videoElem.srcObject = null;
  if (!!stream) stream.getTracks().map((t) => t.stop());

  await loadStream();
}

async function fillInputs() {
  supportedConstraints.forEach((constraint, i) => {
    const modeText = `${constraint.video.width.exact}x${constraint.video.height.exact}@${constraint.video.frameRate.exact}`;

    videoModeInput.options[i] = new Option(modeText, i);
  });
}

(async () => {
  const firstTimeSetup = () =>
    askForDevices()
      .then(() => findSupportedConstraints())
      .then(() => storeDeviceSettings());

  const streamSetup = () =>
    loadDeviceSettings()
      .then(() => loadStream())
      .then(() => fillInputs());

  if (!window.localStorage.getItem("settings")) {
    return firstTimeSetup().then(() => streamSetup());
  } else {
    return streamSetup();
  }
})();

videoModeInput.addEventListener("change", (event) => {
  selectedModeIndex = (event.target as HTMLSelectElement).selectedIndex;
  restartStream();
});

fullscreenButton.addEventListener("click", () => {
  videoElem.requestFullscreen();
});

videoElem.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) {
    videoElem.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

volumeInput.addEventListener("input", (event) => {
  videoElem.volume = parseFloat((event.target as HTMLInputElement).value);
});
