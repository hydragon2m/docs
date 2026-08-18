const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROGRESS_FILE = path.join(__dirname, '.study-progress.json');

// Danh sách toàn bộ lộ trình học tập được sắp xếp theo đúng thứ tự tuyến tính
const curriculum = [
  // ==========================================
  // MODULE 1: TYPESCRIPT
  // ==========================================
  { id: 'ts-fund-01', module: 'TS', topic: '01. Fundamentals', name: '01. Type Annotation', ext: 'ts' },
  { id: 'ts-fund-02', module: 'TS', topic: '01. Fundamentals', name: '02. Type Inference', ext: 'ts' },
  { id: 'ts-fund-03', module: 'TS', topic: '01. Fundamentals', name: '03. Primitive Types', ext: 'ts' },
  { id: 'ts-fund-04', module: 'TS', topic: '01. Fundamentals', name: '04. Object Types', ext: 'ts' },
  { id: 'ts-fund-05', module: 'TS', topic: '01. Fundamentals', name: '05. Type Alias', ext: 'ts' },
  { id: 'ts-fund-06', module: 'TS', topic: '01. Fundamentals', name: '06. Interface', ext: 'ts' },
  { id: 'ts-fund-07', module: 'TS', topic: '01. Fundamentals', name: '07. Array', ext: 'ts' },
  { id: 'ts-fund-08', module: 'TS', topic: '01. Fundamentals', name: '08. Tuple', ext: 'ts' },
  { id: 'ts-fund-09', module: 'TS', topic: '01. Fundamentals', name: '09. Optional & readonly Properties', ext: 'ts' },
  { id: 'ts-fund-10', module: 'TS', topic: '01. Fundamentals', name: '10. Literal Types', ext: 'ts' },
  { id: 'ts-fund-11', module: 'TS', topic: '01. Fundamentals', name: '11. null & undefined', ext: 'ts' },
  { id: 'ts-fund-12', module: 'TS', topic: '01. Fundamentals', name: '12. enum', ext: 'ts' },

  { id: 'ts-func-01', module: 'TS', topic: '02. Function', name: '01. Function Type Expressions', ext: 'ts' },
  { id: 'ts-func-02', module: 'TS', topic: '02. Function', name: '02. Call & Construct Signatures', ext: 'ts' },
  { id: 'ts-func-03', module: 'TS', topic: '02. Function', name: '03. Generic Functions', ext: 'ts' },
  { id: 'ts-func-04', module: 'TS', topic: '02. Function', name: '04. Optional & Default Parameters', ext: 'ts' },
  { id: 'ts-func-05', module: 'TS', topic: '02. Function', name: '05. Function Overloads', ext: 'ts' },
  { id: 'ts-func-06', module: 'TS', topic: '02. Function', name: '06. Declaring this', ext: 'ts' },
  { id: 'ts-func-07', module: 'TS', topic: '02. Function', name: '07. Rest Parameters & Destructuring', ext: 'ts' },
  { id: 'ts-func-08', module: 'TS', topic: '02. Function', name: '08. Void, Unknown, Never', ext: 'ts' },

  { id: 'ts-narrow-01', module: 'TS', topic: '03. Type Narrowing', name: '01. typeof Type Guards', ext: 'ts' },
  { id: 'ts-narrow-02', module: 'TS', topic: '03. Type Narrowing', name: '02. Truthiness Narrowing', ext: 'ts' },
  { id: 'ts-narrow-03', module: 'TS', topic: '03. Type Narrowing', name: '03. Equality Narrowing', ext: 'ts' },
  { id: 'ts-narrow-04', module: 'TS', topic: '03. Type Narrowing', name: '04. The in Operator Narrowing', ext: 'ts' },
  { id: 'ts-narrow-05', module: 'TS', topic: '03. Type Narrowing', name: '05. instanceof & Type Assertions', ext: 'ts' },
  { id: 'ts-narrow-06', module: 'TS', topic: '03. Type Narrowing', name: '06. Using Type Predicates', ext: 'ts' },
  { id: 'ts-narrow-07', module: 'TS', topic: '03. Type Narrowing', name: '07. Discriminated Unions', ext: 'ts' },

  { id: 'ts-union-01', module: 'TS', topic: '04. Union & Intersection', name: '01. Union Types', ext: 'ts' },
  { id: 'ts-union-02', module: 'TS', topic: '04. Union & Intersection', name: '02. Intersection Types', ext: 'ts' },
  { id: 'ts-union-03', module: 'TS', topic: '04. Union & Intersection', name: '03. Union & Intersection on Objects', ext: 'ts' },
  { id: 'ts-union-04', module: 'TS', topic: '04. Union & Intersection', name: '04. Type Compatibility', ext: 'ts' },
  { id: 'ts-union-05', module: 'TS', topic: '04. Union & Intersection', name: '05. Strict Union Types', ext: 'ts' },

  { id: 'ts-gen-01', module: 'TS', topic: '05. Generics', name: '01. Generic Types & Interfaces', ext: 'ts' },
  { id: 'ts-gen-02', module: 'TS', topic: '05. Generics', name: '02. Generic Classes', ext: 'ts' },
  { id: 'ts-gen-03', module: 'TS', topic: '05. Generics', name: '03. Generic Constraints & keyof', ext: 'ts' },
  { id: 'ts-gen-04', module: 'TS', topic: '05. Generics', name: '04. Default Generic Values', ext: 'ts' },
  { id: 'ts-gen-05', module: 'TS', topic: '05. Generics', name: '05. Generic Utility Types', ext: 'ts' },

  { id: 'ts-util-01', module: 'TS', topic: '06. Utility Types', name: '01. Partial, Required, Readonly', ext: 'ts' },
  { id: 'ts-util-02', module: 'TS', topic: '06. Utility Types', name: '02. Pick & Omit', ext: 'ts' },
  { id: 'ts-util-03', module: 'TS', topic: '06. Utility Types', name: '03. Exclude & Extract', ext: 'ts' },
  { id: 'ts-util-04', module: 'TS', topic: '06. Utility Types', name: '04. NonNullable & Parameters', ext: 'ts' },
  { id: 'ts-util-05', module: 'TS', topic: '06. Utility Types', name: '05. ReturnType & Awaited', ext: 'ts' },

  { id: 'ts-manip-01', module: 'TS', topic: '07. Type Manipulation', name: '01. keyof & typeof operators', ext: 'ts' },
  { id: 'ts-manip-02', module: 'TS', topic: '07. Type Manipulation', name: '02. Indexed Access Types', ext: 'ts' },
  { id: 'ts-manip-03', module: 'TS', topic: '07. Type Manipulation', name: '03. Conditional Types', ext: 'ts' },
  { id: 'ts-manip-04', module: 'TS', topic: '07. Type Manipulation', name: '04. Mapped Types', ext: 'ts' },
  { id: 'ts-manip-05', module: 'TS', topic: '07. Type Manipulation', name: '05. Template Literal Types', ext: 'ts' },

  { id: 'ts-adv-01', module: 'TS', topic: '08. Advanced TypeScript', name: '01. Decorators', ext: 'ts' },
  { id: 'ts-adv-02', module: 'TS', topic: '08. Advanced TypeScript', name: '02. Declaration Merging', ext: 'ts' },
  { id: 'ts-adv-03', module: 'TS', topic: '08. Advanced TypeScript', name: '03. Namespace vs Modules', ext: 'ts' },
  { id: 'ts-adv-04', module: 'TS', topic: '08. Advanced TypeScript', name: '04. Mixins & Advanced Classes', ext: 'ts' },
  { id: 'ts-adv-05', module: 'TS', topic: '08. Advanced TypeScript', name: '05. Nominal Typing', ext: 'ts' },

  // ==========================================
  // MODULE 2: NODE.JS CORE & INTERNALS
  // ==========================================
  { id: 'node-core-01', module: 'NodeJS', topic: '01. Core & Internals', name: '01. V8 Engine', ext: 'js' },
  { id: 'node-core-02', module: 'NodeJS', topic: '01. Core & Internals', name: '02. libuv & Event Loop', ext: 'js' },
  { id: 'node-core-03', module: 'NodeJS', topic: '01. Core & Internals', name: '03. Thread Pool', ext: 'js' },
  { id: 'node-core-04', module: 'NodeJS', topic: '01. Core & Internals', name: '04. Event Emitter', ext: 'js' },
  { id: 'node-core-05', module: 'NodeJS', topic: '01. Core & Internals', name: '05. Buffer', ext: 'js' },
  { id: 'node-core-06', module: 'NodeJS', topic: '01. Core & Internals', name: '06. Streams', ext: 'js' },
  { id: 'node-core-07', module: 'NodeJS', topic: '01. Core & Internals', name: '07. Network Stack', ext: 'js' },
  { id: 'node-core-08', module: 'NodeJS', topic: '01. Core & Internals', name: '08. Child Processes & Cluster', ext: 'js' },

  { id: 'node-net-01', module: 'NodeJS', topic: '02. Advanced Networking', name: '01. HTTPS & SSL - TLS', ext: 'js' },
  { id: 'node-net-02', module: 'NodeJS', topic: '02. Advanced Networking', name: '02. HTTP2 & HTTP3', ext: 'js' },
  { id: 'node-net-03', module: 'NodeJS', topic: '02. Advanced Networking', name: '03. WebSockets', ext: 'js' },
  { id: 'node-net-04', module: 'NodeJS', topic: '02. Advanced Networking', name: '04. gRPC', ext: 'js' },

  { id: 'node-perf-01', module: 'NodeJS', topic: '03. Performance & Tuning', name: '01. Worker Threads', ext: 'js' },
  { id: 'node-perf-02', module: 'NodeJS', topic: '03. Performance & Tuning', name: '02. CPU Profiling', ext: 'js' },
  { id: 'node-perf-03', module: 'NodeJS', topic: '03. Performance & Tuning', name: '03. Memory Profiling', ext: 'js' },
  { id: 'node-perf-04', module: 'NodeJS', topic: '03. Performance & Tuning', name: '04. PM2 Management', ext: 'js' },

  { id: 'node-sec-01', module: 'NodeJS', topic: '04. Web Security & Authentication', name: '01. Session & Cookie', ext: 'js' },
  { id: 'node-sec-02', module: 'NodeJS', topic: '04. Web Security & Authentication', name: '02. JWT Authentication', ext: 'js' },
  { id: 'node-sec-03', module: 'NodeJS', topic: '04. Web Security & Authentication', name: '03. OAuth2 Callback', ext: 'js' },
  { id: 'node-sec-04', module: 'NodeJS', topic: '04. Web Security & Authentication', name: '04. Web Security', ext: 'js' },

  { id: 'node-pattern-01', module: 'NodeJS', topic: '05. Design Patterns & Architecture', name: '01. Dependency Injection', ext: 'ts' },
  { id: 'node-pattern-02', module: 'NodeJS', topic: '05. Design Patterns & Architecture', name: '02. Repository Pattern', ext: 'ts' },
  { id: 'node-pattern-03', module: 'NodeJS', topic: '05. Design Patterns & Architecture', name: '03. Design Patterns', ext: 'ts' },

  { id: 'node-test-01', module: 'NodeJS', topic: '06. Testing & Quality Assurance', name: '01. Unit Testing', ext: 'js' },
  { id: 'node-test-02', module: 'NodeJS', topic: '06. Testing & Quality Assurance', name: '02. Integration Testing', ext: 'js' },

  { id: 'node-ess-01', module: 'NodeJS', topic: '08. Essential Modules & Patterns', name: '01. Module System', ext: 'js' },
  { id: 'node-ess-02', module: 'NodeJS', topic: '08. Essential Modules & Patterns', name: '02. File System & Path', ext: 'js' },
  { id: 'node-ess-03', module: 'NodeJS', topic: '08. Essential Modules & Patterns', name: '03. Error Handling', ext: 'js' },
  { id: 'node-ess-04', module: 'NodeJS', topic: '08. Essential Modules & Patterns', name: '04. Environment & Configuration', ext: 'js' },

  // ==========================================
  // MODULE 3: DATABASE & ORM
  // ==========================================
  { id: 'db-sql-01', module: 'Database & ORM', topic: '01. SQL & PostgreSQL', name: '01. PostgreSQL & Indexing', ext: 'sql' },
  { id: 'db-nosql-01', module: 'Database & ORM', topic: '02. NoSQL & MongoDB', name: '01. MongoDB Aggregation', ext: 'js' },
  { id: 'db-redis-01', module: 'Database & ORM', topic: '03. Redis Mastery', name: '01. Redis Caching & Lock', ext: 'ts' },
  { id: 'db-orm-01', module: 'Database & ORM', topic: '04. ORM & Migrations', name: '01. Prisma & TypeORM Setup', ext: 'ts' },

  // ==========================================
  // MODULE 4: DEVOPS & ARCHITECTURE
  // ==========================================
  { id: 'devops-docker-01', module: 'DevOps & Architecture', topic: '01. Docker Mastery', name: '01. Dockerfile', ext: '' }, // File không đuôi
  { id: 'devops-docker-02', module: 'DevOps & Architecture', topic: '01. Docker Mastery', name: '02. docker-compose', ext: 'yml' },
  { id: 'devops-docker-03', module: 'DevOps & Architecture', topic: '01. Docker Mastery', name: '03. Docker Networking & Volumes', ext: 'yml' },
  { id: 'devops-arch-01', module: 'DevOps & Architecture', topic: '02. Architecture Patterns', name: '01. Modular Monolith Structure', ext: 'ts' },
  { id: 'devops-arch-02', module: 'DevOps & Architecture', topic: '02. Architecture Patterns', name: '02. Microservices Communication', ext: 'ts' },
  { id: 'devops-cicd-01', module: 'DevOps & Architecture', topic: '03. CI-CD & Deployment', name: '01. nginx', ext: 'conf' },
  { id: 'devops-cicd-02', module: 'DevOps & Architecture', topic: '03. CI-CD & Deployment', name: '02. ci-cd', ext: 'yml' },

  // ==========================================
  // MODULE 5: NESTJS FRAMEWORK
  // ==========================================
  { id: 'nestjs-arch-01', module: 'NestJS', topic: '01. Architecture & Lifecycle', name: '01. NestJS Architecture', ext: 'ts' },
  { id: 'nestjs-db-01', module: 'NestJS', topic: '02. Database & CQRS', name: '01. Transactions & CQRS', ext: 'ts' },
  { id: 'nestjs-adv-01', module: 'NestJS', topic: '03. Advanced & Real-time', name: '01. Queues & WebSockets', ext: 'ts' },

  // ==========================================
  // MODULE 6: OBSERVABILITY & SECURITY
  // ==========================================
  { id: 'obs-log-01', module: 'Observability & Security', topic: '01. Logging & Tracing', name: '01. Logging & Correlation ID', ext: 'ts' },
  { id: 'obs-mon-01', module: 'Observability & Security', topic: '02. Monitoring', name: '01. Prometheus Metrics', ext: 'ts' },
  { id: 'obs-sec-01', module: 'Observability & Security', topic: '03. Security', name: '01. API Security', ext: 'ts' },
];

