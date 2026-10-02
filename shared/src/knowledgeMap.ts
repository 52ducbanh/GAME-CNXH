export interface KnowledgeModule {
  id: string;
  title: string;
  concept: string;
  gameMapping: string;
  academicContent: string;
  simulationBoundary: string;
  ruleCode: string;
}

export const KNOWLEDGE_INTRO = {
  title: "QUÊ MÌNH ĐỨNG ĐẦU! / HÀ NỘI — DẪN NHẬP LÝ LUẬN",
  marxistTheory: {
    originOfState: "Theo quan điểm của Chủ nghĩa Mác – Lênin, Nhà nước không phải là hiện tượng vĩnh cửu hay siêu nhiên, mà ra đời trong những điều kiện lịch sử nhất định khi xã hội xuất hiện chế độ tư hữu và phân chia giai cấp, mâu thuẫn giai cấp trở nên gay gắt đến mức không thể điều hòa. Nhà nước nắm giữ quyền lực công đặc biệt, mang bản chất giai cấp thống trị, đồng thời thực hiện chức năng xã hội nhằm quản lý các công việc chung của cộng đồng.",
    socialistState: "Nhà nước XHCN là kiểu nhà nước mới, mang bản chất giai cấp công nhân, gắn liền với quyền làm chủ của nhân dân lao động. Bản chất ấy thể hiện toàn diện trên các phương diện: chính trị (dân chủ rộng rãi cho nhân dân lao động), kinh tế (xác lập quan hệ sản xuất tiến bộ, phục vụ lợi ích chung), và văn hóa - xã hội (giải phóng con người, phát triển phúc lợi và bảo đảm công bằng xã hội). Game mô phỏng không đồng nhất toàn bộ Nhà nước với một tổ chức cứu trợ, mà dùng tình huống cung ứng dịch vụ công để làm rõ bản chất phục vụ nhân dân.",
    vietnamContext: "Tại Việt Nam, Nhà nước mang bản chất giai cấp công nhân, tính nhân dân và tính dân tộc sâu sắc; tất cả quyền lực nhà nước thuộc về Nhân dân mà nền tảng là liên minh giữa giai cấp công nhân với giai cấp nông dân và đội ngũ trí thức, dưới sự lãnh đạo của Đảng Cộng sản Việt Nam."
  },
  principlesNotice: "LƯU Ý GIỚI HẠN MÔ PHỎNG: Gameplay lược giản hóa quy trình hành chính thành các cơ chế di chuyển, thu thập dữ liệu, phân bổ vật tư và biểu quyết nhanh nhằm mục đích học tập trực quan. Việc một người chơi có thể làm nhiều vai trò là sự giản lược hóa kỹ thuật, không phản ánh thẩm quyền ngoài đời thực."
};

