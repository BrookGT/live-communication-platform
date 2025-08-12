console.log("Live Communication Platform");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const socket = io("ws://127.0.0.1:3000");
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:freestun.net:3478" },
    { urls: "stun:openrelay.metered.ca:80" },
    { urls: "stun:stunserver2024.stunprotocol.org:3478" },
  ],
  iceTransportPolicy: "all",
});

socket.on("connect", () => {
  console.log("Connected to server", socket.id);
});

async function startWebRTC() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  stream.getTracks().forEach((track) => {
    console.log("Track", track);
    if (track.kind === "video") {
      localVideo.srcObject = stream;
    }
    // pc.addTrack(track, stream);
  });

  peerConnection.ontrack = (event) => {
    console.log("ontrack", event);
    event.streams.forEach((stream) => {
      remoteStream = stream;
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          console.log("track ended");
        };
      });
    });
  };

  peerConnection.oniceconnectionstatechange = (event) => {
    console.log("ICE Connection State Change", event);
  };

  peerConnection.onicecandidate = (event) => {
    console.log("ICE Candidate", event);
  };

  peerConnection.oniceconnectionstatechange = (event) => {
    console.log("ICE Connection State Change", event);
  };
}

startButton.addEventListener("click", async () => {
  startWebRTC();
});
