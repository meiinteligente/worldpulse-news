/**
 * API Route: POST /api/robot
 *
 * Dispara o robô de coleta de notícias.
 * Protegido por CRON_SECRET para uso com Vercel Cron Jobs ou serviços externos.
 *
 * Pode ser chamado:
 * - Via Vercel Cron Job (vercel.json)
 * - Via curl: POST /api/robot com header Authorization: Bearer <CRON_SECRET>
 * - Via dashboard admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { runRobot } from '@/lib/robot'

export const runtime = 'nodejs'
export const maxDuration = 300  // 5 minutos (plano Pro Vercel)

export async function POST(request: NextRequest) {
  // Autenticação por secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const body = await request.json().catch(() => ({}))
    const maxSources = body.maxSources || 50
    const maxItemsPerSource = body.maxItemsPerSource || 10

    const result = await runRobot({ maxSources, maxItemsPerSource })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error) {
    console.error('Robot API error:', error)
    return NextResponse.json(
      { error: 'Robot failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET para health check
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Send POST with Authorization: Bearer <CRON_SECRET> to trigger',
    timestamp: new Date().toISOString(),
  })
}
