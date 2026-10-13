/** Lightweight client-side image heuristic (skin-tone ratio). Not perfect — queues for human review. */

export type ImageScanResult = {
  flagged: boolean
  reason?: string
  skinRatio: number
}

function isSkinTone(r: number, g: number, b: number) {
  // Rough YCbCr-ish skin heuristic for moderation queue (not a medical detector)
  const y = 0.299 * r + 0.587 * g + 0.114 * b
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
  return y > 60 && y < 230 && cb > 80 && cb < 135 && cr > 135 && cr < 180
}

export async function scanImageFile(file: File): Promise<ImageScanResult> {
  const bitmap = await createImageBitmap(file)
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { flagged: false, skinRatio: 0 }
  ctx.drawImage(bitmap, 0, 0, size, size)
  bitmap.close()
  const { data } = ctx.getImageData(0, 0, size, size)
  let skin = 0
  const total = size * size
  for (let i = 0; i < data.length; i += 4) {
    if (isSkinTone(data[i], data[i + 1], data[i + 2])) skin += 1
  }
  const skinRatio = skin / total
  // High skin coverage → send to human review (false positives OK)
  if (skinRatio >= 0.42) {
    return {
      flagged: true,
      skinRatio,
      reason: 'Duży udział tonów skóry na zdjęciu — wymagana weryfikacja',
    }
  }
  return { flagged: false, skinRatio }
}

export async function scanAuctionImages(files: File[]): Promise<string[]> {
  const reasons: string[] = []
  for (const file of files) {
    try {
      const res = await scanImageFile(file)
      if (res.flagged && res.reason && !reasons.includes(res.reason)) {
        reasons.push(res.reason)
      }
    } catch {
      // ignore decode errors
    }
  }
  return reasons
}

const VULGAR = [
  'kurwa',
  'chuj',
  'pizda',
  'jebac',
  'jebany',
  'pierdol',
  'spierdalaj',
  'skurwysyn',
  'kutas',
  'fuck',
  'shit',
  'bitch',
  'cunt',
]

const ADULT = [
  'porn',
  'porno',
  'xxx',
  'nago',
  'nagie',
  'seks film',
  'onlyfans',
  'erotyka',
  'erotyk',
  'camgirl',
]

export function scanAuctionText(title: string, description: string): string[] {
  const blob = ` ${`${title} ${description}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `
  const reasons: string[] = []
  if (VULGAR.some((w) => blob.includes(` ${w} `) || blob.includes(w))) {
    reasons.push('Wykryto wulgaryzmy w tekście aukcji')
  }
  if (ADULT.some((w) => blob.includes(w))) {
    reasons.push('Podejrzenie treści / zdjęć nieodpowiednich (słowa kluczowe)')
  }
  return reasons
}
