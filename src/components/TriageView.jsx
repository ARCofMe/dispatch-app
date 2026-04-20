import { useMemo } from "react";
import AttentionView from "./AttentionView";
import { isTriageStage, triageStageLabel, TRIAGE_STAGES } from "./triageStages";

export default function TriageView(props) {
  const triageItems = useMemo(() => (props.items || []).filter((item) => isTriageStage(item.stage)), [props.items]);
  const selectedItem = props.selectedItem && isTriageStage(props.selectedItem.stage) ? props.selectedItem : null;
  const selectedItemDetail =
    props.selectedItemDetail?.item && isTriageStage(props.selectedItemDetail.item.stage) ? props.selectedItemDetail : null;

  const stageCounts = TRIAGE_STAGES
    .map((stage) => ({
      stage,
      label: triageStageLabel(stage),
      count: triageItems.filter((item) => item.stage === stage).length,
    }))
    .filter((entry) => entry.count > 0);

  const ownerGapCount = triageItems.filter(
    (item) => !(item.assignedOwnerBluefolderUserId || item.assignedOwnerDiscordUserId)
  ).length;
  const urgentCount = triageItems.filter((item) => String(item.ageBucket || "").toLowerCase() === "urgent").length;

  return (
    <div className="triage-stack">
      <section className="panel">
        <div className="routes-header triage-header">
          <div>
            <p className="section-kicker">Service manager workflow</p>
            <h2>Triage</h2>
            <p>Work only the front-end decisions: intake review, missing info, parts-first, diagnostic-first, and quote-before-schedule.</p>
          </div>
        </div>
        <div className="board-grid secondary">
          <article className="metric-card">
            <p>Triage items</p>
            <strong>{triageItems.length}</strong>
          </article>
          <article className="metric-card">
            <p>Urgent triage</p>
            <strong>{urgentCount}</strong>
          </article>
          <article className="metric-card">
            <p>Owner gaps</p>
            <strong>{ownerGapCount}</strong>
          </article>
          <article className="metric-card wide">
            <p>Triage stages</p>
            <div className="chip-list">
              {stageCounts.length ? (
                stageCounts.map((entry) => (
                  <span key={entry.stage} className="queue-chip">
                    {entry.label}: {entry.count}
                  </span>
                ))
              ) : (
                <span className="muted">No triage-stage items are active right now.</span>
              )}
            </div>
          </article>
        </div>
      </section>

      <AttentionView
        {...props}
        items={triageItems}
        selectedItem={selectedItem}
        selectedItemDetail={selectedItemDetail}
        complaintIntelligence={props.complaintIntelligence}
      />
    </div>
  );
}
