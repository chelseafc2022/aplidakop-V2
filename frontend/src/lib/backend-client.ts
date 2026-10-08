// Helper untuk integrasi Next.js Route Handlers dengan BackendStatistik Express API (Port 5020)
import jwt from 'jsonwebtoken';

export const BACKEND_STATISTIK_URL = process.env.BACKEND_STATISTIK_URL || 'http://localhost:5020';
export const TOKEN_SECRET = process.env.TOKEN_SECRET || 'default-local-secret-key';

export function getSystemToken(): string {
  return jwt.sign(
    {
      _id: 'i33wtesojro8e65d',
      username: 'administrator',
      profile: {
        nip: '198511202014061001',
        email: 'admin.dinkop@konaweselatankab.go.id',
        username: 'administrator',
        instansi_id: '1',
        instansi_nama: 'Dinas Koperasi dan UMKM',
        unit_kerja_id: '1',
        unit_kerja_nama: 'Kabupaten Konawe Selatan',
        menu_klp: '17',
      },
    },
    TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

export async function fetchFromBackend(path: string, options: RequestInit = {}) {
  const url = `${BACKEND_STATISTIK_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Jika tidak ada header Authorization atau token kosong, gunakan system token resmi
  const existingAuth = headers.get('Authorization');
  if (!existingAuth || existingAuth === 'Bearer ' || existingAuth === 'Bearer null' || existingAuth === 'Bearer undefined') {
    headers.set('Authorization', `Bearer ${getSystemToken()}`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    return res;
  } catch (error) {
    console.error(`[BackendStatistik] Fetch failed for ${url}:`, error);
    throw error;
  }
}
