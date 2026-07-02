export function retiredUrlResponse() {
  return new Response("This legacy URL has been retired.", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
    status: 410,
  });
}
