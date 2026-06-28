import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireAuth } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// POST - Cast a vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);
    const authError = requireAuth(user);
    if (authError) {
      return NextResponse.json(
        { error: authError.error },
        { status: authError.status }
      );
    }

    const { candidateId, position, phase } = await request.json();

    if (!candidateId || !position || !phase) {
      return NextResponse.json(
        { error: 'candidateId, position, and phase are required' },
        { status: 400 }
      );
    }

    // Verify election exists and is in voting phase
    const election = await prisma.elections.findUnique({
      where: { id },
    });

    if (!election) {
      return NextResponse.json(
        { error: 'Election not found' },
        { status: 404 }
      );
    }

    // Check if election is active for this phase
    const now = new Date();
    if (phase === 'phase1') {
      if (now < election.phase1_start || now > election.phase1_end) {
        return NextResponse.json(
          { error: 'Phase 1 voting is not active' },
          { status: 400 }
        );
      }
    } else if (phase === 'phase2') {
      if (!election.phase2_start || !election.phase2_end) {
        return NextResponse.json(
          { error: 'Phase 2 is not available' },
          { status: 400 }
        );
      }
      if (now < election.phase2_start || now > election.phase2_end) {
        return NextResponse.json(
          { error: 'Phase 2 voting is not active' },
          { status: 400 }
        );
      }
    }

    // Get voter's member profile
    const member = await prisma.members.findUnique({
      where: { user_id: user!.userId },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member profile not found' },
        { status: 404 }
      );
    }

    // Verify candidate exists
    const candidate = await prisma.candidates.findUnique({
      where: { id: candidateId },
    });

    if (!candidate || candidate.election_id !== id) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Check if voter already voted for this position in this phase
    const existingVote = await prisma.votes.findFirst({
      where: {
        election_id: id,
        voter_id: member.id,
        position,
        phase,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted for this position in this phase' },
        { status: 409 }
      );
    }

    // Create vote
    const vote = await prisma.votes.create({
      data: {
        election_id: id,
        voter_id: member.id,
        candidate_id: candidateId,
        position,
        phase,
      },
      include: {
        candidate: {
          select: { id: true, member: { select: { full_name: true } } },
        },
      },
    });

    // Increment vote count for candidate
    const phaseVoteField = phase === 'phase1' ? 'phase1_votes' : 'phase2_votes';
    await prisma.candidates.update({
      where: { id: candidateId },
      data: {
        [phaseVoteField]: { increment: 1 },
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'CAST_VOTE',
        entity_type: 'votes',
        entity_id: vote.id as any,
        payload: { candidateId, position, phase },
      },
    });

    return NextResponse.json(
      { message: 'Vote recorded successfully', vote },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cast vote error:', error);
    return NextResponse.json(
      { error: 'Failed to cast vote' },
      { status: 500 }
    );
  }
}

// GET - Get voting status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);
    const authError = requireAuth(user);
    if (authError) {
      return NextResponse.json(
        { error: authError.error },
        { status: authError.status }
      );
    }

    const member = await prisma.members.findUnique({
      where: { user_id: user!.userId },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member profile not found' },
        { status: 404 }
      );
    }

    const votes = await prisma.votes.findMany({
      where: {
        election_id: id,
        voter_id: member.id,
      },
      select: {
        position: true,
        phase: true,
      },
    });

    return NextResponse.json(
      {
        votedFor: votes,
        positions: votes.map((v) => `${v.position}-${v.phase}`),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get voting status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voting status' },
      { status: 500 }
    );
  }
}
