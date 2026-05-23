import { useEffect } from 'react'
import { useWordbookStore } from '../store/wordbookStore'

export function AppInit() {
  const ensureBuiltin = useWordbookStore((s) => s.ensureBuiltin)

  useEffect(() => {
    ensureBuiltin()
  }, [ensureBuiltin])

  return null
}
