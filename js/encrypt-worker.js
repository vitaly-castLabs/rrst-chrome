'use strict'

function encryptVideo(encodedFrame, controller) {
    controller.enqueue(encodedFrame)
}

function encryptAudio(encodedFrame, controller) {
    controller.enqueue(encodedFrame)
}

function handleTransform(operation, readable, writable) {
    if (operation === 'encrypt-video') {
        const transformStream = new TransformStream({transform: encryptVideo})
        readable.pipeThrough(transformStream).pipeTo(writable)
    }
    else if (operation === 'encrypt-audio') {
        const transformStream = new TransformStream({transform: encryptAudio})
        readable.pipeThrough(transformStream).pipeTo(writable)
    }
}

onmessage = (event) => {
    if (event.data.operation === 'encrypt-video' || event.data.operation === 'encrypt-audio')
        return handleTransform(event.data.operation, event.data.readable, event.data.writable)
}

// Handler for RTCRtpScriptTransforms
if (self.RTCTransformEvent) {
    self.onrtctransform = (event) => {
        const transformer = event.transformer
        handleTransform(transformer.options.operation, transformer.readable, transformer.writable)
    }
}
