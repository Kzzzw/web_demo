import { Base64 } from 'js-base64';

export const previewUrlBase64 = (fileUrl: string) => {
  const baseUrl = import.meta.env.VITE_PREVIEWBASEURL
  const url = `${baseUrl}?url=` + encodeURIComponent(Base64.encode(fileUrl))
  return url
}

