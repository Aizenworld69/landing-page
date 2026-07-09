const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in backend .env');
  process.exit(1);
}

console.log('Connecting to Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runSeed() {
  try {
    // 1. Clean existing records in dependency order
    console.log('Clearing old database records...');
    
    // Delete all modules
    const { error: errModules } = await supabase.from('course_modules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errModules) throw errModules;

    // Delete all reviews
    const { error: errReviews } = await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errReviews) throw errReviews;

    // Delete all courses
    const { error: errCourses } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errCourses) throw errCourses;

    // Delete all instructors
    const { error: errInstructors } = await supabase.from('instructors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errInstructors) throw errInstructors;

    console.log('Database cleared successfully.');

    // 2. Insert Instructor (Lê Thanh Hải)
    const instructorId = 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    console.log('Inserting sole instructor Lê Thanh Hải...');
    const { error: instErr } = await supabase.from('instructors').insert([
      {
        id: instructorId,
        name: 'Lê Thanh Hải',
        title: 'CEO AIZEN',
        bio: 'Chuyên gia với hơn 15 năm kinh nghiệm thực chiến trong ngành Công nghệ thông tin. Anh trực tiếp dẫn dắt lộ trình đưa AI vào vận hành, giúp doanh nghiệp đóng gói quy trình, tối ưu hiệu suất và bứt phá doanh thu từ những trải nghiệm và ứng dụng thực tế nhất.',
        avatar_url: '/dien-gia.jpg',
        social_links: {
          linkedin: 'https://linkedin.com/in/hai-le',
          email: 'hai.le@aizen.edu.vn',
        },
      },
    ]);
    if (instErr) throw instErr;

    // 3. Insert Courses
    console.log('Inserting courses...');
    const now = new Date();
    
    const offsetDate = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const { error: coursesErr } = await supabase.from('courses').insert([
      // Upcoming
      {
        id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        title: 'AI cho Chiến lược Doanh nghiệp',
        slug: 'ai-cho-chien-luoc-doanh-nghiep',
        description: 'Hướng dẫn toàn diện về triển khai các giải pháp AI ở quy mô lớn trong môi trường doanh nghiệp.',
        thumbnail_url: null,
        status: 'upcoming',
        category: 'Business AI',
        start_date: offsetDate(12),
        price: 1300000,
        price_group: 1100000,
        instructor_id: instructorId,
        skills: [],
      },
      {
        id: 'e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b',
        title: 'Kỹ thuật Prompt Nâng cao',
        slug: 'ky-thuat-prompt-nang-cao',
        description: 'Làm chủ các tương tác LLM phức tạp để tự động hóa quy trình làm việc và phân tích dữ liệu.',
        thumbnail_url: null,
        status: 'upcoming',
        category: 'AI & Machine Learning',
        start_date: offsetDate(19),
        price: 1500000,
        price_group: 1200000,
        instructor_id: instructorId,
        skills: [],
      },
      {
        id: 'f3a4b5c6-d7e8-9f0a-1b2c-3d4e5f6a7b8c',
        title: 'Kiến trúc Tích hợp AI',
        slug: 'kien-truc-tich-hop-ai',
        description: 'Thiết kế các hệ thống mạnh mẽ kết hợp liền mạch các mô hình AI tạo sinh.',
        thumbnail_url: null,
        status: 'upcoming',
        category: 'Automation',
        start_date: offsetDate(33),
        price: 1800000,
        price_group: 1500000,
        instructor_id: instructorId,
        skills: [],
      },
      // Completed
      {
        id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8d7c6b5a4f',
        title: 'Làm chủ Claude AI cho Doanh nghiệp',
        slug: 'lam-chu-claude-ai-cho-doanh-nghiep',
        description: 'Nghiên cứu sâu về Claude của Anthropic, tập trung vào cửa sổ ngữ cảnh, các trường hợp sử dụng thực tế và chiến lược triển khai.',
        thumbnail_url: '/images/courses/claude_ai.png',
        status: 'completed',
        category: 'Business AI',
        start_date: '2024-09-10',
        price: 1300000,
        price_group: 1100000,
        instructor_id: instructorId,
        curriculum_headline: '1 ngày – 6 module thực chiến',
        skills: [
          {
            title: 'Claude Cowork',
            description: 'Cowork là cả một phòng ban AI trong lòng bàn tay – mỗi agent đảm nhận một vai trò, tự vận hành, tự phối hợp với nhau, và giao cho bạn kết quả cuối cùng như một đội ngũ thực thụ.',
            badge: 'ĐẶC BIỆT',
          },
          {
            title: 'Claude Skills',
            description: 'Biến mỗi nhân sự hoặc quy trình công ty thành Skill cố định – gọi một lúc nhiều Skills, Claude tự xử lý đa nhiệm mà không cần ra lệnh lại.',
          },
          {
            title: 'Claude Projects',
            description: "Giao việc cho đúng người, giúp bạn tạo ra những 'chuyên gia ảo' theo từng lĩnh vực, luôn hiểu đúng context và làm việc theo chuẩn của bạn.",
          },
          {
            title: 'Claude Connectors',
            description: 'Chìa khóa để Claude kết nối với hệ thống công việc như Gmail, Google Drive, Calendar... để xây dựng các trợ lý tự động.',
          },
          {
            title: 'Claude Artifacts',
            description: 'Xây luôn cho bạn một app, website, landing page hay công cụ tương tác ngay trong khung chat, không cần code.',
          },
        ],
      },
      {
        id: '8b7c6d5e-4f3a-2b1c-0d9e-8d7c6b5a4f3e',
        title: 'Đường ống dữ liệu tự động',
        slug: 'duong-ong-du-lieu-tu-dong',
        description: 'Xây dựng quy trình làm việc ETL hiệu quả với các công cụ AI hiện đại.',
        thumbnail_url: '/images/courses/data_pipeline.png',
        status: 'completed',
        category: 'Data Science',
        start_date: '2024-08-15',
        price: 1500000,
        price_group: 1200000,
        instructor_id: instructorId,
        skills: [],
      },
      {
        id: '7c6d5e4f-3a2b-1c0d-9e8d-7c6b5a4f3e2d',
        title: 'Thiết kế UI tạo sinh',
        slug: 'thiet-ke-ui-tao-sinh',
        description: 'Sử dụng AI để tăng tốc độ tạo nguyên mẫu và hệ thống thiết kế.',
        thumbnail_url: '/images/courses/generative_ui.png',
        status: 'completed',
        category: 'Design',
        start_date: '2024-06-20',
        price: 1200000,
        price_group: 1000000,
        instructor_id: instructorId,
        skills: [],
      },
      {
        id: '6d5e4f3a-2b1c-0d9e-8d7c-6b5a4f3e2d1c',
        title: 'Xây dựng AI Agents với kiến trúc Multi-Agent',
        slug: 'xay-dung-ai-agents-voi-kien-truc-multi-agent',
        description: 'Thiết kế và triển khai hệ thống đa tác tử (Multi-Agent), cho phép các AI làm việc cộng tác giải quyết vấn đề lớn mà một agent không làm được.',
        thumbnail_url: '/images/courses/multi_agent.png',
        status: 'completed',
        category: 'AI & Machine Learning',
        start_date: '2024-08-05',
        price: 1800000,
        price_group: 1500000,
        instructor_id: instructorId,
        skills: [],
      },
      {
        id: '5e4f3a2b-1c0d-9e8d-7c6b-5a4f3e2d1c0b',
        title: 'Tối ưu hóa Prompt Engineering Nâng cao',
        slug: 'toi-uu-hoa-prompt-engineering-nang-cao',
        description: 'Kỹ thuật tinh chỉnh câu lệnh để kiểm soát độ chính xác, phong cách và định dạng đầu ra của các LLM hàng đầu hiện nay.',
        thumbnail_url: '/images/courses/prompt_engineering.png',
        status: 'completed',
        category: 'Automation',
        start_date: '2024-06-06',
        price: 1400000,
        price_group: 1100000,
        instructor_id: instructorId,
        skills: [],
      },
    ]);
    if (coursesErr) throw coursesErr;

    // 4. Insert Modules
    console.log('Inserting modules...');
    const { error: modulesErr } = await supabase.from('course_modules').insert([
      {
        course_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8d7c6b5a4f',
        title: 'Đón khách & Khởi động',
        duration_minutes: 30,
        order_index: 0,
      },
      {
        course_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8d7c6b5a4f',
        title: 'Module 1: Tư duy đúng về AI (Bộ 3: Mindset - Skillset - Toolset; Cấu trúc Prompt chuẩn)',
        duration_minutes: 30,
        order_index: 1,
      },
      {
        course_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8d7c6b5a4f',
        title: 'Module 2: Bộ 4 công cụ cốt lõi của Claude (Skills - não bộ chuyên môn; Projects - bộ nhớ dài hạn)',
        duration_minutes: 60,
        order_index: 2,
      },
    ]);
    if (modulesErr) throw modulesErr;

    // 5. Insert Reviews
    console.log('Inserting reviews...');
    const { error: reviewsErr } = await supabase.from('reviews').insert([
      {
        course_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8d7c6b5a4f',
        rating: 5,
        content: 'Khóa học cung cấp kiến thức vô cùng thực tế. Từ một người không biết gì về AI, giờ tôi đã có thể tự động hóa 40% công việc hàng ngày của mình. Cảm ơn đội ngũ giảng viên rất nhiều!',
        student_name: 'Nguyễn Mai Trang',
        student_avatar_url: null,
      },
      {
        course_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8d7c6b5a4f',
        rating: 5,
        content: 'Phương pháp giảng dạy rất hệ thống. Việc áp dụng ngay vào các case study thực tế của doanh nghiệp giúp tôi hiểu sâu và có thể triển khai ngay lập tức vào công việc.',
        student_name: 'Trần Hoàng Long',
        student_avatar_url: null,
      },
      {
        course_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8d7c6b5a4f',
        rating: 5,
        content: 'Công cụ Midjourney và ChatGPT được hướng dẫn rất chi tiết từ cơ bản đến nâng cao. Chất lượng hình ảnh thiết kế của team tôi đã cải thiện rõ rệt sau khi tham gia khóa học.',
        student_name: 'Phạm Quang Huy',
        student_avatar_url: null,
      },
    ]);
    if (reviewsErr) throw reviewsErr;

    console.log('🎉 Database seeded successfully with sole instructor Lê Thanh Hải!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during database seeding:', error);
    process.exit(1);
  }
}

runSeed();
