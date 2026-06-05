const groupHomeTourStoragePrefix = "study-flow:new-group-home-tour";

function getGroupHomeTourStorageKey(userId: string, groupId: string) {
  return `${groupHomeTourStoragePrefix}:${userId}:${groupId}`;
}

export function markGroupHomeTourPending(userId: string, groupId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getGroupHomeTourStorageKey(userId, groupId), "pending");
}

export function hasPendingGroupHomeTour(userId: string, groupId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(getGroupHomeTourStorageKey(userId, groupId)) === "pending";
}

export function clearPendingGroupHomeTour(userId: string, groupId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getGroupHomeTourStorageKey(userId, groupId));
}