export const KNOWLEDGE_RULES: Record<string, KnowledgeModule> = {
  GAME_RULE_001_PUBLIC_SERVICE: {
    id: 'GAME_RULE_001_PUBLIC_SERVICE',
    title: 'Chức năng xã hội và tổ chức dịch vụ công của Nhà nước',
    concept: 'Nhà nước quản lý và phân bổ nguồn lực công vì lợi ích cộng đồng',
    gameMapping: 'Nhiệm vụ 1: Lập kế hoạch mở mạng lưới dịch vụ y tế cho toàn bộ nhân dân theo khả năng ngân sách và vật tư.',
    academicContent: 'Nhà nước XHCN tổ chức và quản lý kinh tế - xã hội, bảo đảm cung ứng dịch vụ thiết yếu, không vì mục tiêu tối đa hóa lợi nhuận mà hướng tới mục tiêu phụng sự đời sống và sức khỏe của nhân dân.',
    simulationBoundary: 'Game giản lược nguồn lực thành 100 ngân sách và 12 kiện vật tư để người chơi trực tiếp trải nghiệm bài toán cân đối nguồn lực có hạn trong thực thi chính sách công.',
    ruleCode: 'GAME_RULE_001'
  },
  GAME_RULE_002_DEMOCRATIC_CENTRALISM: {
    id: 'GAME_RULE_002_DEMOCRATIC_CENTRALISM',
    title: 'Nguyên tắc Tập trung dân chủ trong thảo luận và quyết định',
    concept: 'Dân chủ thảo luận, tập trung thống nhất hành động',
    gameMapping: 'Cơ chế biểu quyết phương án tại Trụ sở: mọi thành viên tham gia thảo luận và bỏ phiếu; phương án được chốt là cam kết chung của toàn đội.',
    academicContent: 'Tập trung dân chủ là nguyên tắc cơ bản trong tổ chức và hoạt động của Nhà nước pháp quyền XHCN Việt Nam. Dân chủ bảo đảm phát huy trí tuệ tập thể; tập trung bảo đảm tính kỷ cương, thống nhất ý chí và sức mạnh hành động.',
    simulationBoundary: 'Cơ chế vote 15 giây trong game chỉ là minh họa tương tác nhóm trong không gian lớp học, không thay thế cho quy trình lập hiến, lập pháp hay hội đồng nhân dân các cấp.',
    ruleCode: 'GAME_RULE_002'
  },
  GAME_RULE_003_RULE_OF_LAW: {
    id: 'GAME_RULE_003_RULE_OF_LAW',
    title: 'Tổ chức và hoạt động theo Hiến pháp và pháp luật',
    concept: 'Nhà nước pháp quyền xã hội chủ nghĩa quản lý bằng pháp luật',
    gameMapping: 'Mọi thao tác trong game đều tuân thủ điều kiện thực thi, kiểm tra nguồn lực và thẩm quyền; không hành động tùy tiện hay sửa đổi quy tắc tùy ý.',
    academicContent: 'Nhà nước pháp quyền XHCN Việt Nam thượng tôn Hiến pháp và pháp luật. Mọi cơ quan nhà nước, cán bộ, công chức phải hoạt động trong khuôn khổ pháp luật quy định, chịu trách nhiệm trước nhân dân.',
    simulationBoundary: 'Hệ thống dùng mã GAME_RULE_xxx định sẵn trên server, tuyệt đối không tự bịa đặt số điều của các văn bản quy phạm pháp luật thực tế.',
    ruleCode: 'GAME_RULE_003'
  },
  GAME_RULE_004_TRANSPARENCY: {
    id: 'GAME_RULE_004_TRANSPARENCY',
    title: 'Công khai, minh bạch và trách nhiệm giải trình',
    concept: 'Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng',
    gameMapping: 'Nhiệm vụ niêm yết Bảng công khai sau mỗi giai đoạn và đối chiếu sổ sách tại Kho vật tư khi có phản ánh thất thoát.',
    academicContent: 'Một đặc trưng quan trọng của Nhà nước pháp quyền XHCN Việt Nam là sự minh bạch trong sử dụng ngân sách, tài sản công và tiếp nhận, giải trình kịp thời trước các phản ánh của quần chúng.',
    simulationBoundary: 'Bảng công khai trong game cập nhật tức thời số liệu từ ledger server; kết luận phản ánh dựa trên số liệu thực tế được kiểm chứng.',
    ruleCode: 'GAME_RULE_004'
  },
  GAME_RULE_005_HUMAN_RIGHTS: {
    id: 'GAME_RULE_005_HUMAN_RIGHTS',
    title: 'Công nhận, tôn trọng, bảo đảm và bảo vệ quyền con người, quyền công dân',
    concept: 'Bảo đảm an sinh xã hội, không để ai bị bỏ lại phía sau',
    gameMapping: 'Nhiệm vụ 3: Tiếp nhận phản ánh từ Khu C và tổ chức hỗ trợ y tế tận nhà cho hai công dân cao tuổi C1 và C2.',
    academicContent: 'Nhà nước pháp quyền XHCN đặt con người ở vị trí trung tâm, coi giải phóng và phát triển con người toàn diện là mục tiêu cao nhất. Các nhóm yếu thế, người cao tuổi có hoàn cảnh đặc biệt được nhà nước quan tâm trợ giúp kịp thời.',
    simulationBoundary: 'M3 không cần mở biểu quyết vì biện pháp trợ giúp người yếu thế đã có căn cứ pháp lý và tính cấp bách sẵn trong quy tắc.',
    ruleCode: 'GAME_RULE_005'
  }
};

