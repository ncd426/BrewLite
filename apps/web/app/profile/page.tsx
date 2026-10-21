'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchMyProfile, getAccessToken, type UserProfile } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!getAccessToken()) {
      router.replace('/login');
      return () => {
        mounted = false;
      };
    }

    fetchMyProfile()
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch((cause: unknown) => {
        if (mounted) {
          setError(cause instanceof Error ? cause.message : 'Không thể tải thông tin cá nhân.');
        }
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/" className="text-sm font-medium text-amber-700 hover:text-amber-900">
        ← Quay lại menu
      </Link>
      <section className="mt-5 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-amber-100">
        <h1 className="mb-6 text-3xl font-bold text-amber-950">Thông tin cá nhân</h1>
        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : profile ? (
          <dl className="space-y-5">
            <div>
              <dt className="text-sm text-gray-500">Họ và tên</dt>
              <dd className="mt-1 font-medium text-amber-950">
                {profile.name || 'Chưa cập nhật'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="mt-1 font-medium text-amber-950">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Điểm tích lũy</dt>
              <dd className="mt-1 font-medium text-amber-950">{profile.loyaltyPoints}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Ngày tham gia</dt>
              <dd className="mt-1 font-medium text-amber-950">
                {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
              </dd>
            </div>
          </dl>
        ) : (
          <p role="status" className="text-sm text-gray-600">
            Đang tải thông tin cá nhân...
          </p>
        )}
      </section>
    </main>
  );
}
