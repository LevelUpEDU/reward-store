import './styles/globals.css'
import {ToasterProvider} from './Toaster'

export const metadata = {
    title: 'LevelUpEDU',
    description: 'Gamified learning platform where education meets adventure',
    icons: {
        icon: '/favicon/web-app-manifest-192x192.png',
        shortcut: '/favicon/web-app-manifest-192x192.png',
        apple: '/favicon/web-app-manifest-192x192.png',
        other: {
            rel: 'apple-touch-icon-precomposed',
            url: '/favicon/web-app-manifest-192x192.png',
        },
    },
}

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en">
            <body>
                {children}
                <ToasterProvider />
            </body>
        </html>
    )
}
