import { ref, uploadBytesResumable, getDownloadURL, type UploadTask } from 'firebase/storage'
import { storage } from './config'

type ProgressCallback = (percent: number) => void

interface UploadResult {
  promise: Promise<string>
  task: UploadTask
}

export function uploadFile(
  file: File,
  path: string,
  onProgress?: ProgressCallback,
): UploadResult {
  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, file)

  const promise = new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(percent)
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve(url)
      },
    )
  })

  return { promise, task }
}

export function uploadProfilePhoto(
  userId: string,
  file: File,
  onProgress?: ProgressCallback,
): UploadResult {
  return uploadFile(file, `users/${userId}/profile-photo`, onProgress)
}

export function uploadIdDocument(
  userId: string,
  file: File,
  onProgress?: ProgressCallback,
): UploadResult {
  return uploadFile(file, `users/${userId}/id-document`, onProgress)
}
