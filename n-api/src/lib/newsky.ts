const BASE_URL = "https://newsky.app/api/airline-api"

export async function fetchRecentFlights({ count = 5 }: { count?: number }) {
  const apiKey = process.env.NEWSKY_API_KEY
  if (!apiKey) throw new Error("Missing Newsky API key")

  const res = await fetch(`${BASE_URL}/flights/recent`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      count,
      skip: 0,
      includeDeleted: false
    })
  })

  if (!res.ok) throw new Error(`Newsky API error: ${res.status}`)
  return res.json()
}