function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return { currentStep: 0, completed: [] };
  }
  return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

function getFilePath(step, isTemplate = false) {
  const baseDir = isTemplate ? 'templates' : 'study';
  const practiceDir = path.join(__dirname, baseDir, step.module, step.topic);
  
  if (step.ext === '') {
    return path.join(practiceDir, step.name);
  }
  return path.join(practiceDir, `${step.name}.${step.ext}`);
}

function runTestOfStep(step) {
  const filePath = getFilePath(step, false);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Chưa tạo file bài làm: ${path.basename(filePath)}`);
    console.log(`👉 Dùng lệnh 'npm run study next' để bắt đầu.`);
    return false;
  }

  console.log(`\n⏳ Đang chạy kiểm thử bài: ${step.name}...`);
  try {
    let command = '';
    if (step.ext === 'ts') {
      command = `npx ts-node "${filePath}"`;
    } else if (step.ext === 'js') {
      command = `node "${filePath}"`;
    } else if (step.ext === 'sql') {
      // Đối với SQL chỉ check cú pháp tĩnh bằng cách in ra
      console.log(`ℹ️ Bài SQL - Hãy tự chạy kiểm thử trên client Postgres của bạn.`);
      return true;
    } else {
      console.log(`ℹ️ Bài cấu hình (YAML/Nginx) - Tự động pass kiểm thử cú pháp.`);
      return true;
    }

    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ Chúc mừng! Bài làm ${step.name} đã chạy PASS qua toàn bộ testcases.`);
    return true;
  } catch (e) {
    console.log(`\n❌ Bài làm ${step.name} chạy FAIL. Hãy kiểm tra lại logic code.`);
    return false;
  }
}

