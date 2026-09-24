/**
 * Writes a read-only snapshot of one Course for a learning platform (the
 * Native Stride Academy): its latest Version's Sections, Lessons and Videos —
 * title, lesson body, description, chapters — plus the path of each Video's
 * Exported Video on disk, when it has an up-to-date one.
 *
 * The export path comes from CoursePublishService.resolveExportPath, the same
 * answer the Export and Publish pipelines use, so a Video counts as exported
 * here exactly when the app itself says it is.
 *
 * Nothing is written to the database.
 *
 * Usage: tsx scripts/export-academy.ts <courseId> <out.json>
 */
import { existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Effect } from "effect";
import { runtimeLive } from "@/services/layer.server";
import { CoursePublishService } from "@/services/course-publish-service";
import { VersionOperationsService } from "@/services/db-version-operations.server";

const [courseId, outPath] = process.argv.slice(2);
if (!courseId || !outPath) {
  console.error("Usage: tsx scripts/export-academy.ts <courseId> <out.json>");
  process.exit(1);
}

const probeDuration = (file: string): number | null => {
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        file,
      ],
      { encoding: "utf8" }
    );
    const seconds = Number(out.trim());
    return Number.isFinite(seconds) ? Math.round(seconds) : null;
  } catch {
    return null;
  }
};

const program = Effect.gen(function* () {
  const versionOps = yield* VersionOperationsService;
  const publish = yield* CoursePublishService;

  const version = yield* versionOps.getLatestCourseVersion(courseId);
  if (!version) {
    return yield* Effect.fail(new Error(`Course ${courseId} has no Version`));
  }

  const course = yield* versionOps.getCourseWithSectionsByVersion({
    repoId: courseId,
    versionId: version.id,
  });

  const sections = [];
  for (const section of course.sections) {
    const lessons = [];
    for (const lesson of section.lessons) {
      const videos = [];
      for (const video of lesson.videos.filter((v) => !v.archived)) {
        const exportPath = yield* publish.resolveExportPath(video.id);
        const exported = exportPath !== null && existsSync(exportPath);
        videos.push({
          id: video.id,
          title: video.title,
          description: video.description,
          body: video.body,
          exportPath: exported ? exportPath : null,
          durationSeconds: exported ? probeDuration(exportPath) : null,
          chapters: video.chapters.map((chapter) => ({
            id: chapter.id,
            title: chapter.name,
          })),
          updatedAt: video.updatedAt,
        });
      }
      lessons.push({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        videos,
      });
    }
    sections.push({
      id: section.id,
      title: section.title,
      description: section.description,
      lessons,
    });
  }

  return {
    exportedAt: new Date().toISOString(),
    course: {
      id: course.id,
      name: course.name,
      slug: course.slug,
      versionId: version.id,
    },
    sections,
  };
});

const snapshot = await runtimeLive.runPromise(program);
writeFileSync(outPath, JSON.stringify(snapshot, null, 2));

const videos = snapshot.sections.flatMap((s) =>
  s.lessons.flatMap((l) => l.videos)
);
console.log(
  `${snapshot.course.name}: ${snapshot.sections.length} sections, ` +
    `${videos.length} videos, ${videos.filter((v) => v.exportPath).length} exported → ${outPath}`
);
await runtimeLive.dispose();
