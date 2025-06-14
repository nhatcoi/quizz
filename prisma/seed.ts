import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'Admin User',
      role: 'ADMIN',
      firebaseUid: 'admin-firebase-uid',
    },
  });

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      displayName: 'John Doe',
      role: 'USER',
      firebaseUid: 'user-firebase-uid',
    },
  });

  // Create JavaScript quiz
  const jsQuiz = await prisma.quiz.create({
    data: {
      title: 'JavaScript Fundamentals',
      description: 'Test your knowledge of JavaScript basics including variables, functions, and control structures.',
      timeLimit: 15,
      difficulty: 'MEDIUM',
      category: 'Programming',
      isPublished: true,
      createdBy: adminUser.id,
      questions: {
        create: [
          {
            question: 'What is the correct way to declare a variable in JavaScript?',
            options: ['var myVar;', 'variable myVar;', 'v myVar;', 'declare myVar;'],
            correctAnswer: 0,
            explanation: 'In JavaScript, variables are declared using var, let, or const keywords.',
            points: 1,
            order: 0,
          },
          {
            question: 'Which of the following is NOT a JavaScript data type?',
            options: ['String', 'Boolean', 'Integer', 'Object'],
            correctAnswer: 2,
            explanation: 'JavaScript has Number type, not Integer. Integer is not a primitive data type in JavaScript.',
            points: 1,
            order: 1,
          },
          {
            question: 'What does the === operator do?',
            options: ['Assignment', 'Equality without type conversion', 'Equality with type conversion', 'Not equal'],
            correctAnswer: 1,
            explanation: 'The === operator checks for strict equality, comparing both value and type without conversion.',
            points: 1,
            order: 2,
          },
          {
            question: 'How do you create a function in JavaScript?',
            options: ['function myFunction() {}', 'create myFunction() {}', 'def myFunction() {}', 'func myFunction() {}'],
            correctAnswer: 0,
            explanation: 'Functions in JavaScript are declared using the function keyword.',
            points: 1,
            order: 3,
          },
          {
            question: 'What is the result of typeof null?',
            options: ['null', 'undefined', 'object', 'boolean'],
            correctAnswer: 2,
            explanation: 'This is a known quirk in JavaScript. typeof null returns "object" due to a legacy bug.',
            points: 1,
            order: 4,
          },
        ],
      },
    },
  });

  // Create React quiz
  const reactQuiz = await prisma.quiz.create({
    data: {
      title: 'React Basics',
      description: 'Learn the fundamentals of React including components, props, and state management.',
      timeLimit: 20,
      difficulty: 'MEDIUM',
      category: 'Frontend',
      isPublished: true,
      createdBy: adminUser.id,
      questions: {
        create: [
          {
            question: 'What is JSX?',
            options: ['A JavaScript library', 'A syntax extension for JavaScript', 'A CSS framework', 'A database'],
            correctAnswer: 1,
            explanation: 'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in React.',
            points: 1,
            order: 0,
          },
          {
            question: 'How do you pass data to a React component?',
            options: ['Through state', 'Through props', 'Through context', 'Through refs'],
            correctAnswer: 1,
            explanation: 'Props are used to pass data from parent components to child components.',
            points: 1,
            order: 1,
          },
          {
            question: 'What hook is used to manage state in functional components?',
            options: ['useEffect', 'useState', 'useContext', 'useReducer'],
            correctAnswer: 1,
            explanation: 'useState is the primary hook for managing local state in functional components.',
            points: 1,
            order: 2,
          },
          {
            question: 'What is the virtual DOM?',
            options: ['A real DOM element', 'A JavaScript representation of the DOM', 'A CSS framework', 'A database'],
            correctAnswer: 1,
            explanation: 'The virtual DOM is a JavaScript representation of the actual DOM that React uses for efficient updates.',
            points: 1,
            order: 3,
          },
        ],
      },
    },
  });

  // Create CSS quiz
  const cssQuiz = await prisma.quiz.create({
    data: {
      title: 'CSS Styling',
      description: 'Master CSS selectors, properties, and layout techniques for modern web design.',
      timeLimit: 10,
      difficulty: 'EASY',
      category: 'Frontend',
      isPublished: true,
      createdBy: adminUser.id,
      questions: {
        create: [
          {
            question: 'Which CSS property is used to change the text color?',
            options: ['text-color', 'color', 'font-color', 'text-style'],
            correctAnswer: 1,
            explanation: 'The color property is used to set the color of text in CSS.',
            points: 1,
            order: 0,
          },
          {
            question: 'What does CSS stand for?',
            options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
            correctAnswer: 1,
            explanation: 'CSS stands for Cascading Style Sheets.',
            points: 1,
            order: 1,
          },
          {
            question: 'Which property is used to change the background color?',
            options: ['bg-color', 'background-color', 'bgcolor', 'background'],
            correctAnswer: 1,
            explanation: 'The background-color property sets the background color of an element.',
            points: 1,
            order: 2,
          },
        ],
      },
    },
  });

  // Create some sample submissions
  await prisma.submission.create({
    data: {
      userId: regularUser.id,
      quizId: jsQuiz.id,
      answers: [0, 2, 1, 0, 2],
      score: 4,
      totalPoints: 5,
      timeSpent: 600, // 10 minutes
      startedAt: new Date(Date.now() - 600000),
    },
  });

  // Create some sample feedback
  await prisma.feedback.create({
    data: {
      userId: regularUser.id,
      quizId: jsQuiz.id,
      message: 'Great quiz! Could you add more advanced JavaScript questions?',
      type: 'SUGGESTION',
    },
  });

  await prisma.feedback.create({
    data: {
      userId: regularUser.id,
      message: 'The timer seems to be running too fast on mobile devices.',
      type: 'BUG_REPORT',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: ${adminUser.email}`);
  console.log(`👤 Regular user: ${regularUser.email}`);
  console.log(`📝 Created ${3} quizzes`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 