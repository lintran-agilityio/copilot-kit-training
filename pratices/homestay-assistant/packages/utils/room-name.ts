export const normalizeRoomName = (name: string) => name.trim().toLowerCase();

export const matchesRoomName = (roomName: string, query: string) => {
  const normalizedRoom = normalizeRoomName(roomName);
  const normalizedQuery = normalizeRoomName(query);

  return (
    normalizedRoom === normalizedQuery ||
    normalizedRoom.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedRoom)
  );
};
