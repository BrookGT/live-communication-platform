console.log("Live Communication Platform");
const startButton = document.getElementById("connectionBtn");
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

socket.on("candidate", (candidate) => {
  console.log("on candidate", candidate);
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .then((state) => {})
    .catch((error) => {});
});

socket.on("join", async (candidate) => {
  console.log("on candidate", candidate);
  await startWebRTC();
});

socket.on("peerDisconnected", (roomId) => {
  console.log("roomClosed", roomId);
});

async function createRoom(roomId) {
  socket.emit("join", roomId);
}

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

// Gracefully disconnect the current WebRTC session
function disconnectWebRTC() {
  try {
    // Stop and clear local media
    const localStream = localVideo && localVideo.srcObject;
    if (localStream && typeof localStream.getTracks === "function") {
      localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
    }
    if (localVideo) {
      localVideo.srcObject = null;
    }

    // Stop and clear remote media
    const remoteStream = remoteVideo && remoteVideo.srcObject;
    if (remoteStream && typeof remoteStream.getTracks === "function") {
      remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
    }
    if (remoteVideo) {
      remoteVideo.srcObject = null;
    }

    // Tear down RTCPeerConnection
    if (typeof peerConnection !== "undefined" && peerConnection) {
      try {
        // Stop and remove all senders/tracks
        peerConnection.getSenders().forEach((sender) => {
          try {
            sender.track && sender.track.stop();
          } catch (e) {}
          try {
            peerConnection.removeTrack(sender);
          } catch (e) {}
        });
        // Stop transceivers if supported
        if (typeof peerConnection.getTransceivers === "function") {
          peerConnection.getTransceivers().forEach((transceiver) => {
            try {
              transceiver.stop && transceiver.stop();
            } catch (e) {}
          });
        }
        // Clear event handlers
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.onnegotiationneeded = null;
        peerConnection.onsignalingstatechange = null;
        // Close the connection
        if (peerConnection.signalingState !== "closed") {
          peerConnection.close();
        }
      } catch (err) {
        console.error("Error while closing RTCPeerConnection:", err);
      }
    }

    // Optionally notify the other side via signaling (no-op if not handled server-side)
    try {
      socket && socket.emit && socket.emit("hangup");
    } catch (e) {}

    console.log("WebRTC connection disconnected");
  } catch (error) {
    console.error("Failed to disconnect WebRTC:", error);
  }
}

// Expose for UI to call (e.g., from a hangup button)
window.disconnectWebRTC = disconnectWebRTC;
