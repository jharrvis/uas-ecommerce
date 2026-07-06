export function getDriveDirectUrl(url: string): string {
  if (!url) return url

  // Format: https://drive.google.com/file/d/FILE_ID/view?...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`
  }

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    return `https://lh3.googleusercontent.com/d/${openMatch[1]}`
  }

  // Format: https://drive.google.com/uc?id=FILE_ID
  const ucMatch = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/)
  if (ucMatch) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`
  }

  return url
}
