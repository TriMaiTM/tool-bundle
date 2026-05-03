import { useState, useCallback, useMemo } from "preact/hooks";

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const GRADE_OPTIONS = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"] as const;

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0, A: 4.0, "A-": 3.7,
  "B+": 3.3, B: 3.0, "B-": 2.7,
  "C+": 2.3, C: 2.0, "C-": 1.7,
  "D+": 1.3, D: 1.0, "D-": 0.7,
  F: 0.0,
};

export default function GpaCalculator() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState("");
  const [credits, setCredits] = useState("3");
  const [grade, setGrade] = useState("A");
  const [editId, setEditId] = useState<string | null>(null);
  const [semesterCourses, setSemesterCourses] = useState<Course[]>([]);
  const [showSemester, setShowSemester] = useState(false);

  const addCourse = useCallback(() => {
    const c = parseInt(credits);
    if (isNaN(c) || c < 1 || c > 6) return;
    if (!GRADE_POINTS.hasOwnProperty(grade)) return;

    if (editId) {
      const updater = (prev: Course[]) =>
        prev.map(cr =>
          cr.id === editId
            ? { ...cr, name: courseName.trim() || "Unnamed Course", credits: c, grade }
            : cr
        );
      setCourses(updater);
      setSemesterCourses(updater);
      setEditId(null);
    } else {
      const newCourse: Course = {
        id: generateId(),
        name: courseName.trim() || "Unnamed Course",
        credits: c,
        grade,
      };
      setCourses(prev => [...prev, newCourse]);
      setSemesterCourses(prev => [...prev, newCourse]);
    }
    setCourseName("");
    setCredits("3");
    setGrade("A");
  }, [courseName, credits, grade, editId]);

  const deleteCourse = useCallback((id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    setSemesterCourses(prev => prev.filter(c => c.id !== id));
  }, []);

  const startEdit = useCallback((course: Course) => {
    setCourseName(course.name);
    setCredits(String(course.credits));
    setGrade(course.grade);
    setEditId(course.id);
  }, []);

  const clearAll = useCallback(() => {
    setCourses([]);
    setSemesterCourses([]);
  }, []);

  const activeCourses = showSemester ? semesterCourses : courses;

  const gpaResult = useMemo(() => {
    if (activeCourses.length === 0) return null;
    let totalPoints = 0;
    let totalCredits = 0;
    activeCourses.forEach(c => {
      const pts = GRADE_POINTS[c.grade] ?? 0;
      totalPoints += c.credits * pts;
      totalCredits += c.credits;
    });
    if (totalCredits === 0) return null;
    return {
      gpa: totalPoints / totalCredits,
      totalCredits,
      totalPoints,
    };
  }, [activeCourses]);

  const gpaColor = useMemo(() => {
    if (!gpaResult) return "";
    if (gpaResult.gpa >= 3.5) return "text-accent-emerald";
    if (gpaResult.gpa >= 2.5) return "text-yellow-500";
    return "text-accent-rose";
  }, [gpaResult]);

  return (
    <div class="space-y-6">
      {/* Toggle */}
      <div class="flex gap-2">
        <button
          class={!showSemester ? "btn-primary" : "btn-secondary"}
          onClick={() => setShowSemester(false)}
        >
          Cumulative GPA
        </button>
        <button
          class={showSemester ? "btn-primary" : "btn-secondary"}
          onClick={() => setShowSemester(true)}
        >
          Semester GPA
        </button>
      </div>

      {/* Input */}
      <div class="bg-surface-elevated rounded-lg p-3">
        <h3 class="text-title-lg text-primary mb-4">{editId ? "Edit Course" : "Add Course"}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Course Name (optional)</label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. Calculus I"
              value={courseName}
              onInput={(e) => setCourseName((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Credits (1-6)</label>
            <input
              type="number"
              class="input w-full"
              min={1}
              max={6}
              value={credits}
              onInput={(e) => setCredits((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Grade</label>
            <select
              class="input w-full"
              value={grade}
              onChange={(e) => setGrade((e.target as HTMLSelectElement).value)}
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g} ({GRADE_POINTS[g].toFixed(1)})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn-primary" onClick={addCourse}>
            {editId ? "Update Course" : "Add Course"}
          </button>
          {editId && (
            <button
              class="btn-secondary"
              onClick={() => {
                setEditId(null);
                setCourseName("");
                setCredits("3");
                setGrade("A");
              }}
            >
              Cancel
            </button>
          )}
          {activeCourses.length > 0 && (
            <button class="btn-secondary" onClick={clearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {activeCourses.length > 0 && (
        <div class="bg-surface-elevated rounded-lg p-3">
          <h3 class="text-title-lg text-primary mb-4">Courses ({activeCourses.length})</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-body-sm">
              <thead>
                <tr class="border-b border-hairline">
                  <th class="text-left text-caption-uppercase text-muted py-2 px-3">Course</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">Credits</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">Grade</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">Points</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeCourses.map((course) => (
                  <tr key={course.id} class="border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors">
                    <td class="py-2 px-3">{course.name}</td>
                    <td class="py-2 px-3 text-right">{course.credits}</td>
                    <td class="py-2 px-3 text-right">
                      <span class="badge">{course.grade}</span>
                    </td>
                    <td class="py-2 px-3 text-right text-primary">{GRADE_POINTS[course.grade]?.toFixed(1) ?? "0.0"}</td>
                    <td class="py-2 px-3 text-right">
                      <div class="flex justify-end gap-2">
                        <button class="btn-secondary text-body-sm" onClick={() => startEdit(course)}>
                          Edit
                        </button>
                        <button class="btn-secondary text-body-sm" onClick={() => deleteCourse(course.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {gpaResult && (
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class={`text-title-lg ${gpaColor}`}>{gpaResult.gpa.toFixed(2)}</div>
            <div class="text-caption text-muted mt-1">{showSemester ? "Semester" : "Cumulative"} GPA</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{gpaResult.totalCredits}</div>
            <div class="text-caption text-muted mt-1">Total Credits</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{gpaResult.totalPoints.toFixed(1)}</div>
            <div class="text-caption text-muted mt-1">Total Quality Points</div>
          </div>
        </div>
      )}

      {/* GPA Color Legend */}
      <div class="bg-surface-elevated rounded-lg p-3">
        <h3 class="text-title-lg text-primary mb-3">GPA Scale</h3>
        <div class="flex flex-wrap gap-3 text-body-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-accent-emerald"></div>
            <span class="text-muted">3.5+ (Excellent)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span class="text-muted">2.5 - 3.5 (Good)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-accent-rose"></div>
            <span class="text-muted">&lt; 2.5 (Needs Improvement)</span>
          </div>
        </div>
      </div>

      {/* Grade Points Reference */}
      <div class="bg-surface-elevated rounded-lg p-3">
        <h3 class="text-title-lg text-primary mb-3">Grade Points Reference</h3>
        <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2 text-body-sm">
          {GRADE_OPTIONS.map((g) => (
            <div key={g} class="p-2 border border-hairline rounded-lg text-center">
              <div class="text-body-strong">{g}</div>
              <div class="text-muted">{GRADE_POINTS[g].toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
