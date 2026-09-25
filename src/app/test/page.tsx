'use client'

import api from '@/lib/api'
import { useEffect, useState } from 'react'

export default function TestPage() {
    const [status, setStatus] = useState('checking...')

    useEffect(() => {
        api.get('/job-descriptions/')
        .then(() => setStatus('Connected (but likely 401 - expected, no token yet)'))
        .catch((err) => setStatus(`Response: ${err.response?.status} ${err.response?.statusText}`))
    }, []) // Empty dependency array means this effect runs once on mount

    return <div className="flex flex-col items-center justify-center min-h-screen py-2">
        API connection test: {status}
    </div>
}