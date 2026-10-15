'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/verifikasi/pendaftaran-umkm');
  }, [router]);

  return null;
}
