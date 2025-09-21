import { useEffect, useState } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export const getDeviceType = (width: number): DeviceType => {
  if (width < 600) return 'mobile'
  if (width >= 600 && width <= 1024) return 'tablet'
  return 'desktop'
}

/**
 * Hook that returns the current device type ('mobile'|'tablet'|'desktop').
 * It listens to window resize and logs the detected device to the console.
 */
export function useDevice(): DeviceType {
  // Use a deterministic initial value to avoid hydration mismatches.
  // During SSR the hook will return 'desktop' and on the client it will update
  // to the correct device after mount. This prevents server-rendered HTML from
  // differing from the hydrated client render due to immediate window reads.
  const [device, setDevice] = useState<DeviceType>(() => 'desktop')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => setDevice(getDeviceType(window.innerWidth))

    // run once to set correct value on mount
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, []);


  console.log('Detected device:', device)
  // Debug: log device changes
  useEffect(() => {
    console.log('Detected device:', device)
  }, [device])

  return device
}