export const KNOWLEDGE_SOURCES = [
  {
    name: 'Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam',
    link: 'https://xaydungchinhsach.chinhphu.vn/toan-van-hien-phap-nuoc-cong-hoa-xa-hoi-chu-nghia-viet-nam-119231225213002261.htm',
    note: 'Văn bản nền tảng về tổ chức quyền lực nhà nước, chế độ chính trị, kinh tế, xã hội và quyền con người.'
  },
  {
    name: 'Nghị quyết số 27-NQ/TW (Hội nghị lần thứ 6 Ban Chấp hành Trung ương Đảng khóa XIII)',
    link: 'https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-27-nq-tw-tiep-tuc-xay-dung-va-hoan-thien-nha-nuoc-phap-quyen-119221126114455251.htm',
    note: 'Nghị quyết chuyên đề về tiếp tục xây dựng và hoàn thiện Nhà nước pháp quyền xã hội chủ nghĩa Việt Nam trong giai đoạn mới.'
  },
  {
    name: 'Giáo trình Chủ nghĩa xã hội khoa học (Bộ Giáo dục và Đào tạo)',
    link: 'Tài liệu học phần tại trường',
    note: 'Cần đối chiếu số trang và thuật ngữ cụ thể theo ấn bản giáo trình của giảng viên bộ môn trước khi nộp bài thu hoạch.'
  }
];

