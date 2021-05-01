let videoElem = document.querySelector("#video");

let fullscreenButton = document.querySelector("#fullscreen");
let resolutionInput = document.querySelector("#videoResolution");
let framerateInput = document.querySelector("#videoFramerate");

let currentResolutionSpan = document.querySelector("#currentResolution");
let currentFramerateSpan = document.querySelector("#currentFramerate");

let stream;

let constraints = {
  resolution: [
    {
      width: { exact: 1920 },
      height: { exact: 1080 },
    },
    {
      width: { exact: 1280 },
      height: { exact: 720 },
    },
  ],
  framerates: [
    { max: 60 },
    { max: 30 },
    { max: 25 },
    // { max: 20 },
    // { max: 10 },
    // { max: 5 },
  ],
};

let selectedResolution = 0,
  selectedFramerate = 0;

fillInputs();
updateStream();

async function updateStream() {
  return navigator.mediaDevices
    .getUserMedia({
      video: {
        ...constraints.resolution[selectedResolution],
        frameRate: constraints.framerates[selectedFramerate],
      },
      audio: {
        echoCancellation: false,
        autoGainControl: false,
        noiseCancellation: false,
      },
    })
    .then((stream) => {
      stream = stream;
      videoElem.srcObject = stream;

      let streamConstraints = stream.getVideoTracks()[0].getConstraints();
      console.log(stream.getVideoTracks()[0]);

      console.log({ stream, streamConstraints });

      currentResolutionSpan.textContent = `${streamConstraints.width.exact}x${streamConstraints.height.exact}`;
      currentFramerateSpan.textContent = `${streamConstraints.frameRate.max}fps`;
    })
    .catch((e) => {
      console.error(e);
    });
}

function fillInputs() {
  constraints.resolution.forEach((constraint, i) => {
    resolutionInput.options[i] = new Option(
      `${constraint.width.exact}x${constraint.height.exact}`,
      constraint.width.exact
    );
  });

  constraints.framerates.forEach((constraint, i) => {
    framerateInput.options[i] = new Option(
      `${constraint.max}fps`,
      constraint.max
    );
  });
}

resolutionInput.addEventListener("change", (event) => {
  selectedResolution = event.target.selectedIndex;
  updateStream();
});

framerateInput.addEventListener("change", (event) => {
  selectedFramerate = event.target.selectedIndex;
  updateStream();
});

fullscreenButton.addEventListener("click", (event) => {
  videoElem.requestFullscreen();
});

videoElem.onstalled = function (e) {
  console.log(e);
};
