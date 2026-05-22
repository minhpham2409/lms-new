-- Migration: Merge Material table into Lesson.materials JSON column
-- Step 1: Add materials JSON column to Lesson
ALTER TABLE "Lesson" ADD COLUMN "materials" JSONB;

-- Step 2: Migrate existing materials into JSON arrays
UPDATE "Lesson" l
SET "materials" = (
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', m.id,
        'title', m.title,
        'description', m.description,
        'fileUrl', m."fileUrl",
        'fileType', m."fileType",
        'fileSize', m."fileSize"
      ) ORDER BY m."createdAt"
    ),
    '[]'::json
  )
  FROM "Material" m
  WHERE m."lessonId" = l.id
)
WHERE EXISTS (SELECT 1 FROM "Material" m WHERE m."lessonId" = l.id);

-- Step 3: Drop Material table
DROP TABLE IF EXISTS "Material" CASCADE;
