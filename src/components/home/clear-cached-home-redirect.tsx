"use client"

import { useEffect } from "react"

const STORAGE_KEY = "ir-cleared-home-redirect"

// `/` used to 308 to `/updates`. Browsers keep that permanent redirect after the
// server stops sending it, and a hard refresh does not drop it. This page is
// where those browsers land. Clear-Site-Data on the response wipes the cache,
// then a full navigation loads `/` again. Two tries cover the case where the
// cache clear finishes on the second response. The cap avoids a loop.
export function ClearCachedHomeRedirect() {
  useEffect(() => {
    const navigation = performance.getEntriesByType("navigation")[0]

    if (!(navigation instanceof PerformanceNavigationTiming) || navigation.redirectCount < 1) {
      return
    }

    const attempts = Number(sessionStorage.getItem(STORAGE_KEY) || "0")

    if (attempts >= 2) {
      return
    }

    sessionStorage.setItem(STORAGE_KEY, String(attempts + 1))
    window.location.replace("/")
  }, [])

  return null
}

export function ForgetCachedHomeRedirect() {
  useEffect(() => {
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  return null
}
