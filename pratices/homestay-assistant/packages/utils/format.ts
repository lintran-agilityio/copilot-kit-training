export const formatPrice = (pricePerNight?: number) => {
  if (pricePerNight == null) {
    return null;
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(pricePerNight);
};

export const countNightOfDates = (checkIn: string, checkOut: string) => {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
};

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
