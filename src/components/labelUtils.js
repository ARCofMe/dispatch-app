export function technicianDisplayLabel(entity, technicianOptions = []) {
  const assignedOwnerLabel = normalizeLabel(entity?.assignedOwnerLabel);
  if (assignedOwnerLabel) return assignedOwnerLabel;

  const ownerLabel = normalizeLabel(entity?.ownerLabel || entity?.followUpOwnerLabel || entity?.follow_up_owner_label);
  if (ownerLabel) return ownerLabel;

  const option = findTechnicianOption(entity, technicianOptions);
  if (option) return option.label;

  const bluefolderUserId =
    entity?.ownerBluefolderUserId ??
    entity?.owner_bluefolder_user_id ??
    entity?.technicianBluefolderUserId ??
    entity?.bluefolderUserId;
  if (bluefolderUserId) return `Tech ${bluefolderUserId}`;

  const discordUserId = entity?.assignedOwnerDiscordUserId ?? entity?.ownerDiscordUserId ?? entity?.discordUserId;
  if (discordUserId) return `Dispatch ${discordUserId}`;

  return "unassigned";
}

export function buildTechnicianOptions(board) {
  return (board?.technicianLoad || [])
    .map((tech) => ({
      value: String(tech.bluefolderUserId || "").trim(),
      label: tech.technicianLabel || `Tech ${tech.bluefolderUserId}`,
      discordUserId: tech.discordUserId,
      bluefolderUserId: tech.bluefolderUserId,
      originAddress: tech.originAddress || "",
    }))
    .filter((tech) => tech.value)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function normalizeLabel(label) {
  if (!label) return "";
  const text = String(label).trim();
  if (!text) return "";
  if (/^<@\d+>$/.test(text)) return "";
  return text;
}

function findTechnicianOption(entity, technicianOptions) {
  const ownerBluefolderUserId =
    entity?.ownerBluefolderUserId ??
    entity?.owner_bluefolder_user_id ??
    entity?.technicianBluefolderUserId ??
    entity?.bluefolderUserId;
  if (ownerBluefolderUserId) {
    const match = technicianOptions.find((tech) => String(tech.bluefolderUserId) === String(ownerBluefolderUserId));
    if (match) return match;
  }

  const ownerDiscordUserId = entity?.assignedOwnerDiscordUserId ?? entity?.ownerDiscordUserId ?? entity?.discordUserId;
  if (ownerDiscordUserId) {
    return technicianOptions.find((tech) => String(tech.discordUserId) === String(ownerDiscordUserId)) || null;
  }

  return null;
}
