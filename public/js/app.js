console.log("Live Communication Platform");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const muteButton = document.getElementById("muteButton");
const unmuteButton = document.getElementById("unmuteButton");
const hangupButton = document.getElementById("hangupButton");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

disableButtons();

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
  startButton.disabled = false;
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
    peerConnection.addTrack(track, stream);
  });

  // Create offer
  peerConnection.createOffer().then((offer) => {
    console.log("offer", offer);
    peerConnection.setLocalDescription(offer);
    socket.emit("offer", { type: offer.type, sdp: offer.sdp });
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
    if (event.candidate) {
      console.log("candidate", event.candidate);
      socket.emit("candidate", {
        candidate: event.candidate.candidate,
        sdpMid: "0",
        sdpMLineIndex: 0,
      });
    }
  };

  peerConnection.oniceconnectionstatechange = (event) => {
    console.log("ICE Connection State Change", event);
  };
}

startButton.addEventListener("click", async () => {
  startWebRTC();
});

function disableButtons() {
  startButton.disabled = true;
  stopButton.disabled = true;
  muteButton.disabled = true;
  unmuteButton.disabled = true;
  hangupButton.disabled = true;
}

function enableButtons() {
  startButton.disabled = false;
  stopButton.disabled = true;
  muteButton.disabled = false;
  unmuteButton.disabled = false;
  hangupButton.disabled = false;
}
