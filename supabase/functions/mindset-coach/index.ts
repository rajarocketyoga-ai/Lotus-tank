import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { preMood, postMood, sessionTitle, sessionType, niche, userName, type } = await req.json()

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing OpenAI API Key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = `You are the AI Mindset Coach for "Calm Quest", a mental wellness companion for the Raja Rocket Yoga community. 
    Your tone is regal (Raja), dynamic (Rocket), and supportive. 
    You provide short, punchy, and inspiring reflections based on the user's progress.`

    let userPrompt = '';
    if (type === 'daily-affirmation') {
      userPrompt = `Give me a daily mindset affirmation for a user in the "${niche}" niche. User name: ${userName || 'Warrior'}. 
      Keep it under 40 words and make it sound regal and inspiring. Reference their "quest" for calm.`
    } else {
      userPrompt = `
        User: ${userName || 'Warrior'}
        Niche: ${niche || 'General Wellness'}
        Session Completed: "${sessionTitle}" (${sessionType})
        Mood Before: ${preMood}/5
        Mood After: ${postMood}/5

        Based on this, give me a personalized mindset tip or reflection. 
        Keep it under 60 words. 
        Focus on the shift in mood and the effort they put in today.
      `
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    })

    const aiData = await response.json()
    
    if (aiData.error) {
      console.error('OpenAI API Error:', aiData.error)
      throw new Error(aiData.error.message)
    }

    const coachInsight = aiData.choices[0].message.content

    return new Response(
      JSON.stringify({ insight: coachInsight }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
