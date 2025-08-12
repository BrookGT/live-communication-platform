console.log("Live Communication Platform");
const startButton = document.getElementById("connectionBtn");
const peerIdInput = document.getElementById("peerIdInput");
const stopButton = document.getElementById("stopButton");
const muteButton = document.getElementById("muteButton");
const unmuteButton = document.getElementById("unmuteButton");
const hangupButton = document.getElementById("hangupButton");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

disableButtons();

// Prefer same-origin Socket.IO connection so protocol/host/port match (avoids mixed content and cert mismatch)
const socket = io();
let stream;
let isStarted = false;
let peerConnection = new RTCPeerConnection({
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

socket.on("offer", async (offer) => {
  console.log("on offer", offer);
  if (!isStarted) {
    await startWebRTC();
  }
  peerConnection.setRemoteDescription(offer);
  if (!isStarted) {
    peerConnection.createAnswer().then((answer) => {
      peerConnection.setLocalDescription(answer);
      socket.emit("offer", { type: answer.type, sdp: answer.sdp });
    });
  }
});

socket.on("candidate", (candidate) => {
  console.log("on candidate", candidate);
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .then((state) => {})
    .catch((error) => {});
});

socket.on("join", async (peer) => {
  console.log("on Join", peer);
  isStarted = true;
  await startWebRTC(isStarted);
});

socket.on("peerDisconnected", (roomId) => {
  console.log("roomClosed", roomId);
});

async function createRoom(roomId) {
  socket.emit("join", roomId);
}

async function initRoom() {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  stream.getTracks().forEach((track) => {
    if (track.kind === "video") {
      localVideo.srcObject = stream;
    }
  });
}

async function startWebRTC(isStarted = false) {
  stream.getTracks().forEach((track) => {
    console.log("Track", track);
    if (track.kind === "video") {
      localVideo.srcObject = stream;
    }
    peerConnection.addTrack(track, stream);
  });

  if (isStarted) {
    // Create offer
    peerConnection.createOffer().then((offer) => {
      console.log("offer", offer);
      peerConnection.setLocalDescription(offer);
      socket.emit("offer", { type: offer.type, sdp: offer.sdp });
    });
  }

  peerConnection.ontrack = (event) => {
    console.log("ontrack", event);
    event.streams.forEach((stream) => {
      remoteStream = stream;
      remoteVideo.srcObject = stream;
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
  if (peerIdInput.value) {
    socket.emit("join", peerIdInput.value);
    startButton.disabled = true;
    startButton.textContent = "Waiting for connection...";
  } else {
    alert("Please enter room id");
  }
});

function disableButtons() {
  startButton.disabled = true;
}

function enableButtons() {
  startButton.disabled = false;
}

initRoom();
