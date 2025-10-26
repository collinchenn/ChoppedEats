import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface Vibe {
  user: string
  message: string
  budget?: number
}

export interface RestaurantRecommendation {
  name: string
  cuisine: string
  priceRange: string
  description: string
  whyRecommended: string
}

export async function analyzeVibesAndRecommendRestaurants(
  vibes: Vibe[],
  location: string
): Promise<RestaurantRecommendation[]> {
  console.log("groq")
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set')
  }

  const vibeText = vibes.map(vibe =>
    `${vibe.user}: ${vibe.message}${vibe.budget ? ` (Budget: $${vibe.budget})` : ''}`
  ).join('\n')

  const prompt = `
You are a restaurant recommendation expert. Analyze the following dining preferences from a group of friends and recommend 3-5 restaurants that would satisfy the group's collective preferences.

Group Preferences:
${vibeText}

Location: ${location}

Please recommend restaurants that:
1. Match the group's cuisine preferences
2. Fit within the budget constraints mentioned
3. Are located in or near ${location}
4. Would appeal to the group's collective taste

For each restaurant, provide:
- Name
- Cuisine type
- Price range ($, $$, $$$, $$$$)
- The Yelp Rating
- The address, make sure to fetch from yelp for the address to ensure accuracy
- Brief description
- Why it's recommended for this group

Format your response as a JSON array of objects with the following structure:
[
  {
    "name": "Restaurant Name",
    "cuisine": "Cuisine Type",
    "priceRange": "$$",
    "description": "Brief description of the restaurant",
    "whyRecommended": "Why this restaurant fits the group's preferences"
  }
]

Only return the JSON array, no additional text.
`

  try {
    console.log('Calling Groq API with prompt...')
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 4096,
      top_p: 0.95,
      stream: false
    })

    const response = completion.choices[0]?.message?.content
    console.log('Raw Groq response:', response)

    if (!response) {
      throw new Error('No response from Groq')
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = response.trim()

    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    }

    // Remove any text before the first [ and after the last ]
    const jsonStart = cleanedResponse.indexOf('[')
    const jsonEnd = cleanedResponse.lastIndexOf(']')

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON array found in response')
    }

    cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1)

    console.log('Cleaned response:', cleanedResponse)

    // Parse the JSON response
    const recommendations = JSON.parse(cleanedResponse)

    if (!Array.isArray(recommendations)) {
      throw new Error('Response is not an array')
    }

    return recommendations
  } catch (error) {
    console.error('Error calling Groq API:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}

export async function generateRestaurantDescription(
  restaurantName: string,
  groupVibes: Vibe[]
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set')
  }

  const vibeText = groupVibes.map(vibe =>
    `${vibe.user}: ${vibe.message}${vibe.budget ? ` (Budget: $${vibe.budget})` : ''}`
  ).join('\n')

  const prompt = `
Generate a brief, engaging description for the restaurant "${restaurantName}" that would appeal to a group with these preferences:

${vibeText}

The description should be 1-2 sentences highlighting what makes this restaurant special and why it fits the group's vibe. Keep it conversational and appealing.
`

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 200,
      top_p: 0.95,
      stream: false
    })

    return completion.choices[0]?.message?.content || 'A great dining option for your group!'
  } catch (error) {
    console.error('Error generating description:', error)
    return 'A great dining option for your group!'
  }
}