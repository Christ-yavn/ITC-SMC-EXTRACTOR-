import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { buildMultipartBody, DriveFileItem, parseDriveError } from '../utils/driveHelpers';

// Initialize Firebase App instance singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Enable browserLocalPersistence so auth survives page refreshes and browser restarts
try {
  setPersistence(auth, browserLocalPersistence).catch(err => {
    console.warn('Firebase setPersistence notice:', err);
  });
} catch {
  // ignore in SSR or test environments
}

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive',
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach(scope => provider.addScope(scope));

export const TOKEN_STORAGE_KEY = 'hugofx_gdrive_token_v2';
export const USER_STORAGE_KEY = 'hugofx_gdrive_user_v2';
export const EXPIRES_STORAGE_KEY = 'hugofx_gdrive_expires_v2';
export const FOLDER_STORAGE_KEY = 'hugofx_gdrive_folder_id_v2';

// In-memory access token cache with localStorage persistence
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
})();
let isSigningIn = false;

export interface PersistedGoogleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const getPersistedUser = (): PersistedGoogleUser | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (raw && token) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
};

/**
 * Checks whether the stored Google Drive token is still valid (not expired).
 */
export const isDriveSessionValid = (): boolean => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expires = localStorage.getItem(EXPIRES_STORAGE_KEY);
    if (!token) return false;
    if (expires) {
      const expiresAt = parseInt(expires, 10);
      // Give a 60-second safety margin
      if (Date.now() >= expiresAt - 60000) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Returns the timestamp when the current Drive token expires (or null).
 */
export const getDriveTokenExpiration = (): number | null => {
  try {
    const expires = localStorage.getItem(EXPIRES_STORAGE_KEY);
    return expires ? parseInt(expires, 10) : null;
  } catch {
    return null;
  }
};

/**
 * Gets cached Google Drive folder ID to avoid repeated search calls.
 */
export const getSavedDriveFolderId = (): string | null => {
  try {
    return localStorage.getItem(FOLDER_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setSavedDriveFolderId = (folderId: string): void => {
  try {
    localStorage.setItem(FOLDER_STORAGE_KEY, folderId);
  } catch {
    // ignore
  }
};

/**
 * Initializes Firebase Auth state listener and restores persistent Drive session.
 */
export const initAuth = (
  onAuthSuccess?: (user: User | PersistedGoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  // If we already have a valid persisted token and user in localStorage, restore immediately on F5
  const persistedUser = getPersistedUser();
  const persistedToken = cachedAccessToken || (() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  })();

  const isValid = isDriveSessionValid();

  if (persistedUser && persistedToken && isValid) {
    cachedAccessToken = persistedToken;
    if (onAuthSuccess) {
      onAuthSuccess(persistedUser as unknown as User, persistedToken);
    }
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || (() => {
        try {
          return localStorage.getItem(TOKEN_STORAGE_KEY);
        } catch {
          return null;
        }
      })();
      if (token && isDriveSessionValid()) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) {
          onAuthFailure();
        }
      }
    } else {
      // Firebase auth instance might be null initially on boot, check local persistence
      const pUser = getPersistedUser();
      const pToken = cachedAccessToken || (() => {
        try {
          return localStorage.getItem(TOKEN_STORAGE_KEY);
        } catch {
          return null;
        }
      })();
      if (pUser && pToken && isDriveSessionValid()) {
        if (onAuthSuccess) onAuthSuccess(pUser as unknown as User, pToken);
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Renew session in 1 click using Google Sign-in popup without losing any state.
 */
export const renewDriveSession = async (): Promise<{ user: User; accessToken: string }> => {
  return await googleSignIn();
};

/**
 * Sign in with Google Popup and retrieve OAuth token (persisted for future sessions).
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossible d\'obtenir le jeton d\'accÃ¨s Google Drive depuis Firebase Auth');
    }

    const accessToken = credential.accessToken;
    cachedAccessToken = accessToken;
    const expiresAt = Date.now() + 3500 * 1000; // 3500 seconds

    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      localStorage.setItem(EXPIRES_STORAGE_KEY, String(expiresAt));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      }));
    } catch (e) {
      console.warn('Erreur de stockage localStorage:', e);
    }

    return { user: result.user, accessToken };

  } catch (error: unknown) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns current access token (from memory or persistent storage).
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  } catch {
    // ignore
  }
  return null;
};

/**
 * Sets access token directly (e.g. after successful auth flow).
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
};

/**
 * Sign out and clear in-memory token.
 */
export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(EXPIRES_STORAGE_KEY);
  } catch {
    // ignore
  }
};

/**
 * Helper to execute authorized Google Drive REST API calls.
 */
async function driveFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentification Google Drive requise. Veuillez vous connecter.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      cachedAccessToken = null;
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(EXPIRES_STORAGE_KEY);
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hugofx-drive-expired'));
      }
    }
    let errorDetail = `Erreur HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = parseDriveError(errorJson);
    } catch {
      // fallback to statusText
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response;
}

export const WORKBENCH_FOLDER_NAME = 'HugoFX ICT Knowledge Workbench';

/**
 * Finds or creates the dedicated HugoFX folder on Google Drive.
 */
export async function getOrCreateWorkbenchFolder(folderName = WORKBENCH_FOLDER_NAME): Promise<string> {
  // Check cached folder id first
  const cachedFolderId = getSavedDriveFolderId();
  if (cachedFolderId) {
    try {
      const verifyRes = await driveFetch(`https://www.googleapis.com/drive/v3/files/${cachedFolderId}?fields=id,name,trashed`);
      const verifyData = await verifyRes.json();
      if (verifyData && verifyData.id && !verifyData.trashed) {
        return verifyData.id;
      }
    } catch {
      // Cached folder might have been deleted, proceed to search
    }
  }

  // 1. Search for existing folder
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`;
  
  const res = await driveFetch(searchUrl);
  const data = await res.json();
  
  if (data.files && data.files.length > 0) {
    const id = data.files[0].id;
    setSavedDriveFolderId(id);
    return id;
  }

  // 2. Create folder if not found
  const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Dossier de sauvegarde des fiches ICT/SMC et registres HugoFX',
    }),
  });

  const created = await createRes.json();
  const newId = created.id;
  setSavedDriveFolderId(newId);
  return newId;
}

/**
 * Lists files in a given folder or related workbench files with full pagination (pageSize=1000 & nextPageToken).
 */
export async function listFolderFiles(folderId?: string): Promise<DriveFileItem[]> {
  let q = 'trashed = false';
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }

  const fields = 'nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,webContentLink,parents)';
  const allFiles: DriveFileItem[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime desc&pageSize=1000${tokenParam}`;

    const res = await driveFetch(url);
    const data = await res.json();
    if (Array.isArray(data.files)) {
      allFiles.push(...(data.files as DriveFileItem[]));
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allFiles;
}

