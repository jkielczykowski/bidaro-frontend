/** Normalize PL mobile/landline to +48XXXXXXXXX or null if invalid. */
export function normalizePlPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '')
  let n = digits

  if (n.startsWith('+')) n = n.slice(1)
  if (n.startsWith('00')) n = n.slice(2)
  if (n.startsWith('48') && n.length === 11) {
    // already with country
  } else if (n.startsWith('48') && n.length > 11) {
    return null
  } else if (n.length === 9) {
    n = `48${n}`
  } else {
    return null
  }

  // PL: 9 digits after 48
  if (!/^48\d{9}$/.test(n)) return null
  return `+${n}`
}

export function isValidPlPhone(input: string): boolean {
  return normalizePlPhone(input) != null
}