const command = process.argv[2];

if (!command || command === 'status') {
  const progress = loadProgress();
  console.log('\n======================================================');
  console.log('🏁 TIẾN ĐỘ HỌC TẬP BACKEND MASTERCLASS');
  console.log('======================================================\n');
  
  let currentFound = false;
  curriculum.forEach((step, index) => {
    let statusIcon = '[ ]';
    if (index < progress.currentStep) {
      statusIcon = '✅';
    } else if (index === progress.currentStep) {
      statusIcon = '📝';
      currentFound = true;
    }
    
    console.log(`${statusIcon} Bài ${String(index + 1).padStart(2, '0')}: [${step.module}] ${step.topic} / ${step.name}`);
  });

  console.log('\n------------------------------------------------------');
  if (progress.currentStep >= curriculum.length) {
    console.log('🎉 Xuất sắc! Bạn đã hoàn thành toàn bộ khóa học!');
  } else {
    const currentStep = curriculum[progress.currentStep];
    console.log(`👉 Bài đang học: Bài ${progress.currentStep + 1} - ${currentStep.name}`);
    console.log(`👉 Lệnh kiểm thử: npm run study test`);
    console.log(`👉 Lệnh chuyển bài: npm run study next`);
  }
  console.log('======================================================\n');
}

else if (command === 'test') {
  const progress = loadProgress();
  if (progress.currentStep >= curriculum.length) {
    console.log('🎉 Bạn đã hoàn thành toàn bộ khóa học!');
    process.exit(0);
  }
  const currentStep = curriculum[progress.currentStep];
  const passed = runTestOfStep(currentStep);
  process.exit(passed ? 0 : 1);
}

