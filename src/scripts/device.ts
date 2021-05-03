export type MediaDevicePair = {
  audioDeviceId?: string;
  videoDeviceId?: string;
};

export async function requestDevices(
  requestAudioDevice: boolean = true,
  requestVideoDevice: boolean = true
): Promise<MediaDevicePair> {
  return navigator.mediaDevices
    .getUserMedia({ audio: requestAudioDevice, video: requestVideoDevice })
    .then((stream) => {
      return {
        ...(requestAudioDevice && {
          audioDeviceId: stream.getAudioTracks()[0].getSettings().deviceId,
        }),
        ...(requestVideoDevice && {
          videoDeviceId: stream.getVideoTracks()[0].getSettings().deviceId,
        }),
      };
    });
}

export class DeviceTest {
  private constraints: MediaStreamConstraints[] = [];

  constructor(private devices: MediaDevicePair) {
    if (!devices.audioDeviceId && !devices.videoDeviceId)
      throw Error("You must pass at least one ID of a device to test for.");
  }

  addConstraints(constraintsList: MediaStreamConstraints[]): this {
    this.constraints.push(
      constraintsList.map((constraint) => {
        return {
          ...constraint,
          ...(audioDeviceId && {
            audio: { deviceId: { exact: audioDeviceId } },
          }),
          ...(videoDeviceId && {
            video: { deviceId: { exact: videoDeviceId } },
          }),
        } as MediaStreamConstraints;
      })
    );

    return this;
  }

  addResolutions(resolutionsList: [number, number][]): this {}

  addFramerates(frameratesList: number[]): this {}

  async test(): Promise<MediaStreamConstraints[]> {}
}
