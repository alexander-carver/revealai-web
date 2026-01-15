import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const perplexityApiKey = process.env.PERPLEXITY_API_KEY!;

// Rate limits
const FREE_USER_DAILY_LIMIT = 10; // 10 searches per day for free users
const PRO_USER_DAILY_LIMIT = 100; // 100 searches per day for Pro users (generous limit)

export async function POST(request: NextRequest) {
  try {
    const { query, userId, usePro = false, isPro = false } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Missing query" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // PRO USERS ONLY - Block all free users
    if (!isPro) {
      return NextResponse.json(
        { 
          error: "Pro subscription required",
          message: "Search is only available for Pro subscribers. Please upgrade to continue.",
        },
        { status: 403 }
      );
    }

    // Check rate limits before making API call
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Count searches in the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const { count, error: countError } = await supabase
      .from("perplexity_searches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", twentyFourHoursAgo.toISOString());

    if (countError) {
      console.error("Error counting searches:", countError);
      // Don't block the request if counting fails, but log it
    }

    const searchCount = count || 0;

    if (searchCount >= PRO_USER_DAILY_LIMIT) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          message: `You've reached your daily limit of ${PRO_USER_DAILY_LIMIT} searches. Please try again tomorrow.`,
          limit: PRO_USER_DAILY_LIMIT,
          remaining: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { status: 429 }
      );
    }

    // Simple prompt - let Perplexity do its thing naturally
    const systemPrompt = `You are a helpful research assistant. Search the web for information about the person and provide a comprehensive profile. Include any images you find. Be thorough but concise.`;

    // Call Perplexity API with images enabled
    const model = usePro ? "sonar-pro" : "sonar";
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: query,
          },
        ],
        return_images: true,
        return_related_questions: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", errorText);
      return NextResponse.json(
        { error: "Search failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const content = data.choices?.[0]?.message?.content;
    
    // Images can be in different places depending on API version
    // Check multiple possible locations
    const images = data.images || 
                   data.choices?.[0]?.message?.images ||
                   data.choices?.[0]?.images ||
                   [];
    
    // Citations can also be in different places
    const citations = data.citations || 
                      data.choices?.[0]?.message?.citations ||
                      data.choices?.[0]?.citations ||
                      [];
    
    const relatedQuestions = data.related_questions || 
                             data.choices?.[0]?.message?.related_questions ||
                             [];

    if (!content) {
      return NextResponse.json(
        { error: "No results found" },
        { status: 404 }
      );
    }

    // Log search in Supabase for tracking (reuse the supabase client from earlier)
    await supabase.from("perplexity_searches").insert({
      user_id: userId,
      query,
      model,
      created_at: new Date().toISOString(),
    });

    // Return everything for debugging
    return NextResponse.json({
      success: true,
      content,
      citations,
      images,
      relatedQuestions,
      model,
      remaining: PRO_USER_DAILY_LIMIT - (searchCount + 1), // +1 because we're about to log this search
      limit: PRO_USER_DAILY_LIMIT,
      // Include raw response keys for debugging
      _debug: {
        responseKeys: Object.keys(data),
        choiceKeys: data.choices?.[0] ? Object.keys(data.choices[0]) : [],
        messageKeys: data.choices?.[0]?.message ? Object.keys(data.choices[0].message) : [],
        hasImages: !!data.images,
        hasCitations: !!data.citations,
        imagesLength: images.length,
        citationsLength: citations.length,
      }
    });
  } catch (error: any) {
    console.error("Perplexity search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}

