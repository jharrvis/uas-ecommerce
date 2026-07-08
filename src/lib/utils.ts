export function getDriveDirectUrl(url: string): string {
  if (!url) return url

  const fileId = getDriveFileId(url)
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
  }

  return url
}

function getDriveFileId(url: string): string {
  // Format: https://drive.google.com/file/d/FILE_ID/view?...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return fileMatch[1]
  }

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    return openMatch[1]
  }

  // Format: https://drive.google.com/uc?id=FILE_ID
  const ucMatch = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/)
  if (ucMatch) {
    return ucMatch[1]
  }

  return ''
}
