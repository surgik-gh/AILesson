import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { OpenRouterService } from "@/lib/ai/openrouter";

interface SurveyData {
  learningStyle: string;
  preferredTone: string;
  expertiseLevel: string;
  interests: string[];
  communicationPreference: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const surveyData: SurveyData = await request.json();

    // Validate survey data
    if (
      !surveyData.learningStyle ||
      !surveyData.preferredTone ||
      !surveyData.expertiseLevel ||
      !surveyData.interests ||
      surveyData.interests.length === 0 ||
      !surveyData.communicationPreference
    ) {
      return NextResponse.json(
        { error: "Invalid survey data" },
        { status: 400 }
      );
    }

    // Generate expert using AI service
    const aiService = new OpenRouterService();
    const expertData = await aiService.generateExpert(surveyData);

    // Save expert to database
    const expert = await prisma.expert.create({
      data: {
        name: expertData.name,
        personality: expertData.personality,
        communicationStyle: expertData.communicationStyle,
        appearance: expertData.appearance,
        ownerId: session.user.id,
      },
    });

    // Update user's selectedExpertId
    await prisma.user.update({
      where: { id: session.user.id },
      data: { selectedExpertId: expert.id },
    });

    return NextResponse.json({
      success: true,
      expert: {
        id: expert.id,
        name: expert.name,
        personality: expert.personality,
        communicationStyle: expert.communicationStyle,
        appearance: expert.appearance,
      },
    });
  } catch (error) {
    console.error("Expert generation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate expert",
      },
      { status: 500 }
    );
  }
}
