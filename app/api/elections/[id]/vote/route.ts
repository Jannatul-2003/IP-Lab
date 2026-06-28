import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const election = await prisma.elections.findUnique({ where: { id: params.id } });
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });

    const isPhase1 = election.status === 'PHASE1_OPEN';
    const isPhase2 = election.status === 'PHASE2_OPEN';
    if (!isPhase1 && !isPhase2)
      return NextResponse.json({ error: 'Voting is not currently open' }, { status: 400 });

    const phase = isPhase1 ? 'phase1' : 'phase2';

    const member = await prisma.members.findUnique({ where: { user_id: user.userId } });
    if (!member) return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
    if (member.status !== 'ACTIVE')
      return NextResponse.json({ error: 'Only active members can vote' }, { status: 403 });

    // votes: [{ candidateId, position }]
    const { votes } = await request.json();
    if (!Array.isArray(votes) || votes.length === 0)
      return NextResponse.json({ error: 'votes array is required' }, { status: 400 });

    // Votes are anonymized (voter_id nulled) immediately after casting, so the
    // audit log — not the votes table — is the authoritative record of which
    // positions/phases this member has already voted in.
    const priorVoteLogs = await prisma.audit_log.findMany({
      where: {
        actor_id: user.userId as any,
        entity_type: 'elections',
        entity_id: params.id as any,
        action: 'VOTE_CAST',
      },
    });
    const hasVoted = (position: string) =>
      priorVoteLogs.some((log) => {
        const payload = log.payload as any;
        return payload?.position === position && payload?.phase === phase;
      });

    const results = [];

    for (const { candidateId, position } of votes) {
      if (hasVoted(position)) {
        return NextResponse.json(
          { error: `Already voted for ${position} in ${phase}` },
          { status: 409 }
        );
      }

      // Validate candidate
      const candidate = await prisma.candidates.findUnique({ where: { id: candidateId } });
      if (!candidate || candidate.election_id !== params.id || candidate.position !== position)
        return NextResponse.json({ error: `Invalid candidate for ${position}` }, { status: 400 });

      if (isPhase2 && !candidate.shortlisted)
        return NextResponse.json({ error: `Candidate not shortlisted for phase 2` }, { status: 400 });

      // Cast the vote, then immediately dissociate the voter from the ballot
      // (NFR-TC-005 voting anonymity) and record the action — without the
      // candidate choice — in the audit log for duplicate-vote detection.
      const vote = await prisma.$transaction(async (tx) => {
        const created = await tx.votes.create({
          data: {
            election_id: params.id,
            voter_id: member.id,
            candidate_id: candidateId,
            position,
            phase,
          },
        });

        const anonymized = await tx.votes.update({
          where: { id: created.id },
          data: { voter_id: null },
        });

        await tx.audit_log.create({
          data: {
            actor_id: user.userId as any,
            action: 'VOTE_CAST',
            entity_type: 'elections',
            entity_id: params.id as any,
            payload: { position, phase },
          },
        });

        if (isPhase1) {
          await tx.candidates.update({
            where: { id: candidateId },
            data: { phase1_votes: { increment: 1 } },
          });
        } else {
          await tx.candidates.update({
            where: { id: candidateId },
            data: { phase2_votes: { increment: 1 } },
          });
        }

        return anonymized;
      });

      results.push(vote);
    }

    return NextResponse.json({ message: 'Votes cast successfully', votes: results }, { status: 201 });
  } catch (error) {
    console.error('Cast vote error:', error);
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
  }
}
