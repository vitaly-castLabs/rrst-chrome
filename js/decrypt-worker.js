'use strict'

let dummyFrame = null
function initializeDummyFrame() {
    dummyFrame = new Uint8Array([
        // SPS
        0x00, 0x00, 0x00, 0x01, 0x27, 0x64, 0x00, 0x0d, 0xac, 0x57, 0x05, 0x06, 0x64,
        // PPS
        0x00, 0x00, 0x00, 0x01, 0x28, 0xee, 0x3c, 0xb0,
        // coded slice NALU
        0x00, 0x00, 0x00, 0x01, 0x25, 0xb8, 0x20, 0x00, 0xcb, 0xff, 0x26, 0x1d, 0xd9, 0x18, 0xc0, 0xa1, 0x60, 0x00, 0x00, 0x0c, 0xe5, 0xae,
        0xa6, 0x06, 0x07, 0x14, 0x03, 0x54, 0x00, 0xf7, 0x60, 0xc1, 0xb5, 0xe5, 0x80, 0x00, 0x20, 0x20
    ]).buffer
}

function generateDummyFrame() {
    if (!dummyFrame)
        initializeDummyFrame()

    return dummyFrame
}

function decryptVideo(encodedFrame, controller) {
    encodedFrame.data = generateDummyFrame()
    controller.enqueue(encodedFrame)
}

function decryptAudio(encodedFrame, controller) {
    controller.enqueue(encodedFrame)
}

function handleTransform(operation, readable, writable) {
    if (operation === 'decrypt-video') {
        const transformStream = new TransformStream({transform: decryptVideo})
        readable.pipeThrough(transformStream).pipeTo(writable)
    }
    else if (operation === 'decrypt-audio') {
        const transformStream = new TransformStream({transform: decryptAudio})
        readable.pipeThrough(transformStream).pipeTo(writable)
    }
}

onmessage = (event) => {
    if (event.data.operation === 'decrypt-video' || event.data.operation === 'decrypt-audio')
        return handleTransform(event.data.operation, event.data.readable, event.data.writable)
}

if (self.RTCTransformEvent) {
    self.onrtctransform = (event) => {
        const transformer = event.transformer
        handleTransform(transformer.options.operation, transformer.readable, transformer.writable)
    }
}
