'use strict'

function decryptVideo(encodedFrame, controller) {
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
