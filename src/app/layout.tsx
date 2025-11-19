import './styles/globals.css'
import {ToasterProvider} from './Toaster'

export const metadata = {
    title: 'LevelUpEDU',
    description: 'Gamified learning platform where education meets adventure',
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
