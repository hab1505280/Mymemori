export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { word, meaning } = body;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `For the English word/phrase "${word}" (meaning: ${meaning}), return ONLY a JSON object:
{
  "phonetic": "IPA phonetic transcription like /wɜːrd/",
  "wordForm": "one of: noun, verb, adj, adv, phrase, other",
  "example": "a natural English sentence using this word",
  "exampleVi": "Vietnamese translation of that sentence",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "collocations": ["collocation phrase 1", "collocation phrase 2", "collocation phrase 3"]
}
Return only valid JSON, no explanation, no markdown.`
        }]
      })
    });

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
