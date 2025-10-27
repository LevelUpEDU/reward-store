import SessionProvider from './providers/SessionProvider'
import './styles/globals.css'

export const metadata = {
    title: 'LevelUpEDU',
    description: 'Gamified learning platform where education meets adventure',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en">
            <body>
                <SessionProvider>{children}</SessionProvider>
            </body>
        </html>
    )
}
