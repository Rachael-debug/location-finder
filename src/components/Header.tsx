import { ModeToggle } from './mode-toggle'
import { Shell } from 'lucide-react';

export default function Header() {
    return (
        <header className='flex justify-between items-center mb-4 p-5 z-8 fixed top-0 right-0 left-0 bg-background'>
            <h1 className='flex gap-1'><Shell /> HOSPITAL LOCATOR</h1>
            <ModeToggle />
        </header>
    )
}