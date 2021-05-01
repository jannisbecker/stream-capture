let videoElem = document.querySelector("#video");
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
  framerates: [60, 30, 25, 20, 10, 5],
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

      currentResolutionSpan.textContent = `${streamConstraints.width.exact}x${streamConstraints.height.exact}`;
    })
    .catch((e) => {
      console.error(e);
    });
}

function fillInputs() {
  constraints.resolution.forEach((constraint, i) => {
    resolutionInput.options[i] = new Option(
      `${constraint.width.exact}x${constraint.height.exact}`,
      i
    );
  });

  constraints.framerates.forEach((framerate, i) => {
    framerateInput.options[i] = new Option(`${framerate}fps`, framerate);
  });
}

resolutionInput.addEventListener("change", (event) => {
  selectedResolution = event.target.value;
  updateStream();
});

framerateInput.addEventListener("change", (event) => {
  selectedFramerate = event.target.value;
  updateStream();
});
