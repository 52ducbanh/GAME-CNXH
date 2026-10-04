import { VOTE_DURATION_MS } from 'shared';
import type { Player, VoteState, ServerAck, PersonalContribution, AuditEvent } from 'shared';
interface VotingPorts {
  players: ReadonlyMap<string,Player>;
  onlineCount():number;
  contribution(id:string):PersonalContribution|undefined;
  audit(category:AuditEvent['category'],message:string,playerId?:string):void;
  commit(missionId:'M1'|'M2'|null,plan:string):void;
}
export class VotingCapability {
  public state:VoteState|null=null;
  constructor(private readonly ports:VotingPorts){}
  public start(missionId: 'M1' | 'M2', plan: string, proposer: Player) {
    const onlineCount = this.ports.onlineCount();
    const votes: Record<string, string> = { [proposer.id]: plan };

    this.state = {
      active: true,
      missionId,
      proposedPlan: plan,
      proposerId: proposer.id,
      proposerName: proposer.name,
      remainingMs: VOTE_DURATION_MS,
      endsAt: Date.now() + VOTE_DURATION_MS,
      totalOnlineVoters: onlineCount,
      votes
    };

    const contrib = this.ports.contribution(proposer.id);
    if (contrib) {
      contrib.plansProposed++;
      contrib.votesParticipated++;
    }

    this.ports.audit('VOTE', `${proposer.name} đã đề xuất phương án ${plan} cho ${missionId}. Mở biểu quyết tập thể (15s).`, proposer.id);

    // Solo instant pass
    if (onlineCount <= 1) {
      this.resolve();
    }
  }

  public cast(player: Player, plan: string, actionId: string): ServerAck {
    if (!this.state || !this.state.active) {
      return { actionId, success: false, reason: 'Không có phiên biểu quyết nào đang mở.' };
    }

    this.state.votes[player.id] = plan;
    const contrib = this.ports.contribution(player.id);
    if (contrib) contrib.votesParticipated++;

    this.ports.audit('VOTE', `${player.name} đã bỏ phiếu cho phương án: ${plan}.`, player.id);

    // If all online players have voted, close vote early!
    let allVoted = true;
    for (const p of this.ports.players.values()) {
      if (p.isOnline && !this.state.votes[p.id]) {
        allVoted = false;
        break;
      }
    }

    if (allVoted) {
      this.resolve();
    }

    return { actionId, success: true };
  }

  public resolve() {
    if (!this.state || !this.state.active) return;
    this.state.active = false;

    const { missionId, proposedPlan, proposerId, votes } = this.state;
    const tallies: Record<string, number> = {};

    for (const chosen of Object.values(votes)) {
      tallies[chosen] = (tallies[chosen] || 0) + 1;
    }

    let winningPlan = proposedPlan;
    let maxVotes = -1;

    for (const [p, count] of Object.entries(tallies)) {
      if (count > maxVotes) {
        maxVotes = count;
        winningPlan = p;
      } else if (count === maxVotes) {
        // Tie-breaker: prioritize proposer's choice
        const proposerVote = votes[proposerId];
        if (proposerVote) winningPlan = proposerVote;
      }
    }

    this.ports.commit(missionId, winningPlan);

    this.state = null;
  }
}
