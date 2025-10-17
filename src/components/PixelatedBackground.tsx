'use client'

import {useLayoutEffect, useRef} from 'react'

type CanvasDimensions = {
    drawWidth: number
    drawHeight: number
    offsetX: number
    offsetY: number
    width: number
    height: number
}

type PixelatedBackgroundProps = {
    imageSrc: string
}

export default function PixelatedBackground({
    imageSrc,
}: PixelatedBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const hasInitialized = useRef(false)

    useLayoutEffect(() => {
        if (hasInitialized.current) return
        hasInitialized.current = true

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')!
        const offscreenCanvas = document.createElement('canvas')
        const offscreenCtx = offscreenCanvas.getContext('2d')!

        let canvasDimensions: CanvasDimensions

        function resizeCanvas() {
            if (!canvas) return
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()

            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr

            ctx.scale(dpr, dpr)

            ctx.fillStyle = '#44316fff'
            ctx.fillRect(0, 0, rect.width, rect.height)

            return {width: rect.width, height: rect.height}
        }

        resizeCanvas()

        function centerCanvas(
            canvasSize: {width: number; height: number},
            img: HTMLImageElement
        ): CanvasDimensions {
            /*
             * We don't get CSS attributes with the HTML canvas
             *
             * So we need to compare the image to the canvas and center it manually
             */
            const canvasAspect = canvasSize.width / canvasSize.height
            const imgAspect = img.naturalWidth / img.naturalHeight

            let drawWidth: number,
                drawHeight: number,
                offsetX: number,
                offsetY: number

            if (canvasAspect > imgAspect) {
                drawWidth = canvasSize.width
                drawHeight = canvasSize.width / imgAspect
                offsetX = 0
                offsetY = (canvasSize.height - drawHeight) / 2
            } else {
                drawHeight = canvasSize.height
                drawWidth = canvasSize.height * imgAspect
                offsetX = (canvasSize.width - drawWidth) / 2
                offsetY = 0
            }

            return {
                drawWidth,
                drawHeight,
                offsetX,
                offsetY,
                width: canvasSize.width,
                height: canvasSize.height,
            }
        }

        const img = new Image()
        img.onload = () => {
            const canvasSize = resizeCanvas()
            if (!canvasSize) return
            canvasDimensions = centerCanvas(canvasSize, img)

            // animation attributes
            let pixelSize = 1
            const maxPixelSize = 15
            const animationSpeed = 0.075
            let filterOpacity = 0
            const filterFadeSpeed = 0.02

            function drawPixelated() {
                // canvas size in "pixels"
                const pixelatedWidth = Math.max(
                    1,
                    Math.floor(canvasDimensions.drawWidth / pixelSize)
                )
                const pixelatedHeight = Math.max(
                    1,
                    Math.floor(canvasDimensions.drawHeight / pixelSize)
                )

                offscreenCanvas.width = pixelatedWidth
                offscreenCanvas.height = pixelatedHeight

                // draw tiny offscreen image first
                offscreenCtx.drawImage(
                    img,
                    0,
                    0,
                    pixelatedWidth,
                    pixelatedHeight
                )

                ctx.clearRect(
                    0,
                    0,
                    canvasDimensions.width,
                    canvasDimensions.height
                )

                ctx.imageSmoothingEnabled = false

                // stretch offscreen image to fit canvas
                ctx.drawImage(
                    offscreenCanvas,
                    0,
                    0,
                    pixelatedWidth,
                    pixelatedHeight,
                    canvasDimensions.offsetX,
                    canvasDimensions.offsetY,
                    canvasDimensions.drawWidth,
                    canvasDimensions.drawHeight
                )

                // fade filter slowly in on page load
                if (filterOpacity < 1) {
                    filterOpacity = Math.min(1, filterOpacity + filterFadeSpeed)
                }

                // create a vignette around the edges
                const gradient = ctx.createRadialGradient(
                    canvasDimensions.width / 2,
                    canvasDimensions.height / 2,
                    0,
                    canvasDimensions.width / 2,
                    canvasDimensions.height / 2,
                    canvasDimensions.width * 0.7
                )

                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
                gradient.addColorStop(
                    1,
                    `rgba(0, 0, 0, ${0.6 * filterOpacity})`
                )

                ctx.fillStyle = gradient
                ctx.fillRect(
                    0,
                    0,
                    canvasDimensions.width,
                    canvasDimensions.height
                )

                ctx.globalCompositeOperation = 'soft-light'
                ctx.globalAlpha = filterOpacity

                ctx.fillStyle = '#44316Fff'
                ctx.fillRect(
                    canvasDimensions.offsetX,
                    canvasDimensions.offsetY,
                    canvasDimensions.drawWidth,
                    canvasDimensions.drawHeight
                )

                ctx.globalCompositeOperation = 'source-over'
                ctx.globalAlpha = 1

                pixelSize += animationSpeed

                // keep animating until pixels reach the max size or the filter is completely applied
                if (pixelSize < maxPixelSize || filterOpacity < 1) {
                    requestAnimationFrame(drawPixelated)
                }
            }

            drawPixelated()

            let resizeTimeout: NodeJS.Timeout

            // start the animation again on page resize
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout)
                resizeTimeout = setTimeout(() => {
                    const canvasSize = resizeCanvas()
                    if (!canvasSize) return
                    canvasDimensions = centerCanvas(canvasSize, img)
                    pixelSize = 1
                    drawPixelated()
                }, 150)
            })
        }
        img.src = imageSrc
    }, [imageSrc])

    return <canvas ref={canvasRef} id="pixelated-bg" />
}