export function generateRecap(
  m1Plan: 'FIXED' | 'MOBILE' | 'NONE',
  m2Plan: 'REPAIR' | 'DETOUR' | 'NONE',
  m3Completed: boolean,
  servedCount: number,
  totalCitizens: number,
  finalBudget: number,
  finalCrates: number
) {
  const recaps: { mission: string; title: string; narrative: string; theoryLesson: string }[] = [];

  // M1 Recap
  if (m1Plan === 'FIXED') {
    recaps.push({
      mission: 'Nhiệm vụ 1: Mở dịch vụ y tế',
      title: 'Lựa chọn Trạm y tế Cố định (Tập trung)',
      narrative: 'Đội đã quyết định phương án Trạm cố định gần Khu A. Chi phí ngân sách 40 đơn vị và 2 kiện vật tư. Ưu điểm là tối ưu thời gian đi lại cho một điểm triển khai lớn, phục vụ trọn vẹn 12 người dân Khu A và 10 người dân Khu B (tổng 22/30 người). Hạn chế thực tế: Khu C ở xa hoàn toàn chưa tiếp cận được dịch vụ y tế ban đầu.',
      theoryLesson: 'Minh họa bài toán phân bổ nguồn lực công có hạn: Chính sách công phải tính đến sự cân đối giữa hiệu quả quy mô tập trung và mức độ bao phủ công bằng cho các vùng xa xôi.'
    });
  } else if (m1Plan === 'MOBILE') {
    recaps.push({
      mission: 'Nhiệm vụ 1: Mở dịch vụ y tế',
      title: 'Lựa chọn Điểm Y tế Lưu động (Phân tán)',
      narrative: 'Đội đã quyết định phương án Điểm lưu động tại cả B và C. Chi phí ngân sách 30 đơn vị và 4 kiện vật tư. Mặc dù tốn công vận chuyển và chia nhỏ đội ngũ, phương án này đã tiếp cận được 10 người Khu A, 8 người Khu B và 6 người Khu C (tổng 24/30 người). Hai công dân đặc biệt C1 và C2 vẫn chưa tiếp cận được do hạn chế vận động cá nhân.',
      theoryLesson: 'Thể hiện bản chất nhân văn của Nhà nước XHCN: Chủ động đưa dịch vụ công đến gần nhân dân vùng khó khăn, đa dạng hóa phương thức cung ứng dịch vụ.'
    });
  }

  // M2 Recap
  if (m2Plan === 'REPAIR') {
    recaps.push({
      mission: 'Nhiệm vụ 2: Cầu hỏng & Ứng phó sự cố Khu B',
      title: 'Khôi phục Hạ tầng Giao thông (Sửa cầu)',
      narrative: 'Đội đầu tư 25 ngân sách và 4 kiện vật tư (2 kiện sửa cầu + 2 kiện hỗ trợ khẩn cấp). Cả 2 mố dầm cầu đã được các đơn vị thi công gia cố dứt điểm, khôi phục hoàn toàn huyết mạch giao thông thẳng sang Khu B và hỗ trợ đủ 2 kiện cho dân cư.',
      theoryLesson: 'Đầu tư công bền vững: Nhà nước ưu tiên phục hồi cơ sở hạ tầng thiết yếu lâu dài cho cộng đồng, kết hợp giải quyết cứu trợ khẩn cấp, bảo đảm lưu thông công cộng ổn định.'
    });
  } else if (m2Plan === 'DETOUR') {
    recaps.push({
      mission: 'Nhiệm vụ 2: Cầu hỏng & Ứng phó sự cố Khu B',
      title: 'Tổ chức Tuyến đường Vòng Thay thế',
      narrative: 'Đội chọn phương án tuyến vòng tiết kiệm chi phí (10 ngân sách, 2 kiện cứu trợ). Hỗ trợ được chuyển kịp thời cho Khu B, giữ lại được 15 đơn vị ngân sách và 2 kiện vật tư cho các nhiệm vụ tiếp theo. Tuy nhiên, cầu vẫn hỏng, đường đi lại sau này dài hơn gấp đôi.',
      theoryLesson: 'Linh hoạt trong điều hành ngân sách thời kỳ khủng hoảng: Giải quyết mục tiêu trước mắt nhanh gọn, chấp nhận đánh đổi sự bất tiện giao thông tạm thời khi nguồn lực cần dự trữ.'
    });
  }

  // M3 Recap
  if (m3Completed) {
    recaps.push({
      mission: 'Nhiệm vụ 3: Bảo đảm quyền & Khắc phục khoảng trống',
      title: 'Bảo vệ quyền công dân & Minh bạch sổ sách',
      narrative: `Đội đã tiếp nhận phản ánh, đối chiếu hồ sơ thực tế và bố trí 20 ngân sách cùng 2 kiện vật tư để đến tận nhà chăm sóc Cụ C1 và C2. Đồng thời, tin đồn thất thoát tại Kho vật tư đã được đối chiếu minh bạch: sổ sách xuất nhập hoàn toàn khớp với hiện trường, bác bỏ nghi vấn thất thiệt bằng chứng cứ thực tế. Tổng số dân được phục vụ đạt ${servedCount}/${totalCitizens} người.`,
      theoryLesson: 'Đặc trưng Nhà nước của Nhân dân, do Nhân dân, vì Nhân dân: Lắng nghe tiếng nói của nhân dân, kịp thời sửa chữa khoảng trống chính sách, bảo đảm không công dân nào bị lãng quên; kết hợp công khai minh bạch để củng cố niềm tin xã hội.'
    });
  }

  return {
    recaps,
    summaryStats: {
      servedCount,
      totalCitizens,
      remainingBudget: finalBudget,
      remainingCrates: finalCrates
    }
  };
}
