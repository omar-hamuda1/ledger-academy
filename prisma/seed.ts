import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Public-domain sample clip (Google Cloud's well-known test video bucket) used
// as a stand-in lesson video until real course footage is uploaded.
const TEST_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

const courses = [
  {
    slug: "grade-10-business-administration",
    grade: "الصف الأول الثانوي",
    title: "مبادئ إدارة الأعمال",
    description:
      "أساسيات علم الإدارة، وظائفها، ونشأة المشروعات بأسلوب مبسط ومشوّق لبناء قاعدة علمية قوية.",
    price: 199,
    modules: [
      {
        title: "مفهوم الإدارة ووظائفها",
        lessons: ["ما هي الإدارة؟", "وظائف الإدارة الأربع"],
      },
      {
        title: "أنواع المشروعات",
        lessons: ["المشروعات الفردية والجماعية", "مراجعة وامتحان الوحدة"],
      },
    ],
  },
  {
    slug: "grade-11-business-administration",
    grade: "الصف الثاني الثانوي",
    title: "الإدارة والتسويق والموارد البشرية",
    description:
      "التعمق في وظائف التسويق وإدارة الموارد البشرية مع تطبيقات عملية على أرض الواقع.",
    price: 249,
    modules: [
      {
        title: "أساسيات التسويق الحديث",
        lessons: ["المزيج التسويقي", "سلوك المستهلك"],
      },
      {
        title: "إدارة الموارد البشرية",
        lessons: ["الاستقطاب والتعيين", "دراسات حالة واقعية"],
      },
    ],
  },
  {
    slug: "grade-12-business-administration",
    grade: "الصف الثالث الثانوي",
    title: "الإدارة الاستراتيجية والاقتصاد التطبيقي",
    description:
      "إعداد كامل لامتحان الثانوية العامة مع التركيز على التفكير الاستراتيجي وحل المسائل.",
    price: 299,
    modules: [
      {
        title: "التخطيط الاستراتيجي",
        lessons: ["مراحل التخطيط الاستراتيجي", "تحليل SWOT"],
      },
      {
        title: "مراجعات نهائية",
        lessons: ["مراجعة شاملة على المنهج", "بنك أسئلة امتحانات سابقة"],
      },
    ],
  },
];

async function main() {
  const instructor = await db.user.upsert({
    where: { email: "instructor@example.com" },
    update: { name: "محمد حسين", role: Role.ADMIN },
    create: {
      name: "محمد حسين",
      email: "instructor@example.com",
      passwordHash: await bcrypt.hash("password123", 12),
      role: Role.ADMIN,
    },
  });

  await db.course.deleteMany({ where: { slug: "accounting-fundamentals" } });

  for (const courseData of courses) {
    const course = await db.course.upsert({
      where: { slug: courseData.slug },
      update: {
        title: courseData.title,
        description: courseData.description,
        grade: courseData.grade,
        price: courseData.price,
      },
      create: {
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        grade: courseData.grade,
        price: courseData.price,
        isPublished: true,
        instructorId: instructor.id,
        modules: {
          create: courseData.modules.map((module, moduleIndex) => ({
            title: module.title,
            order: moduleIndex + 1,
            lessons: {
              create: module.lessons.map((lessonTitle, lessonIndex) => ({
                title: lessonTitle,
                order: lessonIndex + 1,
                videoUrl: TEST_VIDEO_URL,
              })),
            },
          })),
        },
      },
    });

    console.log(`Seeded course: ${course.title}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
