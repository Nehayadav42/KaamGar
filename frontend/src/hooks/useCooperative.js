import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

let cache = null

// Name of the cooperative the signed-in admin works for (for the page header)
export function useCooperativeName() {
  const { user } = useAuth()
  const [name, setName] = useState(cache?.find((c) => c.id === user?.cooperativeId)?.name ?? cache?.[0]?.name ?? 'Bhopal Shramik Cooperative')

  useEffect(() => {
    let alive = true
    const apply = (list) => alive && setName(list.find((c) => c.id === user?.cooperativeId)?.name ?? list[0]?.name ?? name)
    if (cache) apply(cache)
    else api.cooperatives.list().then((d) => { cache = d.cooperatives; apply(cache) }).catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.cooperativeId])

  return name
}
