'use strict'

import {enforceH264} from '../../shared/utils.js'

const localVid = document.getElementById('local-video')
const remoteVid = document.getElementById('remote-video')
const startBtn = document.getElementById('start-button')

let localPc = null
let remotePc = null

window.onload = () => {
    startBtn.disabled = false
}

const encryptWorker = new Worker('./js/encrypt-worker.js', {name: 'encrypt worker'})
function setupSenderTransform(sender) {
    if (window.RTCRtpScriptTransform)
        sender.transform = new RTCRtpScriptTransform(encryptWorker, {operation: `encrypt-${sender.track.kind}`})
    else
        alert('RTCRtpScriptTransform is not available!')
}

const decryptWorker = new Worker('./js/decrypt-worker.js', {name: 'decrypt worker'})
function setupReceiverTransform(receiver) {
    if (window.RTCRtpScriptTransform)
        receiver.transform = new RTCRtpScriptTransform(decryptWorker, {operation: `decrypt-${receiver.track.kind}`})
}

async function start() {
    startBtn.style.display = 'none'
    localVid.style.display = 'block'
    remoteVid.style.display = 'block'

    try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
        localVid.srcObject = stream

        const pcConfig = {encodedInsertableStreams: true}
        localPc = new RTCPeerConnection(pcConfig)
        remotePc = new RTCPeerConnection(pcConfig)

        localPc.addTrack(stream.getVideoTracks()[0], stream)
        const transceivers = localPc.getTransceivers()
        for (const tr of transceivers) {
            tr.direction = 'sendonly'
            setupSenderTransform(tr.sender)
        }

        remotePc.ontrack = e => {
            setupReceiverTransform(e.transceiver.receiver)
            remoteVid.srcObject = e.streams[0]
        }

        localPc.onicecandidate = e => remotePc.addIceCandidate(e.candidate)
        remotePc.onicecandidate = e => localPc.addIceCandidate(e.candidate)

        const localOffer = await localPc.createOffer()
        // force H264 by means of removing other video codecs from the SDP
        localOffer.sdp = enforceH264(localOffer.sdp)
        await localPc.setLocalDescription(localOffer)

        await remotePc.setRemoteDescription(localOffer)
        const remoteAnswer = await remotePc.createAnswer()
        await remotePc.setLocalDescription(remoteAnswer)

        localPc.setRemoteDescription(remoteAnswer)
    }
    catch (e) {
        stop()
        alert(`${e}`)
    }
}
window.start = start

function stop() {
    startBtn.style.display = 'block'
    localVid.style.display = 'none'
    remoteVid.style.display = 'none'

    localVid.srcObject = null
    remoteVid.srcObject = null

    if (localPc) {
        localPc.close()
        localPc = null
    }

    if (remotePc) {
        remotePc.close()
        remotePc = null
    }
}
