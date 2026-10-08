import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    id: 'user-active',
    username: 'admin',
    nama: 'Administrator Dinkop',
    email: 'admin.dinkop@konaweselatankab.go.id',
    instansiNama: 'Dinas Koperasi dan UMKM',
    unitKerjaNama: 'Kabupaten Konawe Selatan',
    role: { id: '1', nama: 'Administrator' },
  });
}
