import type { ProjectImage } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@tiladys/db";

type PublicProjectImage = Pick<
  ProjectImage,
  "id" | "alt" | "sortOrder"
>;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const project = await db.project.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      images: {
        select: {
          id: true,
          alt: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const origin = req.nextUrl.origin;

  const images = project.images.map(
    (image: PublicProjectImage) => ({
      ...image,
      url: `${origin}/api/public/media/${image.id}`,
    })
  );

  return NextResponse.json(
    {
      ...project,
      images,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}