export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: 
    | 'HEADQUARTERS' 
    | 'WAREHOUSE' 
    | 'ZONE_A' 
    | 'ZONE_B' 
    | 'ZONE_C' 
    | 'CLINIC_FIXED' 
    | 'CLINIC_MOBILE_B' 
    | 'CLINIC_MOBILE_C' 
    | 'BRIDGE' 
    | 'BRIDGE_TASK_1' 
    | 'BRIDGE_TASK_2' 
    | 'NOTICE_BOARD' 
    | 'CITIZEN_C1' 
    | 'CITIZEN_C2' 
    | 'PRACTICE_TARGET';
  x: number;
  y: number;
  radius: number;
  description: string;
  vietnameseLabel: string;
}

// 1280 x 960 world
export const MAP_CONFIG = {
  width: 1280,
  height: 960,
  spawn: { x: 360, y: 220 }
};

// Static colliders: borders, lake, buildings, canal
export const STATIC_COLLIDERS: Rect[] = [
  // Map borders
  { x: 0, y: 0, width: 1280, height: 20 },
  { x: 0, y: 940, width: 1280, height: 20 },
  { x: 0, y: 0, width: 20, height: 960 },
  { x: 1260, y: 0, width: 20, height: 960 },

  // Hồ Gươm (Trung tâm: ~540..780, ~360..580)
  { x: 540, y: 360, width: 240, height: 220 },

  // Trụ sở UBND / Trụ sở chính (Near Area A: 320..400, 100..150)
  { x: 310, y: 100, width: 90, height: 50 },

  // Kho vật tư (Tây Nam: 170..270, 700..750)
  { x: 170, y: 700, width: 100, height: 50 },

  // Khu dân cư A Buildings (Tây Bắc)
  { x: 180, y: 180, width: 80, height: 60 },
  { x: 180, y: 270, width: 80, height: 60 },

  // Khu dân cư B Buildings (Đông)
  { x: 1040, y: 260, width: 90, height: 60 },
  { x: 1040, y: 350, width: 90, height: 60 },

  // Khu dân cư C Buildings (Nam)
  { x: 600, y: 840, width: 80, height: 50 },
  { x: 710, y: 840, width: 80, height: 50 },

  // Nhánh kênh ngăn cách Khu Đông B (x: 870..900)
  // Kênh phía Bắc (để hở đoạn Detour phía trên y: 80..180)
  { x: 870, y: 180, width: 30, height: 240 },
  // Kênh phía Nam cầu (dưới cầu y: 490..900)
  { x: 870, y: 490, width: 30, height: 410 }
];

// Cầu đường bộ hư cấu (x: 865, y: 420, width: 40, height: 70)
// Khi cầu hỏng trong M2, collider này được kích hoạt
export const BRIDGE_COLLIDER: Rect = {
  x: 865,
  y: 420,
  width: 40,
  height: 70
};

