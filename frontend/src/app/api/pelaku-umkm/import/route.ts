import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';
import { pelakuImportSchema } from '@/lib/api-schemas';
import { parseJsonBody, securityErrorResponse } from '@/lib/server-security';

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody(req, pelakuImportSchema, 2 * 1024 * 1024);
    if (parsed.error) return parsed.error;
    const { records, tahun } = parsed.data;

    const res = await fetchFromBackend('/api/v1/master_pelaku/batchImport', {
      method: 'POST',
      body: JSON.stringify({
        records,
        tahun,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Jika backend mengembalikan error status
    return NextResponse.json(
      {
        status: false,
        message: 'Gagal memproses batch import di server database.',
      },
      { status: res.status >= 400 && res.status < 500 ? res.status : 502 }
    );
  } catch (err) {
    console.error('[API Pelaku UMKM Import] Error:', err);
    const securityResponse = securityErrorResponse(err);
    if (securityResponse) return securityResponse;
    return NextResponse.json(
      {
        status: false,
        message: 'Terjadi kesalahan sistem saat memproses impor data.',
      },
      { status: 503 }
    );
  }
}
