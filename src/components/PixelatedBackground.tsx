'use client'

import {useLayoutEffect, useRef, useState} from 'react'
import Image from 'next/image'

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
    // use refs to ensure DOM elements don't return null
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isCanvasReady, setCanvasReady] = useState(false)
    const imgRef = useRef<HTMLImageElement | null>(null)
    const [imageLoaded, setImageLoaded] = useState(false)

    useLayoutEffect(() => {
        const img = new window.Image()
        img.onload = () => {
            imgRef.current = img
            setImageLoaded(true)
        }
        img.src = imageSrc
    }, [imageSrc])

    useLayoutEffect(() => {
        if (!imageLoaded || !imgRef.current) return

        const canvas = canvasRef.current
        if (!canvas) return

        const img = imgRef.current
        const ctx = canvas.getContext('2d')!
        const offscreenCanvas = document.createElement('canvas')
        const offscreenCtx = offscreenCanvas.getContext('2d')!

        let canvasDimensions: CanvasDimensions
        let isFirstFrame = true
        let animationFrameId: number

        function resizeCanvas() {
            if (!canvas) return
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.scale(dpr, dpr)
            return {width: rect.width, height: rect.height}
        }

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
            offscreenCtx.drawImage(img, 0, 0, pixelatedWidth, pixelatedHeight)
            ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height)
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
            if (isFirstFrame) {
                isFirstFrame = false
                setCanvasReady(true)
            }
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
            gradient.addColorStop(1, `rgba(0, 0, 0, ${0.6 * filterOpacity})`)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height)
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
            if (pixelSize < maxPixelSize || filterOpacity < 1) {
                animationFrameId = requestAnimationFrame(drawPixelated)
            }
        }

        let resizeTimeout: NodeJS.Timeout
        const handleResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(() => {
                const canvasSize = resizeCanvas()
                if (!canvasSize) return
                canvasDimensions = centerCanvas(canvasSize, img)
                pixelSize = 1
                filterOpacity = 0
                isFirstFrame = true
                if (animationFrameId) cancelAnimationFrame(animationFrameId)
                drawPixelated()
            }, 150)
        }

        const canvasSize = resizeCanvas()
        if (!canvasSize) return
        canvasDimensions = centerCanvas(canvasSize, img)
        drawPixelated()
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
        }
    }, [imageLoaded, imageSrc])

    // return the image container, the static image, and the html canvas
    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: -2,
                    backgroundColor: '#1a1a1a',
                    opacity: isCanvasReady ? 0 : 1,
                    transition: 'opacity 500ms ease-in-out',
                }}>
                <Image
                    src={imageSrc}
                    alt=""
                    fill
                    style={{objectFit: 'cover'}}
                    priority
                />
            </div>
            <canvas
                ref={canvasRef}
                id="pixelated-bg"
                style={{
                    opacity: isCanvasReady ? 1 : 0,
                    transition: 'opacity 500ms ease-in-out',
                }}
            />
        </>
    )
}
