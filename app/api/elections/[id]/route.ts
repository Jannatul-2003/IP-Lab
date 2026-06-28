import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES, PRESIDENT_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

const STATUS_TRANSITIONS: Record<string, string> = {
  DRAFT: 'PHASE1_OPEN',
  PHASE1_OPEN: 'SHORTLISTING',
  SHORTLISTING: 'PHASE2_OPEN',
  PHASE2_OPEN: 'COMPLETED',
};

// Maps a constitutional EC position title to its app-level access role.
// Only President and General Secretary carry elevated roles; all other
// portfolios (Treasurer, Cultural/Sports/IT Secretary, etc.) are EC_OFFICER.
function mapPositionToRole(position: string): string {
  const p = position.toLowerCase();
  if (p.includes('president')) return 'PRESIDENT';
  if (p.includes('general secretary')) return 'SECRETARY';
  return 'EC_OFFICER';
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const election = await prisma.elections.findUnique({
      where: { id: params.id },
      include: {
        term: { select: { id: true, term_number: true, status: true } },
        candidates: {
          include: { member: { select: { full_name: true, student_id: true } } },
        },
      },
    });
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    return NextResponse.json(election, { status: 200 });
  } catch (error) {
    console.error('Get election error:', error);
    return NextResponse.json({ error: 'Failed to fetch election' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!PRESIDENT_ROLES.includes(user.role) && user.role !== 'SECRETARY')
      return NextResponse.json({ error: 'Forbidden — only PRESIDENT/SECRETARY/ADMIN' }, { status: 403 });

    const election = await prisma.elections.findUnique({ where: { id: params.id } });
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });

    const body = await request.json();

    // Phase transition
    if (body.action === 'advance') {
      const nextStatus = STATUS_TRANSITIONS[election.status];
      if (!nextStatus)
        return NextResponse.json({ error: 'No next transition available' }, { status: 400 });

      // Auto-shortlist when closing phase 1
      if (election.status === 'PHASE1_OPEN') {
        const positions = await prisma.candidates.groupBy({
          by: ['position'],
          where: { election_id: params.id },
        });
        for (const { position } of positions) {
          const top = await prisma.candidates.findMany({
            where: { election_id: params.id, position },
            orderBy: { phase1_votes: 'desc' },
            take: election.shortlist_n,
          });
          await prisma.candidates.updateMany({
            where: { election_id: params.id, position },
            data: { shortlisted: false },
          });
          for (const c of top) {
            await prisma.candidates.update({ where: { id: c.id }, data: { shortlisted: true } });
          }
        }
      }

      // Mark winners when completing phase 2, then promote them into the EC role
      if (election.status === 'PHASE2_OPEN') {
        const positions = await prisma.candidates.groupBy({
          by: ['position'],
          where: { election_id: params.id, shortlisted: true },
        });
        for (const { position } of positions) {
          const winner = await prisma.candidates.findFirst({
            where: { election_id: params.id, position, shortlisted: true },
            orderBy: { phase2_votes: 'desc' },
            include: { member: true },
          });
          if (winner) {
            await prisma.candidates.update({ where: { id: winner.id }, data: { winner: true } });

            const role = mapPositionToRole(position);
            await prisma.users.update({
              where: { id: winner.member.user_id },
              data: { role },
            });

            await prisma.ec_role_holders.upsert({
              where: { term_id_role_title: { term_id: election.term_id, role_title: position } },
              update: { member_id: winner.member_id, assigned_by: user.userId, assigned_date: new Date() },
              create: {
                term_id: election.term_id,
                member_id: winner.member_id,
                role_title: position,
                assigned_by: user.userId,
              },
            });

            await prisma.audit_log.create({
              data: {
                actor_id: user.userId as any,
                action: 'EC_ROLE_ASSIGNED',
                entity_type: 'ec_role_holders',
                entity_id: winner.member_id as any,
                payload: { position, role, electionId: params.id },
              },
            });
          }
        }
      }

      const updated = await prisma.elections.update({
        where: { id: params.id },
        data: { status: nextStatus },
      });

      await prisma.audit_log.create({
        data: {
          actor_id: user.userId as any,
          action: `ELECTION_TRANSITION_${nextStatus}`,
          entity_type: 'elections',
          entity_id: params.id as any,
        },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    // General update (dates, shortlist_n)
    const updated = await prisma.elections.update({
      where: { id: params.id },
      data: {
        phase1_start: body.phase1Start ? new Date(body.phase1Start) : undefined,
        phase1_end: body.phase1End ? new Date(body.phase1End) : undefined,
        phase2_start: body.phase2Start ? new Date(body.phase2Start) : undefined,
        phase2_end: body.phase2End ? new Date(body.phase2End) : undefined,
        shortlist_n: body.shortlistN ?? undefined,
      },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Update election error:', error);
    return NextResponse.json({ error: 'Failed to update election' }, { status: 500 });
  }
}