/**
 * Checks if a file exists by name inside the folder.
 */
export async function findFileInFolder(name: string, folderId: string): Promise<DriveFileItem | null> {
  const query = `name = '${name.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&pageSize=1`;
  const res = await driveFetch(url);
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0] as DriveFileItem;
  }
  return null;
}

/**
 * Uploads or updates a file in Google Drive.
 */
export async function saveFileToDrive(
  fileName: string,
  content: string,
  folderId?: string,
  mimeType = 'text/markdown'
): Promise<DriveFileItem> {
  const targetFolderId = folderId || await getOrCreateWorkbenchFolder();
  
  // Check if file already exists in folder
  const existingFile = await findFileInFolder(fileName, targetFolderId);

  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType,
  };

  if (!existingFile) {
    metadata.parents = [targetFolderId];
  }

  const { body, contentTypeHeader } = buildMultipartBody(metadata, content, `${mimeType}; charset=UTF-8`);

  let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink';
  let method = 'POST';

  if (existingFile) {
    uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink`;
    method = 'PATCH';
  }

  const res = await driveFetch(uploadUrl, {
    method,
    headers: {
      'Content-Type': contentTypeHeader,
    },
    body,
  });

  return await res.json();
}

/**
 * Reads plain text content of a file from Google Drive.
 */
export async function readDriveFileContent(fileId: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await driveFetch(url);
  return await res.text();
}

/**
 * Deletes a file from Google Drive.
 * (Note: Caller MUST invoke user confirmation dialog prior to calling this function!)
 */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  await driveFetch(url, {
    method: 'DELETE',
  });
}

/**
 * Deletes multiple files in batch with progress callback.
 */
export async function batchDeleteDriveFiles(
  fileIds: string[],
  onProgress?: (done: number, total: number) => void
): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  for (let i = 0; i < fileIds.length; i++) {
    const id = fileIds[i];
    try {
      await deleteDriveFile(id);
      deleted++;
    } catch (e) {
      console.warn(`Erreur suppression fichier Drive ${id}:`, e);
      failed++;
    }
    if (onProgress) {
      onProgress(deleted + failed, fileIds.length);
    }
  }

  return { deleted, failed };
}

/**
 * Finds or creates a subfolder within a parent folder on Google Drive.
 */
export async function getOrCreateDriveSubfolder(
  parentFolderId: string,
  subfolderName: string,
  description?: string
): Promise<string> {
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${subfolderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`;
  
  const res = await driveFetch(searchUrl);
  const data = await res.json();
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: subfolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
      description: description || `Sous-dossier ICT/SMC : ${subfolderName}`,
    }),
  });

  const created = await createRes.json();
  return created.id;
}

