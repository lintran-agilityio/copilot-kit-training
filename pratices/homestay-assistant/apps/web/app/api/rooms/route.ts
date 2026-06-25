const getApiUrl = () => process.env.API_URL ?? "http://localhost:5001";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const path = date
    ? `/rooms?date=${encodeURIComponent(date)}`
    : "/rooms";

  const response = await fetch(`${getApiUrl()}${path}`);

  if (!response.ok) {
    return Response.json(
      { error: "Failed to fetch rooms" },
      { status: response.status },
    );
  }

  return Response.json(await response.json());
}