else if (command === 'next') {
  const progress = loadProgress();
  if (progress.currentStep >= curriculum.length) {
    console.log('🎉 Bạn đã hoàn thành toàn bộ khóa học!');
    process.exit(0);
  }

  const currentStep = curriculum[progress.currentStep];
  const filePath = getFilePath(currentStep, false);
  const templatePath = getFilePath(currentStep, true);

  // Nếu file bài làm chưa tồn tại -> copy template ra cho học viên làm bài
  if (!fs.existsSync(filePath)) {
    console.log(`\n📂 Khởi tạo bài học mới: ${currentStep.name}`);
    fs.copyFileSync(templatePath, filePath);
    console.log(`✅ Đã tạo file bài làm thực tế tại:`);
    console.log(`   👉 ${filePath}`);
    console.log(`💡 Mở file trên VS Code, tìm các thẻ '// TODO' và viết code.`);
    process.exit(0);
  }

  // Nếu file đã có -> Chạy test thử trước khi cho qua bài mới
  const passed = runTestOfStep(currentStep);
  if (passed) {
    progress.currentStep += 1;
    saveProgress(progress);
    console.log(`\n======================================================`);
    console.log(`🚀 TIẾN BƯỚC: Mở khóa bài tiếp theo!`);
    console.log(`======================================================`);
    
    if (progress.currentStep >= curriculum.length) {
      console.log('🎉 Chúc mừng! Bạn đã hoàn thành bài học cuối cùng của khóa học!');
    } else {
      const nextStep = curriculum[progress.currentStep];
      const nextFilePath = getFilePath(nextStep, false);
      const nextTemplatePath = getFilePath(nextStep, true);
      
      // Tạo luôn file bài làm mới
      fs.copyFileSync(nextTemplatePath, nextFilePath);
      console.log(`📝 Bài mới: [${nextStep.module}] ${nextStep.topic} / ${nextStep.name}`);
      console.log(`📂 Đã tạo sẵn file bài làm tại:`);
      console.log(`   👉 ${nextFilePath}`);
    }
  } else {
    console.log(`\n⚠️ Bạn cần giải quyết lỗi và chạy PASS bài hiện tại trước khi next bài mới!`);
  }
}