/**
 * Resolves or creates a nested path of folders on Google Drive (e.g. ['03_PD_Arrays', 'BPR_Balanced_Price_Range']).
 */
export async function getOrCreateNestedPathFolders(
  rootFolderId: string,
  pathSegments: string[]
): Promise<string> {
  let currentFolderId = rootFolderId;
  for (const segment of pathSegments) {
    currentFolderId = await getOrCreateDriveSubfolder(currentFolderId, segment);
  }
  return currentFolderId;
}

/**
 * Moves a file from current parent folder to a target parent folder on Google Drive.
 */
export async function moveDriveFile(
  fileId: string,
  currentParentId: string,
  newParentId: string
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${encodeURIComponent(newParentId)}&removeParents=${encodeURIComponent(currentParentId)}`;
  await driveFetch(url, { method: 'PATCH' });
}

/**
 * Lists all files in the workbench folder recursively (including subfolders).
 */
export async function listDriveFilesRecursive(rootFolderId: string): Promise<Array<DriveFileItem & { folderPath?: string }>> {
  // 1. Get all folders and files inside root workbench
  const q = `'${rootFolderId}' in parents and trashed = false`;
  const rootFiles = await listFolderFiles(rootFolderId);
  const results: Array<DriveFileItem & { folderPath?: string }> = [];

  for (const item of rootFiles) {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      // It's a subfolder (e.g. pillar folder)
      const subItems = await listFolderFiles(item.id);
      for (const subItem of subItems) {
        if (subItem.mimeType === 'application/vnd.google-apps.folder') {
          // It's a 2nd level subfolder (e.g. concept folder)
          const conceptItems = await listFolderFiles(subItem.id);
          for (const leaf of conceptItems) {
            if (leaf.mimeType !== 'application/vnd.google-apps.folder') {
              results.push({
                ...leaf,
                folderPath: `${item.name}/${subItem.name}`,
              });
            }
          }
        } else {
          results.push({
            ...subItem,
            folderPath: item.name,
          });
        }
      }
    } else {
      results.push({
        ...item,
        folderPath: 'Racine',
      });
    }
  }

  return results;
}

/**
 * Saves a fiche into its structured subfolder based on the ICT/SMC taxonomy.
 */
export async function saveFicheToStructuredDrive(
  video: { video_id: string; titre: string; description?: string; famille?: string },
  content: string,
  rootFolderId?: string
): Promise<{ file: DriveFileItem; fullPath: string; folderId: string }> {
  const root = rootFolderId || await getOrCreateWorkbenchFolder();
  const { classifyVideoTaxonomy, generateFicheDriveFileName } = await import('../utils/ictTaxonomy');
  const taxonomy = classifyVideoTaxonomy(video);

  // Resolve or create nested path on Google Drive
  const targetFolderId = await getOrCreateNestedPathFolders(root, taxonomy.pathSegments);
  const fileName = generateFicheDriveFileName(video.video_id, video.titre);

  const file = await saveFileToDrive(fileName, content, targetFolderId);
  return {
    file,
    fullPath: `${taxonomy.fullDrivePath}/${fileName}`,
    folderId: targetFolderId,
  };
}

/**
 * Reorganizes existing flat files in root workbench folder into structured subfolders.
 */
export async function reorganizeDriveFilesIntoTaxonomy(
  rootFolderId: string,
  videos: Array<{ video_id: string; titre: string }>,
  onProgress?: (message: string) => void
): Promise<{ movedCount: number; errors: string[] }> {
  const { classifyVideoTaxonomy } = await import('../utils/ictTaxonomy');
  const { extractYoutubeIdFromDriveFileName } = await import('./traceabilityRegistry');
  const rootFiles = await listFolderFiles(rootFolderId);
  const mdFiles = rootFiles.filter(f => f.name.endsWith('.md') && f.mimeType !== 'application/vnd.google-apps.folder');
  const knownIds = videos.map(v => v.video_id);

  let movedCount = 0;
  const errors: string[] = [];

  for (const file of mdFiles) {
    const yId = extractYoutubeIdFromDriveFileName(file.name, knownIds);
    if (!yId) continue;

    const video = videos.find(v => v.video_id === yId) || { video_id: yId, titre: file.name.replace('.md', '') };
    const taxonomy = classifyVideoTaxonomy(video);

    try {
      if (onProgress) {
        onProgress(`Classement de "${file.name}" -> ${taxonomy.fullDrivePath}...`);
      }
      const targetFolderId = await getOrCreateNestedPathFolders(rootFolderId, taxonomy.pathSegments);
      await moveDriveFile(file.id, rootFolderId, targetFolderId);
      movedCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur dÃ©placement';
      errors.push(`Erreur sur ${file.name} : ${msg}`);
    }
  }

  return { movedCount, errors };
}


