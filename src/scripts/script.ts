let videoElem: HTMLVideoElement = document.querySelector("#video");

let fullscreenButton: HTMLButtonElement = document.querySelector("#fullscreen");
let videoModeSelect: HTMLSelectElement = document.querySelector(
  "#videoMode select"
);
let snapshotButton: HTMLInputElement = document.querySelector("#snapshot");
let volumeInput: HTMLInputElement = document.querySelector("#volume input");

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
    .catch((e) => alert(e.message));
}

async function restartStream() {
  videoElem.srcObject = null;
  if (!!stream) stream.getTracks().map((t) => t.stop());

  await loadStream();
}

async function fillInputs() {
  supportedConstraints.forEach((constraint, i) => {
    const modeText = `${constraint.video.width.exact}x${constraint.video.height.exact}@${constraint.video.frameRate.exact}`;

    videoModeSelect.options[i] = new Option(modeText, i);
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

videoModeSelect.addEventListener("change", (event) => {
  selectedModeIndex = (event.target as HTMLSelectElement).selectedIndex;
  restartStream();
});

fullscreenButton.addEventListener("click", () => {
  videoElem.requestFullscreen();
});

snapshotButton.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = videoElem.videoWidth;
  canvas.height = videoElem.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoElem, 0, 0);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `screenshot_${+new Date()}.png`;
  link.click();
});

videoElem.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) {
    videoElem.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// volumeInput.addEventListener("input", (event) => {
//   videoElem.volume = parseFloat((event.target as HTMLInputElement).value);
// });
