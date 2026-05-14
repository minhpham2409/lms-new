-- CreateIndex
CREATE INDEX "Assignment_lessonId_idx" ON "Assignment"("lessonId");

-- CreateIndex
CREATE INDEX "Lesson_sectionId_idx" ON "Lesson"("sectionId");

-- CreateIndex
CREATE INDEX "Material_lessonId_idx" ON "Material"("lessonId");

-- CreateIndex
CREATE INDEX "ParentChild_parentId_idx" ON "ParentChild"("parentId");

-- CreateIndex
CREATE INDEX "ParentChild_childId_idx" ON "ParentChild"("childId");

-- CreateIndex
CREATE INDEX "ParentChild_status_idx" ON "ParentChild"("status");

-- CreateIndex
CREATE INDEX "VideoProgress_userId_idx" ON "VideoProgress"("userId");

-- CreateIndex
CREATE INDEX "VideoProgress_lessonId_idx" ON "VideoProgress"("lessonId");