// Points of Interest for gameplay interaction
export const POINTS_OF_INTEREST: Record<string, PointOfInterest> = {
  HEADQUARTERS: {
    id: 'HEADQUARTERS',
    name: 'Trụ sở chính quyền',
    type: 'HEADQUARTERS',
    x: 355,
    y: 165,
    radius: 72,
    description: 'Nơi tiếp nhận hồ sơ, lập và biểu quyết kế hoạch dịch vụ công',
    vietnameseLabel: 'TRỤ SỞ CHÍNH'
  },
  NOTICE_BOARD: {
    id: 'NOTICE_BOARD',
    name: 'Bảng công khai kết quả',
    type: 'NOTICE_BOARD',
    x: 430,
    y: 165,
    radius: 72,
    description: 'Nơi niêm yết công khai ngân sách, chi tiêu và kết quả phục vụ nhân dân',
    vietnameseLabel: 'BẢNG CÔNG KHAI'
  },
  WAREHOUSE: {
    id: 'WAREHOUSE',
    name: 'Kho vật tư thành phố',
    type: 'WAREHOUSE',
    x: 220,
    y: 765,
    radius: 72,
    description: 'Nơi xuất cấp, trả và kiểm tra sổ sách vật tư công',
    vietnameseLabel: 'KHO VẬT TƯ'
  },
  ZONE_A: {
    id: 'ZONE_A',
    name: 'Khu dân cư A',
    type: 'ZONE_A',
    x: 220,
    y: 255,
    radius: 72,
    description: '12 người dân mô phỏng - khảo sát nhu cầu y tế ban đầu',
    vietnameseLabel: 'KHU DÂN CƯ A (12 dân)'
  },
  ZONE_B: {
    id: 'ZONE_B',
    name: 'Khu dân cư B',
    type: 'ZONE_B',
    x: 1085,
    y: 335,
    radius: 72,
    description: '10 người dân mô phỏng - phía Đông thành phố',
    vietnameseLabel: 'KHU DÂN CƯ B (10 dân)'
  },
  ZONE_C: {
    id: 'ZONE_C',
    name: 'Khu dân cư C',
    type: 'ZONE_C',
    x: 655,
    y: 810,
    radius: 72,
    description: '8 người dân mô phỏng - gồm đại diện và hai người cao tuổi C1, C2',
    vietnameseLabel: 'KHU DÂN CƯ C (8 dân)'
  },
  CLINIC_FIXED: {
    id: 'CLINIC_FIXED',
    name: 'Điểm đặt Trạm y tế cố định',
    type: 'CLINIC_FIXED',
    x: 440,
    y: 300,
    radius: 72,
    description: 'Vị trí xây dựng Trạm y tế cố định theo phương án tập trung gần Khu A',
    vietnameseLabel: 'TRẠM Y TẾ CỐ ĐỊNH'
  },
  CLINIC_MOBILE_B: {
    id: 'CLINIC_MOBILE_B',
    name: 'Điểm lưu động B',
    type: 'CLINIC_MOBILE_B',
    x: 980,
    y: 330,
    radius: 72,
    description: 'Điểm tiếp nhận và triển khai tổ y tế lưu động phục vụ Khu B',
    vietnameseLabel: 'ĐIỂM LƯU ĐỘNG B'
  },
  CLINIC_MOBILE_C: {
    id: 'CLINIC_MOBILE_C',
    name: 'Điểm lưu động C',
    type: 'CLINIC_MOBILE_C',
    x: 540,
    y: 770,
    radius: 72,
    description: 'Điểm tiếp nhận và triển khai tổ y tế lưu động phục vụ Khu C',
    vietnameseLabel: 'ĐIỂM LƯU ĐỘNG C'
  },
  BRIDGE: {
    id: 'BRIDGE',
    name: 'Cầu qua kênh sang Khu B',
    type: 'BRIDGE',
    x: 885,
    y: 455,
    radius: 72,
    description: 'Cầu nối huyết mạch sang khu Đông. Khi hỏng cần sửa hoặc đi tuyến vòng.',
    vietnameseLabel: 'CẦU QUA KÊNH'
  },
  BRIDGE_TASK_1: {
    id: 'BRIDGE_TASK_1',
    name: 'Điểm sửa mố cầu phía Tây',
    type: 'BRIDGE_TASK_1',
    x: 845,
    y: 435,
    radius: 72,
    description: 'Công tác sửa chữa mố cầu phía Tây (Cần 1 kiện vật tư & nhân lực)',
    vietnameseLabel: 'SỬA MỐ CẦU TÂY'
  },
  BRIDGE_TASK_2: {
    id: 'BRIDGE_TASK_2',
    name: 'Điểm sửa dầm cầu',
    type: 'BRIDGE_TASK_2',
    x: 845,
    y: 475,
    radius: 72,
    description: 'Công tác gia cố dầm cầu (Cần 1 kiện vật tư & nhân lực)',
    vietnameseLabel: 'SỬA DẦM CẦU'
  },
  CITIZEN_C1: {
    id: 'CITIZEN_C1',
    name: 'Hộ gia đình Cụ C1',
    type: 'CITIZEN_C1',
    x: 600,
    y: 810,
    radius: 72,
    description: 'Người cao tuổi khó khăn vận động tại Khu C cần hỗ trợ y tế tận nhà',
    vietnameseLabel: 'HỘ DÂN C1'
  },
  CITIZEN_C2: {
    id: 'CITIZEN_C2',
    name: 'Hộ gia đình Cụ C2',
    type: 'CITIZEN_C2',
    x: 710,
    y: 810,
    radius: 72,
    description: 'Người cao tuổi neo đơn tại Khu C cần hỗ trợ y tế tận nơi',
    vietnameseLabel: 'HỘ DÂN C2'
  },
  PRACTICE_TARGET: {
    id: 'PRACTICE_TARGET',
    name: 'Điểm tập kết mẫu thực hành',
    type: 'PRACTICE_TARGET',
    x: 355,
    y: 350,
    radius: 72,
    description: 'Điểm giao kiện vật tư mẫu trong 60 giây tập dượt ban đầu',
    vietnameseLabel: 'ĐIỂM TẬP GIAO MẪU'
  }
};
