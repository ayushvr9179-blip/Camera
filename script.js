(() => {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const hostIdFromUrl = params.get("join");

  const status = $("status");
  const viewerPanel = $("viewerPanel");
  const guestPanel = $("guestPanel");
  const errorPanel = $("errorPanel");
  const remoteVideo = $("remoteVideo");
  const localVideo = $("localVideo");
  const videoPlaceholder = $("videoPlaceholder");
  const guestPlaceholder = $("guestPlaceholder");
  const shareUrl = $("shareUrl");
  const copyBtn = $("copyBtn");
  const startBtn = $("startBtn");
  const stopBtn = $("stopBtn");
  const endBtn = $("endBtn");
  const guestMessage = $("guestMessage");

  let peer = null;
  let localStream = null;
  let activeCall = null;
  let ended = false;

  function setStatus(text) { status.textContent = text; }
  function showError(message) {
    viewerPanel.classList.add("hidden");
    guestPanel.classList.add("hidden");
    errorPanel.classList.remove("hidden");
    $("errorText").textContent = message;
    setStatus("Connection error");
  }
  function makePeer() {
    return new Peer(undefined, { debug: 0 });
  }
  function stopLocalCamera() {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    localVideo.srcObject = null;
    guestPlaceholder.classList.remove("hidden");
    stopBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
    guestMessage.textContent = "Camera sharing is off.";
  }
  function stopViewer() {
    if (activeCall) {
      try { activeCall.close(); } catch (_) {}
      activeCall = null;
    }
    remoteVideo.srcObject = null;
    videoPlaceholder.classList.remove("hidden");
  }

  if (!window.Peer) {
    showError("The connection library could not load. Check your internet connection and refresh.");
    return;
  }

  if (hostIdFromUrl) {
    // Guest mode: this page requests camera access only after the user presses the consent button.
    guestPanel.classList.remove("hidden");
    setStatus("Invite link opened");
    startBtn.addEventListener("click", async () => {
      startBtn.disabled = true;
      guestMessage.textContent = "Waiting for browser camera permission…";
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false
        });
        localVideo.srcObject = localStream;
        guestPlaceholder.classList.add("hidden");
        guestMessage.textContent = "Camera is on and attempting to connect. Press Stop sharing to end.";
        stopBtn.classList.remove("hidden");
        startBtn.classList.add("hidden");

        peer = makePeer();
        peer.on("open", () => {
          const call = peer.call(hostIdFromUrl, localStream, { metadata: { purpose: "camera-share" } });
          if (!call) {
            guestMessage.textContent = "Could not start the connection. Keep this page open and try again.";
            return;
          }
          activeCall = call;
          call.on("close", () => {
            if (!ended) guestMessage.textContent = "The viewer disconnected. You can stop sharing now.";
          });
          call.on("error", () => {
            guestMessage.textContent = "Connection problem. Check your internet and try again.";
          });
        });
        peer.on("error", (err) => {
          guestMessage.textContent = "Connection error: " + (err.type || "unknown") + ". You can stop sharing.";
        });
      } catch (err) {
        startBtn.disabled = false;
        guestMessage.textContent = err.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings if you want to share."
          : "Camera could not be started. Use HTTPS and a browser with camera support.";
      }
    });

    stopBtn.addEventListener("click", () => {
      ended = true;
      stopViewer();
      stopLocalCamera();
      if (peer) { try { peer.destroy(); } catch (_) {} peer = null; }
      startBtn.disabled = false;
      ended = false;
    });

    window.addEventListener("pagehide", stopLocalCamera);
  } else {
    // Viewer mode: never requests the viewer's camera or microphone.
    viewerPanel.classList.remove("hidden");
    setStatus("Preparing secure session…");
    peer = makePeer();

    peer.on("open", (id) => {
      const url = new URL(location.href);
      url.search = "";
      url.hash = "";
      url.searchParams.set("join", id);
      shareUrl.textContent = url.toString();
      copyBtn.disabled = false;
      setStatus("Ready to receive");
    });

    peer.on("call", (call) => {
      // Only accept the incoming guest video stream. The viewer sends no media tracks.
      activeCall = call;
      call.answer();
      call.on("stream", (stream) => {
        remoteVideo.srcObject = stream;
        videoPlaceholder.classList.add("hidden");
        setStatus("Live camera connected");
      });
      call.on("close", () => {
        remoteVideo.srcObject = null;
        videoPlaceholder.classList.remove("hidden");
        setStatus("Waiting for camera");
      });
      call.on("error", () => {
        setStatus("Stream connection issue");
      });
    });

    peer.on("error", (err) => {
      if (err.type === "unavailable-id") {
        showError("This viewer session ID is already in use. Refresh the page to create a new link.");
      } else {
        setStatus("Connection issue");
      }
    });

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareUrl.textContent);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy link"; }, 1600);
      } catch (_) {
        window.prompt("Copy this invitation link:", shareUrl.textContent);
      }
    });

    endBtn.addEventListener("click", () => {
      ended = true;
      stopViewer();
      if (peer) { try { peer.destroy(); } catch (_) {} peer = null; }
      setStatus("Session ended");
      shareUrl.textContent = "Session ended. Refresh to create a new link.";
      copyBtn.disabled = true;
      endBtn.disabled = true;
    });

    window.addEventListener("pagehide", () => {
      stopViewer();
      if (peer) { try { peer.destroy(); } catch (_) {} }
    });
  }
})();
