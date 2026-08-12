type CollaborationOwnerIds = {
  brandUserId?: unknown;
  brandProfileId?: unknown;
  creatorUserId?: unknown;
  creatorProfileId?: unknown;
  createdByClerkId?: string;
  creatorUsername?: string;
};

function idsMatch(value: unknown, id: unknown) {
  return Boolean(value && id && value.toString() === id.toString());
}

export function canViewCollaborationDetails(
  collaboration: CollaborationOwnerIds,
  user: { _id: unknown; clerkId: string; username: string; role: string },
  profileId?: unknown,
) {
  if (user.role === "creator") {
    return collaboration.creatorUsername === user.username || idsMatch(collaboration.creatorUserId, user._id) || idsMatch(collaboration.creatorProfileId, profileId);
  }
  if (user.role === "brand") {
    return collaboration.createdByClerkId === user.clerkId || idsMatch(collaboration.brandUserId, user._id) || idsMatch(collaboration.brandProfileId, profileId);
  }
  return false;
}
