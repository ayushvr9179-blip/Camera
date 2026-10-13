ONE-WAY CAMERA SHARE WEBSITE
=============================

WHAT IT DOES
- Viewer opens the site and gets an invitation URL.
- Viewer sends that URL to another person.
- The invited person sees a clear consent notice and must click "Agree & share camera".
- Only after the click does the browser request camera permission.
- The invited person's camera stream is sent to the viewer.
- The viewer's camera and microphone are never requested.
- The invited person can press "Stop sharing" at any time.

IMPORTANT REQUIREMENTS
1. Host the files on an HTTPS website. Camera access generally does not work on ordinary HTTP pages.
2. Keep the viewer page open before and while the guest connects.
3. Both people need internet access and a modern browser.
4. This starter uses PeerJS's public signaling service and WebRTC. It is a demo, not a guaranteed production service. Some networks/firewalls may prevent a direct connection; a production deployment may need a TURN server and a managed signaling setup.
5. Do not use this to stream someone's camera without their informed consent. The page explicitly explains the live camera sharing before asking for permission.

HOW TO USE
1. Upload index.html, style.css, and script.js to an HTTPS static host (for example, GitHub Pages or Netlify).
2. Open the site's main URL yourself. Wait until status says "Ready to receive".
3. Click "Copy link" and send it to the person who agrees to share their camera.
4. They open the link, read the notice, click "Agree & share camera", then allow camera access.
5. Their live video should appear on your viewer page.
6. Click "End session" on your viewer page, or have the guest press "Stop sharing".

LOCAL TESTING
- Open via a local HTTPS development server or localhost. Browsers commonly allow camera access on localhost, but not on arbitrary HTTP hosting.
- Test with two separate devices or browser profiles.

PRIVACY NOTE
WebRTC generally sends media peer-to-peer when possible, but this sample uses a public signaling service to help peers connect. It does not record or save video in this code. Do not treat this demo as a security-audited product.
