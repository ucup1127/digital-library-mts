// app/api/test-redis/route.ts
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await redis.set('test-key', 'Hello Redis!', 'EX', 60);
    const value = await redis.get('test-key');
    return NextResponse.json({ success: true, value });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}